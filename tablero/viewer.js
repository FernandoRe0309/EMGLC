'use strict';

/* Panel de solo lectura: portada con formatos y catálogo por formato.
   Lee tablero.json y las fotos de la carpeta de SharePoint configurada en config.js. */

const $ = (s) => document.querySelector(s);
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeColor = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#1f4fd6');
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'formato';

const DEFAULT_INTRO = {
  title: 'Señalización en tu tienda',
  subtitle: 'Selecciona tu formato para continuar',
  guideTitle: 'Guía de señalización',
  guide: 'En este manual encontrarás la señalización autorizada que debe permanecer en tu tienda. Úsalo como guía para validar cada espacio.',
  importantTitle: 'Importante',
  important: [
    'Retira cualquier señalización que no esté indicada en este manual.',
    'Mantén únicamente la señalización autorizada en tienda.',
    'Coloca máximo una señalización por departamento.',
  ],
};

let data = null;     // { intro, formats, updatedAt }
let items = [];      // tarjetas del formato abierto: { title, section, src, el, secEl, key }
let visible = [];    // las que pasan el filtro de búsqueda
let current = -1;
let observer = null;
let renderToken = 0;

/* ---------- Inicio y sesión ---------- */
async function start() {
  setHero({ title: DEFAULT_INTRO.title, sub: '' });
  const missing = SP.missingConfig();
  if (missing.length) {
    showStatus('El manual aún no está configurado', `Falta en config.js: ${missing.join(', ')}.`);
    return;
  }
  try {
    await SP.init(['Files.Read.All']);
  } catch (e) {
    console.error(e);
    showStatus('No se pudo iniciar', SP.errorText(e));
    return;
  }
  if (SP.currentAccount()) {
    try { await SP.silentToken(); await load(); return; } catch { /* pedir inicio de sesión */ }
  }
  showLogin();
}

function showLogin(message) {
  showStatus('Inicia sesión para ver el manual', message || 'Usa tu cuenta de la empresa (la misma de Outlook y Teams).', true);
}

async function doLogin() {
  try {
    await SP.signIn();
    await load();
  } catch (e) {
    console.error(e);
    showLogin(SP.errorText(e));
  }
}

async function load() {
  showStatus('Cargando manual…', '');
  try {
    const raw = await SP.readJson();
    data = normalize(raw || {});
  } catch (e) {
    console.error(e);
    if (e && e.status === 401) { showLogin(SP.errorText(e)); return; }
    showStatus('No se pudo cargar el manual', SP.errorText(e));
    return;
  }
  renderAccount();
  route();
}

function renderAccount() {
  const acc = SP.currentAccount();
  $('#account').hidden = !acc;
  $('#accountName').textContent = acc ? (acc.name || acc.username) : '';
}

function normalize(raw) {
  const usedIds = new Set();
  const formats = (Array.isArray(raw.formats) && raw.formats.length ? raw.formats : [
    { name: 'W2', subtitle: 'Señalización Walmart', color: '#1f4fd6' },
    { name: 'B2', subtitle: 'Señalización Bodega Aurrera', color: '#2e7d32' },
    { name: 'BAE', subtitle: 'Señalización Bodega Aurrera', color: '#2e7d32' },
  ]).map((f) => {
    let id = slug(f.name);
    while (usedIds.has(id)) id += '-2';
    usedIds.add(id);
    return {
      id,
      name: String(f.name || 'Formato'),
      subtitle: String(f.subtitle || ''),
      color: safeColor(f.color),
      sections: (Array.isArray(f.sections) ? f.sections : [])
        .map((s) => ({ name: String(s.name || ''), folder: s.folder || null, cards: (Array.isArray(s.cards) ? s.cards : []).filter((c) => c && c.file) }))
        .filter((s) => s.cards.length),
    };
  });
  const intro = { ...DEFAULT_INTRO, ...(raw.intro || {}) };
  return { intro, formats, updatedAt: raw.updatedAt || null };
}

