import { createServer } from 'vite';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

if (process.env.VITE_FIREBASE_STORAGE_EMULATOR !== 'true') {
  throw new Error('Activa VITE_FIREBASE_STORAGE_EMULATOR=true para esta comprobación.');
}

const chrome = process.env.CHROME_BIN ?? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(existsSync);
if (!chrome) throw new Error('Se necesita Chrome para comprobar Storage en el navegador.');

const fixture = `
import { uploadOperationProof, deleteOperationProofByUrl } from '/src/modules/operations/api/operations-storage.api.ts';

const output = document.getElementById('result');
try {
  const file = new File(['comprobante de prueba local'], 'qa-storage-smoke.pdf', { type: 'application/pdf' });
  const uploaded = await uploadOperationProof({ file, userId: 0, folder: 'qa-smoke' });
  const localUrl = uploaded.downloadUrl.startsWith('http://127.0.0.1:9199/');
  if (!localUrl) throw new Error('La subida no regresó una URL del emulador local.');
  const response = await fetch(uploaded.downloadUrl);
  if (!response.ok || await response.text() !== 'comprobante de prueba local') {
    throw new Error('El archivo no se pudo leer desde el emulador.');
  }
  await deleteOperationProofByUrl(uploaded.downloadUrl);
  output.textContent = JSON.stringify({ ok: true, localUrl, deleted: true });
} catch (error) {
  output.textContent = JSON.stringify({ ok: false, error: error.message });
}
`;

const server = await createServer({
  appType: 'custom',
  server: { host: '127.0.0.1', port: 5198, strictPort: true, open: false },
  plugins: [{
    name: 'qa-storage-smoke',
    resolveId(id) { if (id === '/__qa_storage.js') return id; },
    load(id) { if (id === '/__qa_storage.js') return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (request, response, next) => {
        if (request.url !== '/__qa_storage') return next();
        response.setHeader('Content-Type', 'text/html');
        response.end(await vite.transformIndexHtml(request.url, '<!doctype html><html><body><output id="result">esperando</output><script type="module" src="/__qa_storage.js"></script></body></html>'));
      });
    },
  }],
});

try {
  await server.listen();
  const result = await new Promise((resolve, reject) => {
    const child = spawn(chrome, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking',
      '--virtual-time-budget=12000', '--dump-dom', 'http://127.0.0.1:5198/__qa_storage',
    ]);
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => { child.kill(); reject(new Error('Chrome excedió 30 s.')); }, 30000);
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('close', () => { clearTimeout(timeout); resolve({ stdout, stderr }); });
  });
  const raw = result.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];
  if (!raw || raw === 'esperando') throw new Error(`La subida no terminó. ${result.stderr.slice(-300)}`);
  const data = JSON.parse(raw.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  if (!data.ok || !data.localUrl || !data.deleted) throw new Error(JSON.stringify(data));
  process.stdout.write('Storage QA: subida, lectura y borrado en el emulador local correctos.\n');
} finally {
  await server.close();
}
