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
import { api } from '/src/shared/lib/axios.ts';
import { ActionDrawer } from '/src/shared/components/ui/ActionDrawer.tsx';
import { PayBeneficiaryCommissionsModal } from '/src/modules/comisionessocioscomerciales/components/PayBeneficiaryCommissionsModal.tsx';
import { BeneficiaryCommissionDetailModal } from '/src/modules/comisionessocioscomerciales/components/BeneficiaryCommissionDetailModal.tsx';
import '/src/styles/index.css';
const detail = { beneficiaryId: 2, beneficiaryName: 'Socio de prueba', beneficiaryType: 'COMMERCIAL_PARTNER', totalOperations: 1, totalCommission: 12.5, operations: [{ commissionId: 7, operationId: 47, clienteNombre: 'Cliente de prueba', operationDate: '2026-10-02', nivel: 1, operationAmount: 1000, commissionPercentage: 1.25, commissionAmount: 12.5 }] };
const beneficiary = { beneficiaryId: 2, beneficiaryType: 'COMMERCIAL_PARTNER', nombre: 'Socio de prueba', banco: 'BANORTE', cuentaBancaria: '12348998', totalOperaciones: 1, totalPendientes: 12.5, commissionIdsToPay: [7] };
const accounts = [{ id: 9, banco: 'BANORTE', titular: 'Oficina', numeroCuenta: '12348998', activo: true }];
api.defaults.adapter = async config => {
 if ((config.method || 'get') !== 'get') throw Error('Fixture: escritura bloqueada');
 return { data: { data: config.url.includes('cardless-accounts') || config.url.includes('bank-accounts') ? accounts : detail }, status: 200, statusText: 'OK', headers: {}, config };
};
const flow = new URLSearchParams(location.search).get('flow');
const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const noop = () => {};
const save = async () => { throw Error('Fixture'); };
const operation = { id: 47, clienteId: 1, clienteNombre: 'Cliente de prueba', montoTotal: 1000, montoRegistrado: 600, saldoPendientePorRegistrar: 400, montoTotalDevolverCliente: 975, montoSolicitadoRetorno: 0 };
const payment = { id: 11, monto: 600, tipoPago: 'EFECTIVO', estatus: 'PENDIENTE_VALIDACION', fechaComprobante: '2026-10-21T10:00:00', registradoPorNombre: 'Socio de prueba', cuentaDestinoId: 0, comprobanteUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' };
const request = { id: 39, operationId: 47, clientId: 1, clienteNombre: 'Cliente de prueba', monto: 500, montoSolicitado: 500, montoDisponible: 500, montoPendiente: 500, montoRetornado: 0, montoEnProceso: 0, estatus: 'SOLICITADO', tipoPago: 'EFECTIVO', autorizadoParaRecibirEfectivo1: 'Ana', cuentaDestinoTitular: 'Cliente de prueba', cuentaDestinoBanco: 'BANORTE', cuentaClabeCliente: '072000000000000000' };
const wrap = (title, children) => h(ActionDrawer, { open: true, title, onClose: noop }, children);
function Content() {
 const auth = useAuth();
 useEffect(() => { auth.login({ token: 'fixture', userId: 4, correo: 'fixture@example.test', nombre: 'Prueba', roles: ['ADMIN'] }); }, []);
 return flow === 'pay' ? h(PayBeneficiaryCommissionsModal, { open: true, beneficiary, startDate: '2026-10-01', endDate: '2026-10-14', onClose: noop, onSubmit: save }) : h(BeneficiaryCommissionDetailModal, { open: true, detail, isLoading: false, startDate: '2026-10-01', endDate: '2026-10-14', onClose: noop });
}
flushSync(() => createRoot(document.getElementById('root')).render(h(AuthProvider, null, h(QueryClientProvider, { client: query }, h(MemoryRouter, null, h(Content))))));
setTimeout(() => {
 try {
  const dialog = document.querySelector('[role="dialog"]');
  const footer = dialog.querySelector('footer');
  const body = [...dialog.children].find(node => getComputedStyle(node).overflowY === 'auto');
  const bounds = footer.getBoundingClientRect();
  const result = { width: innerWidth, noHorizontalScroll: dialog.scrollWidth <= dialog.clientWidth && body.scrollWidth <= body.clientWidth, footerVisible: bounds.top >= 0 && bounds.bottom <= innerHeight, footerOutsideScroll: !body.contains(footer), whiteHeader: getComputedStyle(dialog.querySelector('header')).backgroundColor === 'rgb(255, 255, 255)', cancelPresent: [...footer.querySelectorAll('button')].some(button => ['Cancelar', 'Cerrar'].includes(button.textContent)) };
  document.getElementById('result').textContent = JSON.stringify(result);
 } catch (error) { document.getElementById('result').textContent = JSON.stringify({ error: error.message }); }
}, 1400);
`;

const server = await createServer({ appType: 'custom', server: { host: '127.0.0.1', port: 5195, strictPort: true, open: false }, plugins: [{
 name: 'commission-pattern-fixture',
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
 for (const width of [500, 1440]) for (const flow of ['pay', 'detail']) {
  const path = `/tmp/commission-${flow}-${width}.png`;
  const output = await new Promise((resolve, reject) => {
   const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=8000', `--window-size=${width},1000`, `--screenshot=${path}`, '--dump-dom', `http://127.0.0.1:5195/__pilot?flow=${flow}`]);
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
