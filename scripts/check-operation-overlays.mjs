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
import { AddOperationPaymentForm } from '/src/modules/operations/components/AddOperationPaymentForm.tsx';
import { UpdateOperationPaymentForm } from '/src/modules/operations/components/UpdateOperationPaymentForm.tsx';
import { PaymentsTable } from '/src/modules/operations/components/PaymentsTable.tsx';
import { RequestReturnModal } from '/src/modules/operations/components/returns/RequestReturnModal.tsx';
import { EditReturnPaymentForm } from '/src/modules/operations/components/returns/EditReturnPaymentForm.tsx';
import { ReturnPaymentModal } from '/src/modules/operations/components/returns/ReturnPaymentModal.tsx';
import '/src/styles/index.css';
const accounts = [{ id: 9, banco: 'BANORTE', titular: 'Oficina', numeroCuenta: '12348998', activo: true }];
api.defaults.adapter = async config => {
 if ((config.method || 'get') !== 'get') throw Error('Fixture: escritura bloqueada');
 return { data: { data: config.url.includes('cardless-accounts') || config.url.includes('bank-accounts') ? accounts : [] }, status: 200, statusText: 'OK', headers: {}, config };
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
 if (flow === 'income') return wrap('Registrar pago de ingreso', h(AddOperationPaymentForm, { isSubmitting: false, bankAccounts: [], montoTotal: 1000, montoRegistrado: 600, saldoPendiente: 400, onCancel: noop, onSubmit: save }));
 if (flow === 'edit-income') return wrap('Editar pago de ingreso', h(UpdateOperationPaymentForm, { isSubmitting: false, bankAccounts: [], operation, payment, onCancel: noop, onSubmit: save }));
 if (flow === 'request') return h(RequestReturnModal, { open: true, operation, isSubmitting: false, onClose: noop, onSubmit: save });
 if (flow === 'edit-return') return wrap('Editar solicitud de retorno', h(EditReturnPaymentForm, { payment: request, clientId: 1, isSubmitting: false, onCancel: noop, onSubmit: save }));
 if (flow === 'validate') return h(PaymentsTable, { reviewOnly: true, payments: [payment], operationId: 47, initialReviewPaymentId: 11, onValidatePayment: save });
 return h(ReturnPaymentModal, { open: true, variant: 'manage', returnRequest: { ...request, tipoPago: flow === 'bank-return' ? 'TRANSFERENCIA' : flow === 'cardless' ? 'RETIRO_SIN_TARJETA' : 'EFECTIVO' }, installments: [], canManageReturnPayments: true, isSubmittingInstallment: false, onSubmitInstallment: save, canConfirm: () => false, canDeliver: () => false, canCancel: () => false, onConfirm: noop, onDeliver: noop, onCancel: noop, onClose: noop });
}
flushSync(() => createRoot(document.getElementById('root')).render(h(AuthProvider, null, h(QueryClientProvider, { client: query }, h(MemoryRouter, null, h(Content))))));
setTimeout(() => {
 try {
  const dialog = document.querySelector('[role="dialog"]');
  const footer = dialog.querySelector('footer');
  const body = [...dialog.children].find(node => getComputedStyle(node).overflowY === 'auto');
  const bounds = footer.getBoundingClientRect();
  const result = { width: innerWidth, noHorizontalScroll: dialog.scrollWidth <= dialog.clientWidth && body.scrollWidth <= body.clientWidth, footerVisible: bounds.top >= 0 && bounds.bottom <= innerHeight, footerOutsideScroll: !body.contains(footer), whiteHeader: getComputedStyle(dialog.querySelector('header')).backgroundColor === 'rgb(255, 255, 255)', cancelPresent: [...footer.querySelectorAll('button')].some(button => button.textContent === 'Cancelar') };
  document.getElementById('result').textContent = JSON.stringify(result);
 } catch (error) { document.getElementById('result').textContent = JSON.stringify({ error: error.message }); }
}, 1400);
`;

const server = await createServer({ appType: 'custom', server: { host: '127.0.0.1', port: 5196, strictPort: true, open: false }, plugins: [{
 name: 'operation-pattern-fixture',
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
 for (const width of [500, 1440]) for (const flow of ['income', 'edit-income', 'request', 'edit-return', 'validate', 'cash-return', 'bank-return', 'cardless']) {
  const path = `/tmp/operation-${flow}-${width}.png`;
  const output = await new Promise((resolve, reject) => {
   const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=8000', `--window-size=${width},1000`, `--screenshot=${path}`, '--dump-dom', `http://127.0.0.1:5196/__pilot?flow=${flow}`]);
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
