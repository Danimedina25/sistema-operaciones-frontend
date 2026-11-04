// Pasos de preparación (no se graban). Usan los módulos de la app desde el navegador, así que
// suben comprobantes y llaman a la API igual que la interfaz, con la sesión del rol indicado.
// IDs fijos de seed.sql (TRUNCATE reinicia los contadores).
import { readFileSync } from 'node:fs';

export const CLIENTES = { alejandro: 1, sofia: 2, miguel: 3 };
export const SOCIOS = { jorge: 1, mariana: 2 };
export const CUENTAS = { demo: 1, ejemplo: 2 };
export const USUARIOS = { socio: 101 };

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());

function fileArg(dir, name) {
  return { name, base64: readFileSync(dir + name).toString('base64') };
}

// Ejecuta fn(modulos, args) dentro de la página con la sesión iniciada.
async function inApp(page, BASE_URL, fn, args) {
  if (!page.url().startsWith(BASE_URL)) {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  }
  return page.evaluate(async ([source, input]) => {
    const api = await import('/src/modules/operations/api/operations.api.ts');
    const storage = await import('/src/modules/operations/api/operations-storage.api.ts');
    const { api: http } = await import('/src/shared/lib/axios.ts');
    const toFile = ({ name, base64 }) => new File([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], name, { type: 'image/png' });
    try {
      return await new Function('api', 'storage', 'toFile', 'input', 'http', `return (${source})(api, storage, toFile, input, http);`)(api, storage, toFile, input, http);
    } catch (error) {
      throw new Error(`${error.message}: ${JSON.stringify(error.response?.data ?? '')}`);
    }
  }, [fn.toString(), args]);
}

// Crea una operación del Socio con sus pagos. Devuelve { id, pagos: [id, ...] }.
export async function crearOperacion({ page, BASE_URL, comprobantes }, { clienteId, monto, pagos, nivel2 }) {
  const input = {
    socioId: USUARIOS.socio, clienteId, monto, nivel2, fecha: `${today}T00:00:00`,
    pagos: pagos.map(p => ({ ...p, file: fileArg(comprobantes, p.archivo) })),
  };
  return inApp(page, BASE_URL, async (api, storage, toFile, i) => {
    const operation = await api.createOperation({
      clienteId: i.clienteId, montoTotal: i.monto, socioComercialId: i.socioId,
      nivelesRedComercial: i.nivel2 ? 2 : 1, socioComercialNivel2Id: i.nivel2,
      // Mismos valores que seed.sql: oficina 1.5%, Laura 1%, socios secundarios 0.5%.
      porcentajeComisionOficina: 1.5, porcentajeComisionSocio: 1,
      porcentajeComisionSocioNivel2: i.nivel2 ? 0.5 : undefined,
    });
    const ids = [];
    for (const p of i.pagos) {
      const upload = await storage.uploadOperationProof({ file: toFile(p.file), userId: i.socioId, operationId: operation.id });
      const payment = await api.addOperationPayment({
        operacionId: operation.id, monto: p.monto, tipoPago: p.tipo, cuentaDestinoId: p.cuentaId ?? null,
        fechaComprobante: i.fecha, comprobanteUrl: upload.downloadUrl, ...p.cheque,
      });
      ids.push(payment.id);
    }
    return { id: operation.id, pagos: ids };
  }, input);
}

export async function validarPago({ page, BASE_URL, comprobantes }, { operacionId, pagoId, userId, archivo }) {
  return inApp(page, BASE_URL, async (api, storage, toFile, i) => {
    const upload = await storage.uploadOperationProof({ file: toFile(i.file), userId: i.userId, operationId: i.operacionId });
    await api.validatePayment(i.pagoId, { comprobanteValidacionUrl: upload.downloadUrl });
  }, { operacionId, pagoId, userId, file: fileArg(comprobantes, archivo) });
}

export async function rechazarPago({ page, BASE_URL }, { pagoId, motivo }) {
  return inApp(page, BASE_URL, async (api, storage, toFile, i) => {
    await api.rejectPayment(i.pagoId, { observaciones: i.motivo });
  }, { pagoId, motivo });
}

// Operación con un solo pago ya validado por la Jefa de Cuentas: queda lista para solicitar el retorno.
export async function operacionValidada({ session, BASE_URL, comprobantes }, { clienteId, monto, archivo, validacion }) {
  const socio = await session('socio@tutorial.test');
  const operacion = await crearOperacion({ page: socio.page, BASE_URL, comprobantes }, {
    clienteId, monto, pagos: [{ monto, tipo: 'TRANSFERENCIA', cuentaId: CUENTAS.demo, archivo }],
  });
  await socio.close();
  const cuentas = await session('cuentas@tutorial.test');
  await validarPago({ page: cuentas.page, BASE_URL, comprobantes }, { operacionId: operacion.id, pagoId: operacion.pagos[0], userId: 103, archivo: validacion });
  await cuentas.close();
  return operacion;
}

