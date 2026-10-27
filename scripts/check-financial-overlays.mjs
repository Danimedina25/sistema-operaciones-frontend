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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '/src/modules/auth/store/auth.context.tsx';
import { api } from '/src/shared/lib/axios.ts';
import { BankTransferModal } from '/src/modules/corte/components/BankTransferModal.tsx';
import { RegisterWithdrawalModal } from '/src/modules/corte/components/RegisterWithdrawalModal.tsx';
import { EditWithdrawalModal } from '/src/modules/corte/components/EditWithdrawalModal.tsx';
import { ConfirmWithdrawalModal } from '/src/modules/caja-general/components/ConfirmWithdrawalModal.tsx';
import { EditCashBankDepositModal } from '/src/modules/cash-bank-deposits/EditCashBankDepositModal.tsx';
import { ReasonModal } from '/src/modules/cash-withdrawals/ReasonModal.tsx';
import { emptyCounts } from '/src/modules/caja-general/utils/cash-amounts.ts';
import '/src/styles/index.css';
const accounts = [{ id: 9, banco: 'BANORTE', titular: 'Oficina', numeroCuenta: '12348998', activo: true }];
api.defaults.adapter = async config => {
 if ((config.method || 'get') !== 'get') throw Error('Fixture: escritura bloqueada');
 return { data: { data: config.url.includes('balance') ? { saldoFinal: 5000 } : config.url.includes('bank-accounts') ? accounts : [] }, status: 200, statusText: 'OK', headers: {}, config };
};
const flow = new URLSearchParams(location.search).get('flow');
const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const withdrawal = { id: 7, bankAccountId: 9, banco: 'BANORTE', cuentaNumero: '12348998', cuentaTitular: 'Oficina', forma: 'RETIRO_CON_TARJETA', monto: 1200, version: 2, referencia: 'ABC', comprobanteUrl: null, registradoPorNombre: 'Jefa de Cuentas' };
const deposit = { id: 12, bankAccountId: 9, forma: 'VENTANILLA', monto: 300, version: 2, referencia: 'ABC', comprobanteSalidaUrl: '', denominaciones: { ...emptyCounts(), D100: 3 } };
const noop = () => {};
function Content() {
 const auth = useAuth();
 useEffect(() => { auth.login({ token: 'fixture', userId: 4, correo: 'fixture@example.test', nombre: 'Prueba', roles: ['JEFA_CUENTAS'] }); }, []);
 if (flow === 'transfer') return h(BankTransferModal, { open: true, onClose: noop, onSubmit: async () => { throw Error('Fixture'); } });
 if (flow === 'register') return h(RegisterWithdrawalModal, { open: true, onClose: noop, onSubmit: async () => { throw Error('Fixture'); } });
 if (flow === 'edit-withdrawal') return h(EditWithdrawalModal, { withdrawal, onClose: noop, onSaved: async () => {} });
 if (flow === 'edit-deposit') return h(EditCashBankDepositModal, { deposit, accounts, onClose: noop, onSaved: async () => {} });
 if (flow === 'reason') return h(ReasonModal, { open: true, title: 'Rechazar retiro', description: 'Retiro de $1,200.00 de BANORTE para Caja General.', confirmLabel: 'Rechazar retiro', onClose: noop, onConfirm: async () => {} });
 return h(ConfirmWithdrawalModal, { withdrawal, onClose: noop, onConfirm: async () => {} });
}
flushSync(() => createRoot(document.getElementById('root')).render(h(AuthProvider, null, h(QueryClientProvider, { client: query }, h(Content)))));
setTimeout(() => {
 try {
  const dialog = document.querySelector('[role="dialog"]');
  const footer = dialog.querySelector('footer');
  const body = [...dialog.children].find(node => getComputedStyle(node).overflowY === 'auto');
  const bounds = footer.getBoundingClientRect();
  const result = { width: innerWidth, noHorizontalScroll: dialog.scrollWidth <= dialog.clientWidth && body.scrollWidth <= body.clientWidth, footerVisible: bounds.top >= 0 && bounds.bottom <= innerHeight, footerOutsideScroll: !body.contains(footer), whiteHeader: getComputedStyle(dialog.querySelector('header')).backgroundColor === 'rgb(255, 255, 255)', singleAction: footer.querySelectorAll('button[type="submit"]').length === 1 };
  document.getElementById('result').textContent = JSON.stringify(result);
 } catch (error) { document.getElementById('result').textContent = JSON.stringify({ error: error.message }); }
}, 1200);
`;

const server = await createServer({ appType: 'custom', server: { host: '127.0.0.1', port: 5197, strictPort: true, open: false }, plugins: [{
 name: 'financial-pattern-fixture',
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
 for (const width of [500, 1440]) for (const flow of ['transfer', 'register', 'edit-withdrawal', 'confirm', 'edit-deposit', 'reason']) {
  const path = `/tmp/financial-${flow}-${width}.png`;
  const output = await new Promise((resolve, reject) => {
   const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=8000', `--window-size=${width},1000`, `--screenshot=${path}`, '--dump-dom', `http://127.0.0.1:5197/__pilot?flow=${flow}`]);
   let stdout = '', stderr = '';
   const timeout = setTimeout(() => { child.kill(); reject(new Error('Chrome excedió el tiempo de comprobación')); }, 30000);
   child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
   child.on('error', reject); child.on('close', () => { clearTimeout(timeout); resolve({ stdout, stderr }); });
  });
  const raw = output.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];
  if (!raw) throw Error(`No se pudo comprobar el piloto: ${output.stderr.slice(-300)}`);
  const result = JSON.parse(raw.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  if (result.error || result.width !== width || Object.entries(result).some(([key, value]) => key !== 'width' && value !== true)) throw Error(JSON.stringify(result));
  process.stdout.write(`${flow}, ${width}px: acciones fijas, encabezado común y sin desbordamiento. Captura: ${path}\n`);
 }
} finally { await server.close(); }
