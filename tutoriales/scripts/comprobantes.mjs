// Genera comprobantes ficticios (PNG) para los tutoriales.
// Uso: node tutoriales/scripts/comprobantes.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const outDir = fileURLToPath(new URL('../comprobantes/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const fecha = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', year: 'numeric',
}).format(new Date()).replace('.', '');

const comprobantes = [
  {
    archivo: 'transferencia-100000.png',
    banco: 'BANCO DEMO',
    color: '#1d4ed8',
    titulo: 'Comprobante de transferencia SPEI',
    monto: '$100,000.00',
    filas: [
      ['Fecha de operación', `${fecha}, 10:42`],
      ['Ordenante', 'Alejandro Torres'],
      ['Cuenta ordenante', '•••• 2021'],
      ['Beneficiario', 'Oficina Demo SA de CV'],
      ['Banco destino', 'BANCO DEMO'],
      ['Cuenta destino', '•••• 1234'],
      ['Concepto', 'Pago operación'],
      ['Clave de rastreo', 'DEMO20261103000123'],
    ],
  },
  {
    archivo: 'deposito-50000.png',
    banco: 'BANCO EJEMPLO',
    color: '#047857',
    titulo: 'Ficha de depósito',
    monto: '$50,000.00',
    filas: [
      ['Fecha', `${fecha}, 12:15`],
      ['Sucursal', '0001 · Centro'],
      ['Depositante', 'Alejandro Torres'],
      ['Titular de la cuenta', 'Oficina Demo SA de CV'],
      ['Cuenta', '•••• 5678'],
      ['Forma de depósito', 'Efectivo en ventanilla'],
      ['Folio', 'EJ-004512'],
    ],
  },
  // Preparación del tutorial 01: pagos de otras operaciones y la validación de Cuentas.
  ...[
    ['transferencia-sofia-50000.png', 'Sofía Herrera', '$50,000.00', '•••• 2032', 'DEMO20261104000201'],
    ['transferencia-miguel-60000.png', 'Miguel Castro', '$60,000.00', '•••• 2043', 'DEMO20261104000202'],
    ['transferencia-alejandro-40000.png', 'Alejandro Torres', '$40,000.00', '•••• 2021', 'DEMO20261104000203'],
    ['transferencia-sofia-30000.png', 'Sofía Herrera', '$30,000.00', '•••• 2032', 'DEMO20261104000204'],
  ].map(([archivo, ordenante, monto, cuenta, rastreo]) => ({
    archivo,
    banco: 'BANCO DEMO',
    color: '#1d4ed8',
    titulo: 'Comprobante de transferencia SPEI',
    monto,
    filas: [
      ['Fecha de operación', `${fecha}, 09:30`],
      ['Ordenante', ordenante],
      ['Cuenta ordenante', cuenta],
      ['Beneficiario', 'Oficina Demo SA de CV'],
      ['Banco destino', 'BANCO DEMO'],
      ['Cuenta destino', '•••• 1234'],
      ['Concepto', 'Pago operación'],
      ['Clave de rastreo', rastreo],
    ],
  })),
  // Tutorial 04: lo que registra Caja al preparar y entregar el efectivo.
  {
    archivo: 'importe-preparado-29250.png',
    banco: 'OFICINA DEMO',
    color: '#0f172a',
    titulo: 'Caja General · Importe preparado',
    monto: '$29,250.00',
    filas: [
      ['Fecha', `${fecha}, 11:20`],
      ['Cliente', 'Sofía Herrera'],
      ['Billetes de $1,000', '29'],
      ['Billetes de $200', '1'],
      ['Monedas de $50', '1'],
    ],
  },
  {
    archivo: 'acuse-entrega-29250.png',
    banco: 'OFICINA DEMO',
    color: '#0f172a',
    titulo: 'Acuse de entrega de efectivo',
    monto: '$29,250.00',
    filas: [
      ['Fecha', `${fecha}, 12:05`],
      ['Cliente', 'Sofía Herrera'],
      ['Recibió', 'Carlos Ramírez'],
      ['Identificación', 'INE •••• 4410'],
      ['Entregó', 'Patricia Ruiz · Caja General'],
      ['Firma de quien recibe', 'Carlos Ramírez'],
    ],
  },
  // Tanda de la Jefa de Cajas.
  {
    archivo: 'recibo-efectivo-25000.png', banco: 'OFICINA DEMO', color: '#0f172a',
    titulo: 'Recibo de efectivo del cliente', monto: '$25,000.00',
    filas: [['Fecha', `${fecha}, 10:15`], ['Cliente', 'Alejandro Torres'], ['Recibió', 'Laura Méndez · Socio Comercial'], ['Billetes de $1,000', '25']],
  },
  {
    archivo: 'validacion-caja-25000.png', banco: 'OFICINA DEMO', color: '#047857',
    titulo: 'Caja General · Entrada validada', monto: '$25,000.00',
    filas: [['Fecha', `${fecha}, 10:40`], ['Cliente', 'Alejandro Torres'], ['Contó', 'Patricia Ruiz'], ['Billetes de $1,000', '25']],
  },
  {
    archivo: 'cheque-45000.png', banco: 'BANCO EJEMPLO', color: '#047857',
    titulo: 'Cheque nominativo', monto: '$45,000.00',
    filas: [['No. de cheque', '0001234'], ['Fecha', fecha], ['Páguese a', 'Oficina Demo SA de CV'], ['Emisor', 'Miguel Castro'], ['Cuenta del emisor', '•••• 3021'], ['Cantidad con letra', 'Cuarenta y cinco mil pesos 00/100 M.N.']],
  },
  {
    archivo: 'validacion-cheque-45000.png', banco: 'OFICINA DEMO', color: '#047857',
    titulo: 'Caja General · Cheque cobrado en efectivo', monto: '$45,000.00',
    filas: [['Fecha', `${fecha}, 11:05`], ['Cheque', '0001234 · BANCO EJEMPLO'], ['Cliente', 'Miguel Castro'], ['Billetes de $1,000', '45']],
  },
  {
    archivo: 'ficha-deposito-50000.png', banco: 'BANCO DEMO', color: '#1d4ed8',
    titulo: 'Ficha de depósito en efectivo', monto: '$50,000.00',
    filas: [['Fecha', `${fecha}, 13:30`], ['Sucursal', '0001 · Centro'], ['Depositante', 'Oficina Demo SA de CV'], ['Cuenta', '•••• 1234'], ['Forma', 'Efectivo en ventanilla'], ['Folio', 'EJ-778120']],
  },
  // Tanda de la Jefa de Cuentas.
  {
    archivo: 'transferencia-salida-58500.png', banco: 'BANCO DEMO', color: '#1d4ed8',
    titulo: 'Comprobante de transferencia SPEI', monto: '$58,500.00',
    filas: [['Fecha de operación', `${fecha}, 14:10`], ['Ordenante', 'Oficina Demo SA de CV'], ['Cuenta ordenante', '•••• 1234'], ['Beneficiario', 'Miguel Castro'], ['CLABE destino', '•••• 4011'], ['Concepto', 'Retorno de operación'], ['Clave de rastreo', 'DEMO20261104005801']],
  },
  {
    archivo: 'cargo-codigo-39000.png', banco: 'BANCO DEMO', color: '#1d4ed8',
    titulo: 'Movimiento en cuenta · Cargo', monto: '$39,000.00',
    filas: [['Fecha', `${fecha}, 15:02`], ['Cuenta', 'Oficina Demo SA de CV · •••• 1234'], ['Tipo de movimiento', 'Retiro sin tarjeta cobrado'], ['Código', 'DEMO-4821-7730']],
  },
  {
    archivo: 'retiro-20000.png', banco: 'BANCO DEMO', color: '#1d4ed8',
    titulo: 'Comprobante de retiro en ventanilla', monto: '$20,000.00',
    filas: [['Fecha', `${fecha}, 11:45`], ['Sucursal', '0001 · Centro'], ['Cuenta', 'Oficina Demo SA de CV · •••• 1234'], ['Retiró', 'Gabriela Soto'], ['Folio', 'RT-552031']],
  },
  {
    archivo: 'transferencia-interna-15000.png', banco: 'BANCO DEMO', color: '#1d4ed8',
    titulo: 'Comprobante de transferencia SPEI', monto: '$15,000.00',
    filas: [['Fecha de operación', `${fecha}, 16:20`], ['Ordenante', 'Oficina Demo SA de CV · •••• 1234'], ['Beneficiario', 'Oficina Demo SA de CV'], ['Banco destino', 'BANCO EJEMPLO · •••• 5678'], ['Clave de rastreo', 'DEMO20261104009001']],
  },
  {
    archivo: 'abono-envio-50000.png', banco: 'BANCO DEMO', color: '#1d4ed8',
    titulo: 'Movimiento en cuenta · Abono', monto: '$50,000.00',
    filas: [['Fecha', `${fecha}, 13:40`], ['Cuenta', 'Oficina Demo SA de CV · •••• 1234'], ['Tipo de movimiento', 'Depósito en efectivo'], ['Folio', 'EJ-778120']],
  },
  // Tanda de Gerente y Director.
  {
    archivo: 'transferencia-comision-900.png', banco: 'BANCO DEMO', color: '#1d4ed8',
    titulo: 'Comprobante de transferencia SPEI', monto: '$900.00',
    filas: [['Fecha de operación', `${fecha}, 10:05`], ['Ordenante', 'Oficina Demo SA de CV · •••• 1234'], ['Beneficiario', 'Laura Méndez'], ['Cuenta destino', 'BANCO DEMO · •••• 1011'], ['Concepto', 'Comisiones 25 – 31 oct'], ['Clave de rastreo', 'DEMO20261104010001']],
  },
  // Validaciones de Cuentas: el abono que se ve en el estado de cuenta.
  ...[
    ['validacion-miguel-60000.png', 'Miguel Castro', '$60,000.00', 'DEMO20261104000202'],
    ['validacion-alejandro-40000.png', 'Alejandro Torres', '$40,000.00', 'DEMO20261104000203'],
    ['validacion-sofia-30000.png', 'Sofía Herrera', '$30,000.00', 'DEMO20261104000204'],
  ].map(([archivo, ordenante, monto, rastreo]) => ({
    archivo,
    banco: 'BANCO DEMO',
    color: '#1d4ed8',
    titulo: 'Movimiento en cuenta · Abono',
    monto,
    filas: [
      ['Fecha', `${fecha}, 09:31`],
      ['Cuenta', 'Oficina Demo SA de CV · •••• 1234'],
      ['Tipo de movimiento', 'Abono SPEI recibido'],
      ['Ordenante', ordenante],
      ['Clave de rastreo', rastreo],
    ],
  })),
];