function updatedText() {
  return data && data.updatedAt
    ? 'Actualizado el ' + new Date(data.updatedAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
    : '';
}

function showStatus(title, text, withLogin = false) {
  $('#home').hidden = true;
  $('#catalog').hidden = true;
  const st = $('#status');
  st.hidden = false;
  st.innerHTML = `<strong>${esc(title)}</strong>${esc(text)}${withLogin ? '<button type="button" id="loginBtn" class="login-btn">Iniciar sesión</button>' : ''}`;
  if (withLogin) $('#loginBtn').addEventListener('click', doLogin);
}

$('#signOut').addEventListener('click', async () => {
  await SP.signOut();
  renderAccount();
  data = null;
  location.hash = '';
  setHero({ title: DEFAULT_INTRO.title, sub: '' });
  showLogin();
});

/* ---------- Rutas: #/ (portada) y #/<formato> ---------- */
function route() {
  if (!data) return;
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const fmt = id && data.formats.find((f) => f.id === id);
  if (fmt) renderFormat(fmt); else renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
$('#backBtn').addEventListener('click', () => { location.hash = '#/'; });

function setHero({ title, sub, color, back }) {
  const hero = $('#hero');
  hero.style.setProperty('--hero', color || '');
  hero.classList.toggle('compact', !!back);
  $('#heroTitle').textContent = title;
  $('#heroSub').textContent = sub || '';
  $('#backBtn').hidden = !back;
}

function renderHome() {
  const t = data.intro;
  document.title = t.title;
  setHero({ title: t.title, sub: t.subtitle });
  $('#catalog').hidden = true;
  $('#status').hidden = true;
  $('#home').hidden = false;

  $('#guideTitle').textContent = t.guideTitle;
  $('#guideText').textContent = t.guide;
  $('#guideTitle').closest('.note').hidden = !t.guideTitle && !t.guide;
  const imp = Array.isArray(t.important) ? t.important : [];
  $('#impTitle').textContent = t.importantTitle;
  $('#impList').innerHTML = imp.map((x) => `<li>${esc(x)}</li>`).join('');
  $('#impBox').hidden = !imp.length;

  $('#formats').innerHTML = data.formats.map((f) => {
    const n = f.sections.reduce((k, s) => k + s.cards.length, 0);
    const count = n ? `${f.sections.length} ${f.sections.length === 1 ? 'área' : 'áreas'} · ${n} ${n === 1 ? 'señalización' : 'señalizaciones'}` : 'Próximamente';
    return `<a class="format" href="#/${encodeURIComponent(f.id)}" style="--fc:${esc(f.color)}">
      <strong>${esc(f.name)}</strong>
      <span class="format-sub">${esc(f.subtitle)}</span>
      <span class="format-count">${esc(count)}</span>
    </a>`;
  }).join('');
  $('#updatedHome').textContent = updatedText();
}

async function renderFormat(f) {
  const myToken = ++renderToken;
  document.title = `${f.name} · ${data.intro.title}`;
  setHero({ title: f.name, sub: [f.subtitle, updatedText()].filter(Boolean).join(' · '), color: f.color, back: true });
  $('#home').hidden = true;
  $('#status').hidden = true;
  $('#catalog').hidden = false;
  $('#search').value = '';

  const content = $('#content');
  const nav = $('#nav');
  items = [];
  visible = [];
  content.innerHTML = '';
  nav.innerHTML = '';

  if (!f.sections.length) {
    content.innerHTML = '<div class="status-inline"><strong>Este formato aún no tiene señalización publicada</strong>Vuelve más tarde.</div>';
    return;
  }

  const imgEls = new Map(); // carpeta -> [{ file, img, item }]
  f.sections.forEach((s, si) => {
    const id = 'area-' + si;
    const sec = document.createElement('section');
    sec.className = 'sec';
    sec.id = id;
    sec.innerHTML = `<h2>${esc(s.name)}<small>${s.cards.length}</small></h2><div class="grid"></div>`;
    const grid = sec.querySelector('.grid');
    for (const c of s.cards) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card';
      btn.innerHTML = `<img loading="lazy" alt=""><span>${esc(c.title || '')}</span>`;
      const item = { title: String(c.title || ''), section: s.name, src: '', file: c.file, el: btn, secEl: sec, key: norm(`${c.title} ${s.name}`) };
      btn.addEventListener('click', () => { if (item.src) open(visible.indexOf(item)); });
      items.push(item);
      grid.appendChild(btn);
      const folder = c.file.slice(0, c.file.lastIndexOf('/'));
      if (!imgEls.has(folder)) imgEls.set(folder, []);
      imgEls.get(folder).push({ name: c.file.slice(c.file.lastIndexOf('/') + 1), img: btn.querySelector('img'), item });
    }
    content.appendChild(sec);

    const a = document.createElement('a');
    a.href = '#' + id;
    a.dataset.target = id;
    a.innerHTML = `${esc(s.name)}<span class="n">${s.cards.length}</span>`;
    a.addEventListener('click', (e) => { e.preventDefault(); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    nav.appendChild(a);
  });

  visible = items.slice();
  applySearch();
  watchActiveSection();

  // Pedir los enlaces de descarga por carpeta (son temporales y no requieren sesión).
  for (const [folder, list] of imgEls) {
    if (myToken !== renderToken) return;
    await fillFolder(folder, list);
  }
}

async function fillFolder(folder, list, retry = true) {
  let entries;
  try { entries = await SP.list(folder); } catch (e) { console.warn(e); entries = new Map(); }
  for (const { name, img, item } of list) {
    const entry = entries.get(name);
    if (!entry || !entry.downloadUrl) { item.el.classList.add('missing'); continue; }
    item.src = entry.downloadUrl;
    img.onerror = retry ? () => { img.onerror = null; fillFolder(folder, [{ name, img, item }], false); } : null;
    img.src = entry.downloadUrl;
  }
}

function applySearch() {
  const q = norm($('#search').value);
  visible = [];
  const secVisible = new Map();
  for (const it of items) {
    const ok = !q || it.key.includes(q);
    it.el.classList.toggle('hidden', !ok);
    if (ok) visible.push(it);
    secVisible.set(it.secEl, (secVisible.get(it.secEl) || false) || ok);
  }
  for (const [sec, ok] of secVisible) {
    sec.classList.toggle('hidden', !ok);
    const link = document.querySelector(`.nav a[data-target="${sec.id}"]`);
    if (link) link.classList.toggle('hidden', !ok);
  }
  $('#noResults')?.remove();
  if (q && !visible.length) $('#content').insertAdjacentHTML('beforeend', '<div id="noResults" class="status-inline"><strong>Sin resultados</strong>Prueba con otra palabra.</div>');
}

function watchActiveSection() {
  if (!('IntersectionObserver' in window)) return;
  observer?.disconnect();
  const links = new Map([...document.querySelectorAll('.nav a')].map((a) => [a.dataset.target, a]));
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('active'));
      const a = links.get(e.target.id);
      if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    }
  }, { rootMargin: '-120px 0px -60% 0px' });
  document.querySelectorAll('.sec').forEach((s) => observer.observe(s));
}

