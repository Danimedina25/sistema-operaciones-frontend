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
    const toFile = ({ name, base64 }) => new File([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], name, { type: 'image/png' });
    try {
      return await new Function('api', 'storage', 'toFile', 'input', `return (${source})(api, storage, toFile, input);`)(api, storage, toFile, input);
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
        fechaComprobante: i.fecha, comprobanteUrl: upload.downloadUrl,
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