function html(c) {
  const filas = c.filas.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #e2e8f0; font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
    .ticket { position: relative; width: 640px; margin: 24px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(15,23,42,.15); }
    header { background: ${c.color}; color: #fff; padding: 24px 32px; }
    header .banco { font-size: 26px; font-weight: 800; letter-spacing: .04em; }
    header .titulo { margin-top: 4px; font-size: 16px; opacity: .9; }
    .monto { padding: 24px 32px 8px; font-size: 14px; color: #475569; }
    .monto strong { display: block; margin-top: 4px; font-size: 40px; color: #0f172a; }
    table { width: calc(100% - 64px); margin: 8px 32px 24px; border-collapse: collapse; font-size: 15px; }
    th { text-align: left; color: #64748b; font-weight: 500; padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 45%; }
    td { color: #0f172a; font-weight: 600; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    footer { padding: 16px 32px 24px; font-size: 12px; color: #94a3b8; }
    .sello { position: absolute; top: 46%; left: 50%; transform: translate(-50%,-50%) rotate(-18deg);
      font-size: 96px; font-weight: 900; color: rgba(220,38,38,.18); border: 8px solid rgba(220,38,38,.18);
      padding: 4px 28px; border-radius: 16px; letter-spacing: .08em; }
  </style></head><body><div class="ticket">
    <header><div class="banco">${c.banco}</div><div class="titulo">${c.titulo}</div></header>
    <div class="monto">Importe<strong>${c.monto}</strong></div>
    <table>${filas}</table>
    <footer>Documento ficticio para capacitación. No tiene validez.</footer>
    <div class="sello">EJEMPLO</div>
  </div></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const c of comprobantes) {
  await page.setContent(html(c));
  await page.locator('.ticket').screenshot({ path: outDir + c.archivo });
  console.log('Generado', c.archivo);
}
await browser.close();