// La Jefa de Cuentas registra el código de retiro sin tarjeta por el total de la solicitud.
export async function registrarCodigoRetiro({ page, BASE_URL }, { operacionId, cuentaId, codigo }) {
  return inApp(page, BASE_URL, async (api, storage, toFile, i, http) => {
    const requests = await api.getReturnsByOperationId(i.operacionId);
    const request = requests.find(r => r.tipoPago === 'RETIRO_SIN_TARJETA');
    await http.post(`/api/operations/returns/requests/${request.id}/installments`, {
      monto: request.monto, cuentaOrigenId: i.cuentaId, codigoRetiroSinTarjeta: i.codigo,
    });
  }, { operacionId, cuentaId, codigo });
}

// Caja de hoy abierta con $100,000.00: 60×$1,000 + 40×$500 + 50×$200 + 50×$100 + 100×$50.
// La primera apertura de caja la registra Gerencia.
export const CONTEO_INICIAL = { D1000: 60, D500: 40, D200: 50, D100: 50, D50: 100, D20: 0, D10: 0, D5: 0, D2: 0, D1: 0, D050: 0 };
export async function abrirCaja({ session, BASE_URL }, fecha = today) {
  const gerente = await session('gerente@tutorial.test');
  const day = await inApp(gerente.page, BASE_URL, async (api, storage, toFile, i) => {
    const { cajaGeneralApi } = await import('/src/modules/caja-general/api/caja-general.api.ts');
    return cajaGeneralApi.open({ fecha: i.fecha, saldoInicial: 100000, denominaciones: i.conteo });
  }, { fecha, conteo: CONTEO_INICIAL });
  await gerente.close();
  return day;
}

// El Socio solicita el retorno en efectivo de la operación. Devuelve el id de la solicitud.
export async function solicitarRetornoEfectivo({ session, BASE_URL }, { operacionId, monto }) {
  const socio = await session('socio@tutorial.test');
  const requestId = await inApp(socio.page, BASE_URL, async (api, storage, toFile, i) => {
    const [request] = await api.requestReturnPayment(i.operacionId, { pagos: [{
      monto: i.monto, tipoPago: 'EFECTIVO',
      autorizadoParaRecibirEfectivo1: 'Carlos Ramírez', autorizadoParaRecibirEfectivo2: 'Ana López',
    }] });
    return request.id;
  }, { operacionId, monto });
  await socio.close();
  return requestId;
}

// Deja un retorno en efectivo entregado por Caja y pendiente de la confirmación del Socio.
export async function entregaEfectivoLista(ctx) {
  const { session, BASE_URL, comprobantes } = ctx;
  await abrirCaja(ctx);
  const operacion = await operacionValidada(ctx, { clienteId: CLIENTES.sofia, monto: 30000, archivo: 'transferencia-sofia-30000.png', validacion: 'validacion-sofia-30000.png' });
  const requestId = await solicitarRetornoEfectivo(ctx, { operacionId: operacion.id, monto: 29250 });

  const cajas = await session('cajas@tutorial.test');
  await inApp(cajas.page, BASE_URL, async (api, storage, toFile, i) => {
    const preparado = await storage.uploadOperationProof({ file: toFile(i.preparado), userId: 102, operationId: i.operacionId });
    const installment = await api.createReturnInstallment(i.requestId, {
      monto: 29250, evidenciaImportePreparadoUrl: preparado.downloadUrl, fechaHoraRecoleccion: `${i.fecha}T12:00:00`,
    });
    const acuse = await storage.uploadOperationProof({ file: toFile(i.acuse), userId: 102, operationId: i.operacionId, folder: 'comprobantes-entrega-efectivo' });
    await api.deliverReturnInstallment(installment.id, {
      comprobanteEntregaUrl: acuse.downloadUrl, personaQueRecibioEfectivo: 'Carlos Ramírez',
      denominaciones: { D1000: 29, D500: 0, D200: 1, D100: 0, D50: 1, D20: 0, D10: 0, D5: 0, D2: 0, D1: 0, D050: 0 },
    });
  }, {
    operacionId: operacion.id, requestId, fecha: today,
    preparado: fileArg(comprobantes, 'importe-preparado-29250.png'), acuse: fileArg(comprobantes, 'acuse-entrega-29250.png'),
  });
  await cajas.close();
  return operacion;
}
