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
      ['Ordenante', 'Comercializadora Alfa'],
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
      ['Depositante', 'Comercializadora Alfa'],
      ['Titular de la cuenta', 'Oficina Demo SA de CV'],
      ['Cuenta', '•••• 5678'],
      ['Forma de depósito', 'Efectivo en ventanilla'],
      ['Folio', 'EJ-004512'],
    ],
  },
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
