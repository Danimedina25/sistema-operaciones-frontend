// Capa que se inyecta en la página grabada: cursor visible, clics, título de paso,
// subtítulos y portada. Vive en el DOM para que quede en el video sin posproducción.
export const overlayScript = `(() => {
  if (window.__tutorial) return;
  const css = \`
    #tut-cursor { position: fixed; z-index: 2147483643; width: 22px; height: 22px; margin: -3px 0 0 -3px; pointer-events: none;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 2l7 19 2.5-7.5L20 11z' fill='%23111827' stroke='white' stroke-width='1.6' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat; }
    .tut-ripple { position: fixed; z-index: 2147483646; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
      border: 3px solid #2563eb; background: rgba(37,99,235,.18); pointer-events: none; animation: tut-ripple .6s ease-out forwards; }
    @keyframes tut-ripple { from { transform: scale(.3); opacity: 1 } to { transform: scale(1.4); opacity: 0 } }
    #tut-title { position: fixed; z-index: 2147483645; top: 18px; left: 50%; transform: translateX(-50%); pointer-events: none;
      background: #0f172a; color: #fff; font: 600 20px/1.3 Inter, system-ui, sans-serif; padding: 10px 22px; border-radius: 999px;
      box-shadow: 0 8px 24px rgba(15,23,42,.3); transition: opacity .3s; }
    #tut-sub { position: fixed; z-index: 2147483647; bottom: 28px; left: 50%; transform: translateX(-50%); max-width: 78%; pointer-events: none;
      background: rgba(15,23,42,.86); color: #fff; font: 500 22px/1.4 Inter, system-ui, sans-serif; padding: 10px 20px; border-radius: 12px;
      text-align: center; transition: opacity .2s; }
    #tut-cover { position: fixed; inset: 0; z-index: 2147483646; display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f172a, #1e3a8a); color: #fff; font-family: Inter, system-ui, sans-serif; transition: opacity .5s; }
    #tut-cover .k { font-size: 18px; letter-spacing: .2em; text-transform: uppercase; color: #93c5fd; }
    #tut-cover .t { margin-top: 14px; font-size: 56px; font-weight: 800; }
    #tut-cover .s { margin-top: 12px; font-size: 24px; color: #cbd5e1; }
    .tut-hidden { opacity: 0 !important; }
    /* Espacio al final del contenido para que lo último pueda subir por encima del subtítulo. */
    main::after { content: ""; display: block; height: 180px; }
  \`;
  const el = (id) => document.getElementById(id);
  function mount() {
    if (el('tut-cursor')) return;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    for (const id of ['tut-cursor', 'tut-title', 'tut-sub']) {
      const node = document.createElement('div'); node.id = id;
      if (id !== 'tut-cursor') node.className = 'tut-hidden';
      document.body.appendChild(node);
    }
  }
  let x = -50, y = -50;
  document.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; const c = el('tut-cursor');
    if (c) { c.style.left = x + 'px'; c.style.top = y + 'px'; } }, true);
  const text = (id, value) => { mount(); const node = el(id); node.textContent = value || ''; node.classList.toggle('tut-hidden', !value); };
  window.__tutorial = {
    title: (value) => text('tut-title', value),
    subtitle: (value) => text('tut-sub', value),
    ripple: () => { mount(); const r = document.createElement('div'); r.className = 'tut-ripple';
      r.style.left = x + 'px'; r.style.top = y + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 700); },
    cover: (value) => { mount(); let c = el('tut-cover');
      if (!value) { if (c) { c.classList.add('tut-hidden'); setTimeout(() => c.remove(), 600); } return; }
      if (!c) { c = document.createElement('div'); c.id = 'tut-cover'; document.body.appendChild(c); }
      c.innerHTML = '<div class="k"></div><div class="t"></div><div class="s"></div>';
      c.querySelector('.k').textContent = value.kicker || ''; c.querySelector('.t').textContent = value.title;
      c.querySelector('.s').textContent = value.subtitle || ''; text('tut-title', ''); },
  };
  // Con un panel lateral abierto, título y subtítulo se centran en el espacio libre a su izquierda.
  setInterval(() => {
    const panel = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
      .map(d => d.getBoundingClientRect()).find(r => r.width > 0 && r.left > window.innerWidth * 0.3);
    const free = panel ? panel.left : window.innerWidth;
    for (const id of ['tut-title', 'tut-sub']) {
      const node = el(id);
      if (node) { node.style.left = free / 2 + 'px'; node.style.maxWidth = Math.round(free * 0.86) + 'px'; }
    }
  }, 150);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();`;
