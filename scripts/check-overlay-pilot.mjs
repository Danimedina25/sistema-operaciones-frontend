import { createServer } from 'vite';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

// El piloto usa datos sintéticos y la pantalla real, sin consultar ni modificar el backend.
const chrome = process.env.CHROME_BIN ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!chrome) throw new Error('Se necesita Chrome para comprobar el piloto.');
const fixture = `
import { createElement as h, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '/src/modules/auth/store/auth.context.tsx';
import { CashBankDepositIncome } from '/src/modules/cash-bank-deposits/CashBankDepositIncome.tsx';
import { cashBankDepositsApi } from '/src/modules/cash-bank-deposits/api.ts';
import '/src/styles/index.css';
const row = { id: 12, origen: 'EFECTIVO_CAJA', cuenta: 'BANORTE ••4210', cuentaTitular: 'ARIEL OVANDO PEREZ', monto: 1000, forma: 'CAJERO', referencia: 'PRUEBA-LOCAL-PENDIENTE', comprobanteSalidaUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', estatus: 'PENDIENTE', registradoEn: '2026-10-15T13:54:00', registradoPorNombre: 'Jefa de Cajas' };
cashBankDepositsApi.pending = async () => [row];
const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
function Content() {
 const auth = useAuth();
 useEffect(() => { auth.login({ token: 'fixture-local', userId: 4, correo: 'fixture@example.test', nombre: 'Prueba', roles: ['JEFA_CUENTAS'] }); }, []);
 return h(CashBankDepositIncome);
}
flushSync(() => createRoot(document.getElementById('root')).render(h(AuthProvider, null, h(QueryClientProvider, { client: query }, h(MemoryRouter, null, h(Content))))));
function check(attempt = 0) {
 try {
  const button = [...document.querySelectorAll('button')].find(node => node.textContent === 'Confirmar' && node.getBoundingClientRect().width > 0);
  if (!button) { if (attempt < 40) return setTimeout(() => check(attempt + 1), 100); throw Error('No aparece el botón de confirmación'); }
  flushSync(() => button.click());
  const dialog = document.querySelector('[role="dialog"]');
  flushSync(() => [...dialog.querySelectorAll('button')].find(node => node.textContent === 'Confirmar depósito').click());
  setTimeout(() => {
   try {
    const summary = dialog.querySelector('[aria-label="Resumen del envío"]');
    const footer = dialog.querySelector('footer');
    const body = [...dialog.children].find(node => getComputedStyle(node).overflowY === 'auto');
    const bounds = footer.getBoundingClientRect();
    const result = { width: innerWidth, noHorizontalScroll: dialog.scrollWidth <= dialog.clientWidth, footerVisible: bounds.top >= 0 && bounds.bottom <= innerHeight, footerOutsideScroll: !body.contains(footer), summarySticky: getComputedStyle(summary).position === 'sticky', errorVisible: !!summary.querySelector('[role="alert"]'), uniqueAmount: dialog.textContent.split('$1,000.00').length === 2, whiteHeader: getComputedStyle(dialog.querySelector('header')).backgroundColor === 'rgb(255, 255, 255)' };
    document.getElementById('result').textContent = JSON.stringify(result);
   } catch (error) { document.getElementById('result').textContent = JSON.stringify({ error: error.message }); }
  }, 100);
 } catch (error) { document.getElementById('result').textContent = JSON.stringify({ error: error.message }); }
}
setTimeout(check, 200);
`;
const server = await createServer({ appType: 'custom', server: { host: '127.0.0.1', port: 5198, strictPort: true, open: false }, plugins: [{
 name: 'overlay-pilot-fixture',
 resolveId(id) { if (id === '/__pilot.js') return id; },
 load(id) { if (id === '/__pilot.js') return fixture; },
 configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
  if (!req.url?.startsWith('/__pilot?')) return next();
  res.setHeader('Content-Type', 'text/html');
  res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><output id="result"></output><script type="module" src="/__pilot.js"></script></body></html>'));
 }); },
}] });
try {
 await server.listen();
 for (const width of [500, 1440]) {
  const path = `/tmp/deposit-pilot-${width}.png`;
  const output = await new Promise((resolve, reject) => {
   const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=8000', `--window-size=${width},1000`, `--screenshot=${path}`, '--dump-dom', 'http://127.0.0.1:5198/__pilot?test=1']);
   let stdout = '', stderr = '';
   const timeout = setTimeout(() => { child.kill(); reject(new Error('Chrome excedió el tiempo de comprobación')); }, 30000);
   child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
   child.on('error', reject); child.on('close', () => { clearTimeout(timeout); resolve({ stdout, stderr }); });
  });
  const raw = output.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];
  if (!raw) throw Error(`No se pudo comprobar el piloto: ${output.stderr.slice(-300)}`);
  const result = JSON.parse(raw.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  if (result.error || result.width !== width || Object.entries(result).some(([key, value]) => key !== 'width' && value !== true)) throw Error(JSON.stringify(result));
  process.stdout.write(`${width}px: resumen y error visibles, monto único, pie fijo y sin desbordamiento. Captura: ${path}\n`);
 }
} finally { await server.close(); }
