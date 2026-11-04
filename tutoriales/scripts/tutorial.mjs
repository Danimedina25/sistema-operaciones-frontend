// Graba un tutorial: narración (voz de macOS), recorrido con Playwright y ensamblado con ffmpeg.
// Uso: node tutoriales/scripts/tutorial.mjs 02-crear-operacion
// Requiere el entorno de tutoriales arriba (backend 8081, frontend 5175, Storage 9199).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { overlayScript } from './overlay.mjs';

const BASE_URL = 'http://127.0.0.1:5175';
const VOICE = 'Paulina';
const RATE = '175';
const VIEWPORT = { width: 1536, height: 864 };
const DESKTOP = `${homedir()}/Desktop/Tutoriales Sistema de Operaciones`;

const root = fileURLToPath(new URL('../', import.meta.url));
// Acepta el id completo o solo el número: "02" → "02-crear-operacion".
const prefix = process.argv[2];
const id = readdirSync(`${root}scripts/tutoriales`).map(f => f.replace(/\.mjs$/, '')).find(f => prefix && f.startsWith(prefix));
if (!id) throw new Error('Uso: npm run tutorial -- <número>, por ejemplo: npm run tutorial -- 02');

const work = `${root}salida/.trabajo/${id}/`;
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const { default: tutorial } = await import(`./tutoriales/${id}.mjs`);
const password = readFileSync(`${root}../.qa-local/tutorial-login.txt`, 'utf8').trim();

// 1. Narración: un audio por frase, para mostrar cada frase como subtítulo con su duración real.
function duration(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
}
let audioIndex = 0;
for (const scene of tutorial.scenes) {
  scene.lines = scene.narration.map(text => {
    const file = `${work}voz-${String(audioIndex++).padStart(3, '0')}.aiff`;
    execFileSync('say', ['-v', VOICE, '-r', RATE, '-o', file, text]);
    return { text, file, ms: Math.round(duration(file) * 1000) };
  });
}

// 2. Datos limpios en la base de tutoriales.
execFileSync(`${root}scripts/seed.sh`, [tutorial.backendPath], { stdio: 'inherit' });

// 3. Sesiones sin grabar: la del tutorial y las que use la preparación.
const browser = await chromium.launch({ args: ['--lang=es-MX'] });
const contextOptions = { viewport: VIEWPORT, locale: 'es-MX', timezoneId: 'America/Mexico_City' };
async function login(email) {
  const loginContext = await browser.newContext(contextOptions);
  const loginPage = await loginContext.newPage();
  await loginPage.goto(`${BASE_URL}/login`);
  await loginPage.locator('input[type="email"]').fill(email);
  await loginPage.locator('input[type="password"]').fill(password);
  await loginPage.getByRole('checkbox').check();
  await loginPage.locator('button[type="submit"]').click();
  await loginPage.waitForURL(url => !url.pathname.startsWith('/login'));
  const state = await loginContext.storageState();
  await loginContext.close();
  return state;
}
async function session(email) {
  const sessionContext = await browser.newContext({ ...contextOptions, storageState: await login(email) });
  const sessionPage = await sessionContext.newPage();
  return { page: sessionPage, close: () => sessionContext.close() };
}
if (tutorial.prepare) await tutorial.prepare({ session, BASE_URL, comprobantes: `${root}comprobantes/` });
const storageState = tutorial.loggedOut ? undefined : await login(tutorial.user);

// 4. Grabación.
const context = await browser.newContext({
  ...contextOptions, storageState,
  recordVideo: { dir: work, size: VIEWPORT },
});
await context.addInitScript(overlayScript);
const page = await context.newPage();
const recordingStart = Date.now();
await page.goto(`${BASE_URL}${tutorial.startPath}`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);

const pause = ms => page.waitForTimeout(ms);
const overlay = (fn, arg) => page.evaluate(([name, value]) => window.__tutorial[name](value), [fn, arg]);

async function moveTo(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
  await pause(250);
}
const h = {
  page, pause, moveTo, password,
  async click(locator) {
    await moveTo(locator);
    await overlay('ripple');
    await locator.click();
    await pause(500);
  },
  async type(locator, text) {
    await moveTo(locator);
    await locator.click();
    await locator.pressSequentially(text, { delay: 90 });
    await pause(400);
  },
  async select(locator, value) {
    await moveTo(locator);
    await overlay('ripple');
    await locator.selectOption(value);
    await pause(600);
  },
  async upload(dropzone, input, file) {
    await moveTo(dropzone);
    await overlay('ripple');
    await input.setInputFiles(`${root}comprobantes/${file}`);
    await pause(900);
  },
};

const timeline = [];
let videoOffset = null;
for (const scene of tutorial.scenes) {
  // Las acciones pueden recargar la página; el título se vuelve a poner al empezar cada escena.
  const start = Date.now();
  if (videoOffset === null) videoOffset = start - recordingStart;
  timeline.push({ at: start - recordingStart - videoOffset, lines: scene.lines });
  if (!scene.cover) await overlay('cover', null);
  await overlay(scene.cover ? 'cover' : 'title', scene.cover ?? scene.title ?? '');
  const subtitles = (async () => {
    for (const line of scene.lines) {
      await overlay('subtitle', line.text);
      await pause(line.ms + 250);
    }
  })();
  await Promise.all([subtitles, scene.action ? scene.action(h) : Promise.resolve()]);
  await overlay('subtitle', '');
  await pause(scene.hold ?? 600);
}
const totalMs = Date.now() - recordingStart - videoOffset;
const video = page.video();
await context.close();
await browser.close();
const rawVideo = `${work}grabacion.webm`;
renameSync(await video.path(), rawVideo);

// 5. Ensamblado: recorta el arranque y coloca cada frase en su momento.
const inputs = ['-ss', (videoOffset / 1000).toFixed(3), '-t', (totalMs / 1000).toFixed(3), '-i', rawVideo];
// Playwright graba al tamaño de la ventana; se escala a 1080p al final.
const filters = ['[0:v]scale=1920:1080:flags=lanczos[v]'];
let n = 0;
for (const entry of timeline) {
  let at = entry.at;
  for (const line of entry.lines) {
    inputs.push('-i', line.file);
    n += 1;
    filters.push(`[${n}:a]adelay=${at}|${at}[a${n}]`);
    at += line.ms + 250;
  }
}
filters.push(`${Array.from({ length: n }, (_, i) => `[a${i + 1}]`).join('')}amix=inputs=${n}:normalize=0[voz]`);
const output = `${root}salida/${id}.mp4`;
writeFileSync(`${work}filtros.txt`, filters.join(';'));
execFileSync('ffmpeg', [
  '-loglevel', 'error', '-y', ...inputs,
  '-/filter_complex', `${work}filtros.txt`,
  '-map', '[v]', '-map', '[voz]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output,
], { stdio: 'inherit' });
console.log(`Video listo: ${output} (${(totalMs / 1000).toFixed(1)} s)`);

// 6. Copia ordenada en el Escritorio.
mkdirSync(`${DESKTOP}/${tutorial.folder}`, { recursive: true });
const copy = `${DESKTOP}/${tutorial.folder}/${id.split("-")[0]} - ${tutorial.name}.mp4`;
copyFileSync(output, copy);
console.log(`Copia: ${copy}`);
