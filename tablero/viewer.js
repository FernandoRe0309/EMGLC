'use strict';

/* Panel de solo lectura: muestra data/tablero.json publicado desde admin.html. */

const $ = (s) => document.querySelector(s);
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let items = [];   // todas las tarjetas en orden: { title, section, src, el }
let visible = []; // las que pasan el filtro de búsqueda
let current = -1;

async function load() {
  let data = null;
  try {
    const r = await fetch(`data/tablero.json?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) data = await r.json();
    else if (r.status !== 404) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error(e);
    $('#updated').textContent = '';
    $('#content').innerHTML = '<div class="empty"><strong>No se pudo cargar el catálogo</strong>Revisa tu conexión e intenta de nuevo.</div>';
    return;
  }

  const sections = (data && Array.isArray(data.sections) ? data.sections : [])
    .map((s) => ({ name: String(s.name || ''), cards: (Array.isArray(s.cards) ? s.cards : []).filter((c) => c && c.src) }))
    .filter((s) => s.cards.length);

  if (!sections.length) {
    $('#updated').textContent = '';
    $('#content').innerHTML = '<div class="empty"><strong>Aún no hay nada publicado</strong>Cuando el administrador publique el tablero aparecerá aquí.</div>';
    return;
  }

  if (data.updatedAt) {
    $('#updated').textContent = 'Actualizado el ' + new Date(data.updatedAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
  } else {
    $('#updated').textContent = '';
  }

  const content = $('#content');
  const nav = $('#nav');
  items = [];
  content.innerHTML = '';
  nav.innerHTML = '';

  sections.forEach((s, si) => {
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
      const src = 'data/' + String(c.src).split('/').map(encodeURIComponent).join('/');
      btn.innerHTML = `<img loading="lazy" alt="" src="${esc(src)}"><span>${esc(c.title || '')}</span>`;
      const item = { title: String(c.title || ''), section: s.name, src, el: btn, secEl: sec, key: norm(`${c.title} ${s.name}`) };
      btn.addEventListener('click', () => open(visible.indexOf(item)));
      items.push(item);
      grid.appendChild(btn);
    }
    content.appendChild(sec);

    const a = document.createElement('a');
    a.href = '#' + id;
    a.dataset.target = id;
    a.innerHTML = `${esc(s.name)}<span class="n">${s.cards.length}</span>`;
    nav.appendChild(a);
  });

  visible = items.slice();
  applySearch();
  watchActiveSection();
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
  if (q && !visible.length) {
    if (!$('#noResults')) $('#content').insertAdjacentHTML('beforeend', '<div id="noResults" class="empty"><strong>Sin resultados</strong>Prueba con otra palabra.</div>');
  } else {
    $('#noResults')?.remove();
  }
}

function watchActiveSection() {
  if (!('IntersectionObserver' in window)) return;
  const links = new Map([...document.querySelectorAll('.nav a')].map((a) => [a.dataset.target, a]));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('active'));
      const a = links.get(e.target.id);
      if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    }
  }, { rootMargin: '-140px 0px -60% 0px' });
  document.querySelectorAll('.sec').forEach((s) => io.observe(s));
}

/* ---------- Imagen en grande ---------- */
const lb = $('#lightbox');
const stage = $('#lbStage');
const lbImg = $('#lbImg');

function open(i) {
  if (i < 0 || i >= visible.length) return;
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

load();