/* ---------- Imagen en grande ---------- */
const lb = $('#lightbox');
const stage = $('#lbStage');
const lbImg = $('#lbImg');

function open(i) {
  if (i < 0 || i >= visible.length) return;
  if (!visible[i].src) return;
  current = i;
  const it = visible[i];
  stage.classList.remove('zoomed');
  lbImg.style.width = '';
  lbImg.src = it.src;
  lbImg.alt = it.title;
  $('#lbTitle').textContent = it.title;
  $('#lbMeta').textContent = `${it.section} · ${i + 1} de ${visible.length}`;
  $('#lbOpen').href = it.src;
  $('#lbPrev').hidden = i === 0;
  $('#lbNext').hidden = i === visible.length - 1;
  if (!lb.open) lb.showModal();
  // precargar vecinas
  [visible[i - 1], visible[i + 1]].forEach((n) => { if (n) new Image().src = n.src; });
}

function step(d) { open(current + d); }

// Rectángulo que ocupa realmente la imagen dentro de su caja (object-fit: contain).
function fittedRect() {
  const box = lbImg.getBoundingClientRect();
  const k = Math.min(box.width / lbImg.naturalWidth, box.height / lbImg.naturalHeight);
  const w = lbImg.naturalWidth * k, h = lbImg.naturalHeight * k;
  return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, width: w, height: h };
}

function toggleZoom(e) {
  if (stage.classList.contains('zoomed')) {
    stage.classList.remove('zoomed');
    lbImg.style.width = '';
    return;
  }
  if (!lbImg.naturalWidth) return;
  // Punto de la imagen donde se hizo clic (centro si fue con el botón).
  const shown = fittedRect();
  const fx = e ? Math.min(1, Math.max(0, (e.clientX - shown.left) / shown.width)) : 0.5;
  const fy = e ? Math.min(1, Math.max(0, (e.clientY - shown.top) / shown.height)) : 0.5;
  // Tamaño real, o al menos el doble de lo que se ve en pantalla.
  lbImg.style.width = Math.max(lbImg.naturalWidth, shown.width * 2) + 'px';
  stage.classList.add('zoomed');
  {
    requestAnimationFrame(() => {
      stage.scrollLeft = fx * stage.scrollWidth - stage.clientWidth / 2;
      stage.scrollTop = fy * stage.scrollHeight - stage.clientHeight / 2;
    });
  }
}

$('#lbClose').addEventListener('click', () => lb.close());
$('#lbPrev').addEventListener('click', () => step(-1));
$('#lbNext').addEventListener('click', () => step(1));
$('#lbZoom').addEventListener('click', () => toggleZoom());
lbImg.addEventListener('click', (e) => {
  e.stopPropagation();
  // Clic en el área vacía alrededor de la imagen (sin zoom): cerrar.
  if (!stage.classList.contains('zoomed') && lbImg.naturalWidth) {
    const r = fittedRect();
    if (e.clientX < r.left || e.clientX > r.left + r.width || e.clientY < r.top || e.clientY > r.top + r.height) { lb.close(); return; }
  }
  toggleZoom(e);
});
stage.addEventListener('click', (e) => { if (e.target === stage && !stage.classList.contains('zoomed')) lb.close(); });
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  else if (e.key === 'z' || e.key === 'Z') toggleZoom();
});
lb.addEventListener('close', () => { lbImg.removeAttribute('src'); lbImg.style.width = ''; stage.classList.remove('zoomed'); current = -1; });

// Deslizar con el dedo para cambiar de imagen (solo sin zoom).
let touchStart = null;
stage.addEventListener('touchstart', (e) => {
  touchStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}, { passive: true });
stage.addEventListener('touchend', (e) => {
  if (!touchStart || stage.classList.contains('zoomed') || (window.visualViewport && visualViewport.scale > 1.01)) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
});

$('#search').addEventListener('input', applySearch);

start();
