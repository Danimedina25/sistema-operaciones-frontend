import { createServer } from 'vite';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const chrome = process.env.CHROME_BIN ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!chrome) throw new Error('Se necesita Chrome para comprobar las capas reales.');
const fixture = `
import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Modal } from '/src/shared/components/ui/Modal.tsx';
import { ActionDrawer } from '/src/shared/components/ui/ActionDrawer.tsx';
import '/src/styles/index.css';
const nested = new URLSearchParams(location.search).has('nested');
function App() {
 const [open, setOpen] = useState(false);
 const confirm = h(Modal, { open, title: 'Confirmar recepción', onClose: () => setOpen(false) }, h('p', null, 'Confirma la recepción de la parcialidad.'), h('button', { onClick: () => setOpen(false) }, 'Cancelar'));
 return h('div', { style: { transform: 'translateX(0)', overflow: 'hidden' } },
  h(ActionDrawer, { open: true, title: 'Recolecciones', onClose: () => {} },
   h('button', { id: 'open-confirm', onClick: () => setOpen(true) }, 'Confirmar recepción'), nested ? confirm : null), nested ? null : confirm);
}
flushSync(() => createRoot(document.getElementById('root')).render(h(App)));
setTimeout(() => {
 try {
  const trigger = document.getElementById('open-confirm'); trigger.focus();
  flushSync(() => trigger.click());
  const dialog = [...document.querySelectorAll('[role="dialog"]')].find(node => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === 'Confirmar recepción');
  const panel = [...document.querySelectorAll('[role="dialog"]')].find(node => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === 'Recolecciones');
  const a = dialog.getBoundingClientRect(), b = panel.getBoundingClientRect();
  const x = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
  const y = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
  const result = {
   viewport: innerWidth, nested,
   topHit: dialog.contains(document.elementFromPoint(x, y)),
   abovePanel: Number(getComputedStyle(dialog.closest('[data-overlay-root]')).zIndex) > Number(getComputedStyle(panel.closest('[data-overlay-root]')).zIndex),
   focusInside: dialog.contains(document.activeElement),
   portal: dialog.closest('[data-overlay-root]').parentElement === document.body,
  };
  flushSync(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  result.onlyTopClosed = document.querySelectorAll('[role="dialog"]').length === 1;
  result.focusRestored = document.activeElement === trigger;
  result.scrollLocked = document.body.style.overflow === 'hidden';
  document.getElementById('result').textContent = JSON.stringify(result);
 } catch (error) { document.getElementById('result').textContent = JSON.stringify({ error: error.message }); }
}, 100);
`;
const server = await createServer({
 appType: 'custom', server: { host: '127.0.0.1', port: 5199, strictPort: true, open: false },
 plugins: [{ name: 'overlay-regression-fixture',
  resolveId(id) { if (id === '/__overlay-check.js') return id; },
  load(id) { if (id === '/__overlay-check.js') return fixture; },
  configureServer(vite) {
   vite.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith('/__overlay-check?')) return next();
    res.setHeader('Content-Type', 'text/html');
    res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><output id="result"></output><script type="module" src="/__overlay-check.js"></script></body></html>'));
   });
  },
 }],
});
try {
 await server.listen();
 const port = server.httpServer.address().port;
 for (const width of [500, 1440]) for (const nested of [false, true]) {
  const args = ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=5000', `--window-size=${width},900`, '--dump-dom', `http://127.0.0.1:${port}/__overlay-check?case=confirm${nested ? '&nested=1' : ''}`];
  const output = await new Promise((resolve, reject) => {
   const child = spawn(chrome, args); let stdout = '', stderr = '';
   const timeout = setTimeout(() => { child.kill(); reject(new Error('Chrome excedió el tiempo de comprobación.')); }, 30000);
   child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
   child.on('error', reject); child.on('close', () => { clearTimeout(timeout); resolve({ stdout, stderr }); });
  });
  const raw = output.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];
  if (!raw) throw new Error(`Chrome no devolvió el resultado: ${output.stderr.slice(-400)}`);
  const result = JSON.parse(raw.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  if (result.viewport !== width || result.error || !['topHit', 'abovePanel', 'focusInside', 'portal', 'onlyTopClosed', 'focusRestored', 'scrollLocked'].every(key => result[key])) throw new Error(JSON.stringify(result));
  process.stdout.write(`${result.viewport}px, ${nested ? 'anidado' : 'hermano'}: confirmación visible sobre el panel, foco y Escape correctos\n`);
 }
} finally { await server.close(); }
