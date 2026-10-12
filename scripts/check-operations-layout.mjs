import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdtempSync, readdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const chrome = process.env.CHROME_BIN ?? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(existsSync);
if (!chrome) throw new Error('Se necesita Chrome para la prueba visual de anchos.');

const cssFile = readdirSync(resolve('dist/assets')).find((file) => /^index-.*\.css$/.test(file));
if (!cssFile) throw new Error('Ejecuta npm run build antes de esta prueba.');

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const tempDir = mkdtempSync(join(tmpdir(), 'operations-layout-'));
try {
  const { DataTable } = await vite.ssrLoadModule('/src/shared/components/ui/DataTable.tsx');
  const { ProgressBar } = await vite.ssrLoadModule('/src/shared/components/ui/ProgressBar.tsx');
  const { OperationStatusBadge } = await vite.ssrLoadModule('/src/modules/operations/components/OperationStatusBadge.tsx');
  const { RowActionsMenu } = await vite.ssrLoadModule('/src/shared/components/ui/RowActionsMenu.tsx');
  const { Button } = await vite.ssrLoadModule('/src/shared/components/ui/Button.tsx');
  const row = { id: 42, cliente: 'Cliente con un nombre largo para comprobar el truncamiento', socio: 'Socio Demo' };
  const actions = () => h('div', { className: 'flex items-center justify-end gap-1 whitespace-nowrap' },
    h(Button, { type: 'button', variant: 'neutral' }, 'Ver'),
    h(RowActionsMenu, { triggerLabel: '', ariaLabel: 'Más opciones', triggerClassName: 'min-w-10 shrink-0 justify-center px-2' }, h('button', null, 'Editar')),
  );
  const columns = [
    { key: 'folio', header: 'Folio', width: '64px', cell: () => '42' },
    { key: 'client', header: 'Cliente', cell: () => h('p', { className: 'truncate', title: row.cliente }, row.cliente) },
    { key: 'created', header: 'Creada', width: '112px', cell: () => '10 oct 2026' },
    { key: 'amount', header: 'Monto', width: '112px', cell: () => '$10,000.00' },
    { key: 'income', header: 'Ingreso validado', width: '150px', cell: () => h(ProgressBar, { total: 10000, registered: 10000, validated: 10000, compact: true }) },
    { key: 'status', header: 'Estatus', kind: 'status', width: '218px', cell: () => h(OperationStatusBadge, { status: 'RETORNO_PARCIAL_SOLICITADO' }) },
    { key: 'actions', header: 'Acciones', kind: 'actions', align: 'right', width: '148px', cell: actions },
  ];
  const markup = renderToStaticMarkup(h(DataTable, {
    columns, rows: [row], getRowKey: (item) => item.id,
    mobile: { title: (item) => item.cliente, fields: [], actions }, emptyTitle: 'Sin operaciones',
  }));
  const cssHref = pathToFileURL(resolve('dist/assets', cssFile)).href;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${cssHref}"></head><body><div class="flex w-full"><aside id="sidebar" class="w-[312px] shrink-0 lg:max-xl:w-[76px]"></aside><main class="min-w-0 flex-1 p-6"><section class="overflow-hidden rounded-2xl border border-slate-200">${markup}</section></main></div><output id="layout-result"></output><script>setTimeout(() => { const container = document.querySelector('.responsive-data-table'); const table = document.querySelector('.responsive-data-table__table'); const cards = document.querySelector('.responsive-data-table__cards'); const actions = table.querySelector('td:last-child'); const tableVisible = getComputedStyle(table).display !== 'none'; const cardsVisible = getComputedStyle(cards).display !== 'none'; document.querySelector('#layout-result').textContent = JSON.stringify({viewport: innerWidth, sidebar: document.querySelector('#sidebar').getBoundingClientRect().width, container: Math.round(container.getBoundingClientRect().width), tableVisible, cardsVisible, actionsVisible: tableVisible ? actions.getBoundingClientRect().right <= container.getBoundingClientRect().right + 1 : cards.querySelector('button') !== null, horizontalOverflow: document.documentElement.scrollWidth > innerWidth}); }, 150);</script></body></html>`;
  const fixture = join(tempDir, 'index.html');
  writeFileSync(fixture, html);
  for (const width of [1024, 1280, 1440]) {
    const result = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars', '--virtual-time-budget=1200', `--window-size=${width},900`, '--dump-dom', pathToFileURL(fixture).href], { encoding: 'utf8', maxBuffer: 10_000_000 });
    const data = result.stdout.match(/<output id="layout-result">([^<]+)<\/output>/)?.[1];
    if (!data) throw new Error(`Chrome no devolvió medidas para ${width}px: ${result.stderr.slice(-500)}`);
    const measured = JSON.parse(data.replaceAll('&quot;', '"'));
    const expectedTable = width === 1440;
    if (measured.viewport !== width || measured.sidebar !== (width < 1280 ? 76 : 312) || measured.tableVisible !== expectedTable || measured.cardsVisible === expectedTable || !measured.actionsVisible || measured.horizontalOverflow) {
      throw new Error(`Diseño desbordado a ${width}px: ${JSON.stringify(measured)}`);
    }
    process.stdout.write(`${width}px: ${expectedTable ? 'tabla' : 'tarjetas'}, Acciones visibles, sin desbordamiento\n`);
  }
} finally {
  await vite.close();
  rmSync(tempDir, { recursive: true, force: true });
}
