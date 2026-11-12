'use strict';

/* =========================================================================
   Tablero de Señalización
   - Las imágenes se cargan desde el equipo del usuario y se guardan en
     IndexedDB del navegador. Nunca se suben a ningún servidor.
   - El identificador de cada imagen es su ruta relativa literal dentro de
     la carpeta cargada (se conservan acentos, espacios y erratas).
   ========================================================================= */

const DEFAULT_SECTIONS = [
  'Autocobro SCO', 'Cajeros', 'Carnes', 'Cocina', 'Comedor', 'Compactadora',
  'Consultorio Médico', 'Deli', 'Entrada de Personal', 'Entrada y Salida de Cliente',
  'Frutas y Verduras', 'Kiosco', 'Línea de Cajas', 'Lockers Clientes', 'On Demand',
  'Panadería', 'Pescados', 'Recibo', 'Refrigeradores', 'Sala de Descanso',
  'Salchichonería', 'Servicios al Cliente', 'Tortillería', 'Trastienda',
  'W.C. Asociados', 'W.C. Clientes',
  // Áreas nuevas detectadas en las carpetas
  'Carritos Autoservicio', 'Electrónica', 'Farmacia', 'Patio de maniobras',
];

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif|svg)$/i;
const DB_NAME = 'tablero-senalizacion';
const DB_VERSION = 1;

// Publicación: el panel de lectura lee data/tablero.json y data/img/<sha1>.<ext>
const PUB_DIR = 'data';
const PUB_JSON = `${PUB_DIR}/tablero.json`;
const MAX_SIDE = 2000;      // px del lado mayor tras optimizar
const JPEG_QUALITY = 0.85;
const CFG_KEY = 'tablero-senalizacion:github';

/* ---------- Utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const titleFromName = (name) => name.replace(IMAGE_EXT, '').trim();
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

async function sha1(blob) {
  if (!crypto.subtle) return null;
  const buf = await crypto.subtle.digest('SHA-1', await blob.arrayBuffer());
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function download(filename, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------- Almacenamiento (IndexedDB con respaldo en memoria) ---------- */
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB no disponible'));
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('images')) d.createObjectStore('images', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('state')) d.createObjectStore('state');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function idb(store, mode, fn) {
  if (!db) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    const r = fn(s);
    if (r) r.onsuccess = () => { result = r.result; };
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

/* ---------- Estado ---------- */
const images = new Map(); // id -> { id, path, folder, name, blob, url }
let board = { sections: [] };
const ui = {
  query: '',
  onlyUnplaced: false,
  collapsedFolders: new Set(),
};

function defaultBoard() {
  return { sections: DEFAULT_SECTIONS.map((name) => ({ id: uid(), name, collapsed: false, cards: [] })) };
}

let saveTimer;
function saveBoard({ dirty = true } = {}) {
  if (dirty) board.dirty = true;
  renderPublishState();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    idb('state', 'readwrite', (s) => s.put(board, 'board')).catch((e) => console.error(e));
  }, 250);
}

function placementCounts() {
  const counts = new Map();
  for (const sec of board.sections) for (const c of sec.cards) counts.set(c.imageId, (counts.get(c.imageId) || 0) + 1);
  return counts;
}

function urlFor(img) {
  if (!img) return null;
  if (!img.url) img.url = URL.createObjectURL(img.blob);
  return img.url;
}

function findCard(cardId) {
  for (const sec of board.sections) {
    const i = sec.cards.findIndex((c) => c.id === cardId);
    if (i !== -1) return { sec, index: i, card: sec.cards[i] };
  }
  return null;
}

/* ---------- Carga de archivos ---------- */
async function addFiles(entries) {
  // entries: [{ file, path }]
  const list = entries.filter((e) => IMAGE_EXT.test(e.file.name) || /^image\//.test(e.file.type));
  if (!list.length) { toast('No se encontraron imágenes en lo que elegiste.'); return; }
  toast(`Procesando ${list.length} imágenes…`, 60000);

  // Si todas comparten la misma carpeta raíz (p. ej. "Señalización/"), se quita.
  const firsts = new Set(list.map((e) => (e.path.includes('/') ? e.path.split('/')[0] : null)));
  const stripRoot = firsts.size === 1 && !firsts.has(null);

  const records = [];
  for (const { file, path } of list) {
    const rel = stripRoot ? path.slice(path.indexOf('/') + 1) : path;
    const cut = rel.lastIndexOf('/');
    records.push({
      id: rel,
      path: rel,
      folder: cut === -1 ? '' : rel.slice(0, cut),
      name: cut === -1 ? rel : rel.slice(cut + 1),
      blob: file,
      hash: await sha1(file),
    });
  }

  let added = 0, updated = 0;
  for (const rec of records) {
    const prev = images.get(rec.id);
    if (prev) { if (prev.url) URL.revokeObjectURL(prev.url); updated++; } else added++;
    images.set(rec.id, { ...rec, url: null });
  }

  try {
    for (let i = 0; i < records.length; i += 25) {
      const chunk = records.slice(i, i + 25);
      await idb('images', 'readwrite', (s) => { chunk.forEach((r) => s.put(r)); });
    }
  } catch (e) {
    console.error(e);
    toast('No se pudieron guardar todas las imágenes en el navegador (¿espacio lleno?). Se usarán solo en esta sesión.', 5000);
  }

  render();
  toast(`${added} imágenes nuevas${updated ? `, ${updated} actualizadas` : ''}.`);
}

async function filesFromDataTransfer(dt) {
  const items = [...(dt.items || [])].filter((i) => i.kind === 'file');
  const roots = items.map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)).filter(Boolean);
  if (!roots.length) return [...dt.files].map((f) => ({ file: f, path: f.name }));

  const out = [];
  async function walk(entry, prefix) {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      out.push({ file, path: prefix + entry.name });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      let batch;
      do {
        batch = await new Promise((res, rej) => reader.readEntries(res, rej));
        for (const e of batch) await walk(e, prefix + entry.name + '/');
      } while (batch.length);
    }
  }
  for (const r of roots) await walk(r, '');
  return out;
}

/* ---------- Render: biblioteca ---------- */
function renderLibrary(counts) {
  const list = $('#libraryList');
  if (!images.size) {
    list.innerHTML = `<div class="empty-lib"><strong>Aún no hay imágenes</strong>
      Usa <em>Cargar carpeta</em> y elige la carpeta <em>Señalización</em>, o arrastra la carpeta aquí.</div>`;
    return;
  }

  const q = norm(ui.query);
  const groups = new Map();
  for (const img of images.values()) {
    if (q && !norm(img.path).includes(q)) continue;
    if (ui.onlyUnplaced && counts.get(img.id)) continue;
    const key = img.folder;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(img);
  }

  if (!groups.size) { list.innerHTML = '<div class="empty-lib">Nada coincide con el filtro.</div>'; return; }

  const folders = [...groups.keys()].sort((a, b) => collator.compare(a, b));
  const frag = document.createDocumentFragment();
  for (const folder of folders) {
    const imgs = groups.get(folder).sort((a, b) => collator.compare(a.name, b.name));
    const wrap = document.createElement('div');
    wrap.className = 'folder' + (ui.collapsedFolders.has(folder) && !q ? ' collapsed' : '');
    wrap.dataset.folder = folder;
    const placed = imgs.filter((i) => counts.get(i.id)).length;
    wrap.innerHTML = `<button type="button" class="folder-head" data-folder-toggle>
        <span class="caret">▾</span><span>${escapeHtml(folder || '(raíz)')}</span>
        <span class="count">${placed}/${imgs.length}</span></button>
      <div class="folder-items"></div>`;
    const items = wrap.querySelector('.folder-items');
    for (const img of imgs) {
      const n = counts.get(img.id) || 0;
      const el = document.createElement('div');
      el.className = 'lib-item' + (n ? ' placed' : '');
      el.tabIndex = 0;
      el.dataset.imageId = img.id;
      el.title = img.path;
      el.innerHTML = `<img alt="" loading="lazy" draggable="false" src="${urlFor(img)}">
        <span class="name">${escapeHtml(titleFromName(img.name))}</span>
        ${n ? `<span class="badge" title="Colocada ${n} ${n === 1 ? 'vez' : 'veces'}">${n}</span>` : ''}`;
      items.appendChild(el);
    }
    frag.appendChild(wrap);
  }
  list.replaceChildren(frag);
}

/* ---------- Render: tablero ---------- */
function renderBoard() {
  const boardEl = $('#board');
  const nav = $('#sectionNav');
  const frag = document.createDocumentFragment();
  const navFrag = document.createDocumentFragment();

  board.sections.forEach((sec, si) => {
    const el = document.createElement('section');
    el.className = 'sec' + (sec.collapsed ? ' collapsed' : '');
    el.id = 'sec-' + sec.id;
    el.dataset.secId = sec.id;
    el.innerHTML = `<div class="sec-head" data-drop-sec="${sec.id}">
        <button type="button" class="icon-btn" data-sec-action="collapse" title="${sec.collapsed ? 'Expandir' : 'Contraer'}">${sec.collapsed ? '▸' : '▾'}</button>
        <h2 class="sec-title" contenteditable="true" spellcheck="false" data-sec-title>${escapeHtml(sec.name)}</h2>
        <span class="sec-count">${sec.cards.length} ${sec.cards.length === 1 ? 'imagen' : 'imágenes'}</span>
        <div class="sec-tools">
          <button type="button" class="icon-btn" data-sec-action="up" title="Subir sección" ${si === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="icon-btn" data-sec-action="down" title="Bajar sección" ${si === board.sections.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="icon-btn danger" data-sec-action="delete" title="Eliminar sección">🗑</button>
        </div>
      </div>
      <div class="dropzone" data-sec-id="${sec.id}"></div>`;
    const zone = el.querySelector('.dropzone');
    if (!sec.cards.length) zone.innerHTML = '<div class="hint">Arrastra imágenes aquí</div>';
    for (const card of sec.cards) zone.appendChild(cardEl(card));
    frag.appendChild(el);

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (sec.cards.length ? '' : ' empty');
    chip.dataset.dropSec = sec.id;
    chip.dataset.jump = sec.id;
    chip.innerHTML = `${escapeHtml(sec.name)}<span class="n">${sec.cards.length}</span>`;
    navFrag.appendChild(chip);
  });

  boardEl.replaceChildren(frag);
  nav.replaceChildren(navFrag);
}

function cardEl(card) {
  const img = images.get(card.imageId);
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.cardId = card.id;
  el.title = card.imageId;
  el.innerHTML = `<div class="thumb">${img
      ? `<img alt="" loading="lazy" draggable="false" src="${urlFor(img)}">`
      : `<div class="missing">Falta la imagen:<br>${escapeHtml(card.imageId)}</div>`}</div>
    <div class="card-title" contenteditable="true" spellcheck="false" data-card-title>${escapeHtml(card.title)}</div>
    <button type="button" class="remove" data-card-remove title="Quitar del tablero" aria-label="Quitar del tablero">×</button>`;
  return el;
}

function renderStats(counts) {
  const total = images.size;
  const placed = [...images.keys()].filter((id) => counts.get(id)).length;
  const cards = board.sections.reduce((n, s) => n + s.cards.length, 0);
  $('#stats').textContent = total
    ? `${total} imágenes en biblioteca · ${placed} colocadas · ${total - placed} sin colocar · ${cards} tarjetas en ${board.sections.length} secciones`
    : `Sin imágenes cargadas · ${board.sections.length} secciones`;
}

function render() {
  const counts = placementCounts();
  renderLibrary(counts);
  renderBoard();
  renderStats(counts);
}

/* ---------- Operaciones del tablero ---------- */
function addCard(secId, imageId, index) {
  const sec = board.sections.find((s) => s.id === secId);
  const img = images.get(imageId);
  if (!sec || !img) return;
  const card = { id: uid(), imageId, title: titleFromName(img.name) };
  const i = index == null ? sec.cards.length : Math.max(0, Math.min(index, sec.cards.length));
  sec.cards.splice(i, 0, card);
  if (sec.collapsed) sec.collapsed = false;
  commit();
}

function moveCard(cardId, secId, index) {
  const found = findCard(cardId);
  const dest = board.sections.find((s) => s.id === secId);
  if (!found || !dest) return;
  found.sec.cards.splice(found.index, 1);
  const i = index == null ? dest.cards.length : Math.max(0, Math.min(index, dest.cards.length));
  dest.cards.splice(i, 0, found.card);
  commit();
}

function removeCard(cardId) {
  const found = findCard(cardId);
  if (!found) return;
  found.sec.cards.splice(found.index, 1);
  commit();
}

function commit() { saveBoard(); render(); }

function addSection(name) {
  const sec = { id: uid(), name: name || 'Nueva sección', collapsed: false, cards: [] };
  board.sections.push(sec);
  commit();
  const title = $(`#sec-${CSS.escape(sec.id)} [data-sec-title]`);
  title.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (!name) { title.focus(); document.getSelection().selectAllChildren(title); }
}

/* ---------- Arrastrar y soltar (pointer events: mouse y táctil) ---------- */
let drag = null;

function onPointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  if (e.target.closest('button, input, select, [contenteditable="true"]')) return;
  const src = e.target.closest('.lib-item, .card');
  if (!src) return;

  drag = {
    src,
    kind: src.classList.contains('card') ? 'card' : 'lib',
    id: src.dataset.cardId || src.dataset.imageId,
    x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
    touch: e.pointerType !== 'mouse',
    active: false,
    timer: null,
    target: null,
    hoverEl: null,
    placeholder: null,
    ghost: null,
    raf: 0,
  };
  if (drag.touch) drag.timer = setTimeout(() => { if (drag && !drag.active) startDrag(); }, 280);

  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', cancelDrag);
}

function onPointerMove(e) {
  if (!drag) return;
  drag.x = e.clientX; drag.y = e.clientY;
  const dist = Math.hypot(drag.x - drag.x0, drag.y - drag.y0);
  if (!drag.active) {
    if (drag.touch) { if (dist > 10) cancelDrag(); }
    else if (dist > 5) startDrag();
    return;
  }
  e.preventDefault();
  moveGhost();
  updateTarget();
}

// En táctil, impedir el desplazamiento de la página una vez que el arrastre empezó.
window.addEventListener('touchmove', (e) => { if (drag && drag.active) e.preventDefault(); }, { passive: false });
window.addEventListener('contextmenu', (e) => { if (drag) e.preventDefault(); });
document.addEventListener('dragstart', (e) => { if (e.target.closest && e.target.closest('.lib-item, .card')) e.preventDefault(); });

function startDrag() {
  drag.active = true;
  document.body.classList.add('dragging');
  document.activeElement?.blur?.();

  const imgId = drag.kind === 'card' ? findCard(drag.id)?.card.imageId : drag.id;
  const img = images.get(imgId);
  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.innerHTML = `${img ? `<img alt="" src="${urlFor(img)}">` : ''}<span>${escapeHtml(img ? titleFromName(img.name) : imgId || '')}</span>`;
  document.body.appendChild(ghost);
  drag.ghost = ghost;

  drag.placeholder = document.createElement('div');
  drag.placeholder.className = 'placeholder';

  if (drag.kind === 'card') {
    drag.src.parentNode.insertBefore(drag.placeholder, drag.src);
    drag.src.classList.add('drag-source');
  }
  if (navigator.vibrate && drag.touch) navigator.vibrate(12);
  moveGhost();
  updateTarget();
  autoScroll();
}

function moveGhost() {
  drag.ghost.style.left = drag.x + 'px';
  drag.ghost.style.top = drag.y + 'px';
}

function setHover(el, cls = 'drop-hover') {
  if (drag.hoverEl === el && drag.hoverCls === cls) return;
  if (drag.hoverEl) drag.hoverEl.classList.remove(drag.hoverCls);
  drag.hoverEl = el;
  drag.hoverCls = cls;
  if (el) el.classList.add(cls);
}

function updateTarget() {
  const el = document.elementFromPoint(drag.x, drag.y);
  const zone = el && el.closest('.dropzone');
  const secDrop = el && el.closest('[data-drop-sec]');
  const lib = el && el.closest('#library');

  if (zone) {
    setHover(zone);
    const cards = [...zone.querySelectorAll('.card:not(.drag-source)')];
    let before = null;
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (drag.y < r.top || (drag.y <= r.bottom && drag.x < r.left + r.width / 2)) { before = c; break; }
    }
    if (before) { if (drag.placeholder.nextSibling !== before) zone.insertBefore(drag.placeholder, before); }
    else if (zone.lastElementChild !== drag.placeholder) zone.appendChild(drag.placeholder);
    drag.target = { secId: zone.dataset.secId, zone };
    return;
  }

  drag.placeholder.remove();
  if (secDrop) {
    setHover(secDrop);
    drag.target = { secId: secDrop.dataset.dropSec, append: true };
  } else if (lib && drag.kind === 'card') {
    setHover(lib, 'drop-remove');
    drag.target = { remove: true };
  } else {
    setHover(null);
    drag.target = null;
  }
}

function autoScroll() {
  if (!drag || !drag.active) return;
  const edge = 70;
  const speed = (d) => Math.ceil(((edge - d) / edge) * 18);
  if (drag.y < edge) window.scrollBy(0, -speed(drag.y));
  else if (window.innerHeight - drag.y < edge) window.scrollBy(0, speed(window.innerHeight - drag.y));

  // Desplazamiento de la lista de la biblioteca y de la barra de secciones.
  const list = $('#libraryList');
  const lr = list.getBoundingClientRect();
  if (drag.x >= lr.left && drag.x <= lr.right) {
    if (drag.y > lr.top && drag.y < lr.top + 40) list.scrollTop -= 10;
    else if (drag.y < lr.bottom && drag.y > lr.bottom - 40) list.scrollTop += 10;
  }
  const nav = $('#sectionNav');
  const nr = nav.getBoundingClientRect();
  if (drag.y >= nr.top && drag.y <= nr.bottom) {
    if (drag.x < nr.left + 40) nav.scrollLeft -= 10;
    else if (drag.x > nr.right - 40) nav.scrollLeft += 10;
  }
  updateTarget();
  drag.raf = requestAnimationFrame(autoScroll);
}

function endDragListeners() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', cancelDrag);
}

function cleanupDrag() {
  if (!drag) return;
  clearTimeout(drag.timer);
  cancelAnimationFrame(drag.raf);
  if (drag.hoverEl) drag.hoverEl.classList.remove(drag.hoverCls);
  drag.ghost?.remove();
  drag.placeholder?.remove();
  drag.src.classList.remove('drag-source');
  document.body.classList.remove('dragging');
  endDragListeners();
  drag = null;
}

function cancelDrag() { cleanupDrag(); }

function onPointerUp(e) {
  if (!drag) return;
  const d = drag;
  if (!d.active) {
    // Fue un clic / toque: abrir el visor.
    cleanupDrag();
    if (e.target.closest('.lib-item, .card') === d.src) openViewer(d.kind, d.id);
    return;
  }

  let index = null;
  const t = d.target;
  if (t && t.zone && d.placeholder.parentNode === t.zone) {
    index = 0;
    for (const n of t.zone.children) {
      if (n === d.placeholder) break;
      if (n.classList.contains('card') && !n.classList.contains('drag-source')) index++;
    }
  }
  cleanupDrag();
  if (!t) return;

  if (t.remove) { removeCard(d.id); toast('Imagen quitada del tablero.'); return; }
  if (d.kind === 'lib') addCard(t.secId, d.id, t.append ? null : index);
  else moveCard(d.id, t.secId, t.append ? null : index);
}

/* ---------- Arrastrar archivos desde el escritorio ---------- */
function setupFileDrop() {
  const lib = $('#library');
  let depth = 0;
  const isFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  document.addEventListener('dragenter', (e) => { if (isFiles(e)) { depth++; lib.classList.add('drop-files'); } });
  document.addEventListener('dragleave', (e) => { if (isFiles(e) && --depth <= 0) { depth = 0; lib.classList.remove('drop-files'); } });
  document.addEventListener('dragover', (e) => { if (isFiles(e)) e.preventDefault(); });
  document.addEventListener('drop', async (e) => {
    if (!isFiles(e)) return;
    e.preventDefault();
    depth = 0;
    lib.classList.remove('drop-files');
    toast('Leyendo archivos…');
    const entries = await filesFromDataTransfer(e.dataTransfer);
    await addFiles(entries);
  });
}

/* ---------- Visor ---------- */
const viewer = { kind: null, id: null };

function openViewer(kind, id) {
  const dlg = $('#viewer');
  let img, title;
  if (kind === 'card') {
    const f = findCard(id);
    if (!f) return;
    img = images.get(f.card.imageId);
    title = f.card.title;
    $('#viewerPath').textContent = f.card.imageId;
  } else {
    img = images.get(id);
    if (!img) return;
    title = titleFromName(img.name);
    $('#viewerPath').textContent = img.path;
  }
  viewer.kind = kind; viewer.id = id;
  $('#viewerImg').src = img ? urlFor(img) : '';
  $('#viewerImg').alt = title;
  $('#viewerTitle').textContent = title;

  const sel = $('#viewerSection');
  const currentSec = kind === 'card' ? findCard(id).sec.id : null;
  sel.innerHTML = board.sections.map((s) => `<option value="${s.id}" ${s.id === currentSec ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
  if (kind === 'lib' && img) {
    const match = board.sections.find((s) => norm(s.name) === norm(img.folder));
    if (match) sel.value = match.id;
  }
  $('#viewerPrimary').textContent = kind === 'card' ? 'Mover a esta sección' : 'Agregar a esta sección';
  $('#viewerRemove').hidden = kind !== 'card';
  dlg.showModal();
}

function setupViewer() {
  const dlg = $('#viewer');
  $('#viewerPrimary').addEventListener('click', () => {
    const secId = $('#viewerSection').value;
    if (!secId) return;
    if (viewer.kind === 'lib') { addCard(secId, viewer.id); toast('Imagen agregada.'); }
    else { moveCard(viewer.id, secId); toast('Imagen movida.'); }
    dlg.close();
  });
  $('#viewerRemove').addEventListener('click', () => { removeCard(viewer.id); dlg.close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Exportar / importar ---------- */
function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

async function exportCatalog() {
  const sections = board.sections.filter((s) => s.cards.length);
  if (!sections.length) { toast('El tablero está vacío: no hay nada que exportar.'); return; }
  toast('Generando catálogo…', 10000);

  const cache = new Map();
  const parts = [];
  let missing = 0;
  for (const sec of sections) {
    const cards = [];
    for (const c of sec.cards) {
      const img = images.get(c.imageId);
      if (!img) { missing++; continue; }
      if (!cache.has(img.id)) cache.set(img.id, await blobToDataURL(img.blob));
      cards.push(`<figure class="c" data-t="${escapeHtml(norm(c.title))}"><img loading="lazy" alt="${escapeHtml(c.title)}" src="${cache.get(img.id)}"><figcaption>${escapeHtml(c.title)}</figcaption></figure>`);
    }
    parts.push({ sec, html: cards.join('\n') });
  }

  const date = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const slug = (s, i) => 's' + i + '-' + norm(s).replace(/[^a-z0-9]+/g, '-');
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Catálogo de Señalización</title>
<style>
:root{--bg:#f4f6f9;--s:#fff;--b:#d8dde5;--t:#1b2330;--m:#5d6878;--a:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#11151c;--s:#1a2029;--b:#2f3846;--t:#e6eaf0;--m:#9aa5b5;--a:#5b8dff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--t);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
header{position:sticky;top:0;z-index:5;background:var(--s);border-bottom:1px solid var(--b);padding:12px 16px}
h1{margin:0 0 2px;font-size:20px}header p{margin:0 0 8px;color:var(--m);font-size:12px}
input{width:100%;max-width:420px;padding:8px 10px;border:1px solid var(--b);border-radius:8px;background:var(--bg);color:inherit;font:inherit}
nav{display:flex;gap:6px;overflow-x:auto;padding:8px 0 2px}nav a{flex:none;padding:4px 10px;border:1px solid var(--b);border-radius:999px;color:inherit;text-decoration:none;font-size:12px;background:var(--s)}
main{padding:16px;display:grid;gap:16px;max-width:1400px;margin:0 auto}
section{background:var(--s);border:1px solid var(--b);border-radius:10px;scroll-margin-top:140px}
h2{margin:0;padding:12px 14px;border-bottom:1px solid var(--b);font-size:17px}h2 small{color:var(--m);font-weight:400;font-size:12px;margin-left:6px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:12px}
.c{margin:0;border:1px solid var(--b);border-radius:8px;overflow:hidden;cursor:zoom-in}
.c img{display:block;width:100%;aspect-ratio:3/4;object-fit:contain;background:var(--bg)}
.c figcaption{padding:6px 8px;font-size:12px;border-top:1px solid var(--b)}
.hide{display:none!important}
#lb{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;z-index:10;cursor:zoom-out;padding:16px}
#lb.on{display:flex}#lb img{max-width:100%;max-height:100%;object-fit:contain}
</style></head><body>
<header><h1>Catálogo de Señalización</h1><p>Generado el ${escapeHtml(date)}</p>
<input id="q" type="search" placeholder="Buscar señalización…">
<nav>${parts.map((p, i) => `<a href="#${slug(p.sec.name, i)}">${escapeHtml(p.sec.name)}</a>`).join('')}</nav></header>
<main>
${parts.map((p, i) => `<section id="${slug(p.sec.name, i)}"><h2>${escapeHtml(p.sec.name)}<small>${p.sec.cards.length}</small></h2><div class="g">
${p.html}
</div></section>`).join('\n')}
</main>
<div id="lb"><img alt=""></div>
<script>
var q=document.getElementById('q'),lb=document.getElementById('lb');
function n(s){return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim()}
q.addEventListener('input',function(){var v=n(q.value);document.querySelectorAll('section').forEach(function(s){var any=false;s.querySelectorAll('.c').forEach(function(c){var ok=!v||c.dataset.t.indexOf(v)>-1;c.classList.toggle('hide',!ok);any=any||ok});s.classList.toggle('hide',!any)})});
document.addEventListener('click',function(e){var c=e.target.closest('.c');if(c){lb.firstChild.src=c.querySelector('img').src;lb.classList.add('on')}else if(e.target.closest('#lb')){lb.classList.remove('on')}});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.classList.remove('on')});
<\/script></body></html>`;

  download('catalogo-senalizacion.html', new Blob([html], { type: 'text/html' }));
  toast(missing ? `Catálogo exportado. ${missing} tarjetas sin imagen se omitieron.` : 'Catálogo exportado.', 4000);
}

function saveJson() {
  const data = {
    app: 'tablero-senalizacion',
    version: 1,
    savedAt: new Date().toISOString(),
    sections: board.sections.map((s) => ({ name: s.name, cards: s.cards.map((c) => ({ path: c.imageId, title: c.title })) })),
  };
  const stamp = new Date().toISOString().slice(0, 10);
  download(`tablero-senalizacion-${stamp}.json`, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  toast('Tablero guardado. Las imágenes no van en el archivo: vuelve a cargar la carpeta para verlas.', 4500);
}

async function openJson(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('El archivo no es un JSON válido.'); return; }
  if (!data || !Array.isArray(data.sections)) { toast('El archivo no parece un tablero guardado.'); return; }
  if (!confirm('Esto reemplaza el tablero actual por el del archivo. ¿Continuar?')) return;
  board = {
    sections: data.sections.map((s) => ({
      id: uid(),
      name: String(s.name || 'Sección'),
      collapsed: false,
      cards: (Array.isArray(s.cards) ? s.cards : []).filter((c) => c && c.path).map((c) => ({
        id: uid(), imageId: String(c.path), title: String(c.title ?? titleFromName(String(c.path).split('/').pop())),
      })),
    })),
  };
  commit();
  const missing = board.sections.reduce((n, s) => n + s.cards.filter((c) => !images.has(c.imageId)).length, 0);
  toast(missing ? `Tablero abierto. ${missing} imágenes faltan en la biblioteca: carga la carpeta para verlas.` : 'Tablero abierto.', 4500);
}

/* ---------- Publicación en GitHub ---------- */
function getConfig() {
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch { /* sin almacenamiento */ }
  // En <org>.github.io/<repo>/ se puede deducir la organización y el repositorio.
  const host = location.hostname;
  if (!cfg.owner && /\.github\.io$/i.test(host) && !/\.pages\.github\.io$/i.test(host)) {
    cfg.owner = host.split('.')[0];
    const first = location.pathname.split('/').filter(Boolean)[0];
    cfg.repo = first && !/\.html?$/i.test(first) ? first : `${cfg.owner}.github.io`;
  }
  return { owner: '', repo: '', branch: 'main', token: '', ...cfg };
}

function setConfig(cfg) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); return true; } catch { return false; }
}

class GhError extends Error {
  constructor(status, message, retryAfter) { super(message); this.status = status; this.retryAfter = retryAfter; }
}

function ghErrorText(e) {
  if (!(e instanceof GhError)) return 'No se pudo conectar con GitHub. Revisa tu conexión a internet.';
  const m = e.message || '';
  if (e.status === 401) return 'El token no es válido o ya expiró.';
  if (e.status === 403 && /SAML|SSO/i.test(m)) return 'La organización usa SSO: autoriza el token para la organización en GitHub (Settings → Tokens → Configure SSO).';
  if (e.status === 403) return `GitHub rechazó la operación: ${m || 'sin permiso'}. Revisa que el token tenga "Contents: Read and write" en este repositorio y que la organización lo haya aprobado.`;
  if (e.status === 404) return 'No se encontró el repositorio o la rama, o el token no tiene acceso a ellos.';
  if (e.status === 409) return 'El repositorio está vacío. Sube primero los archivos de la app.';
  if (e.status === 422) return `GitHub no aceptó el cambio: ${m}. Intenta publicar de nuevo.`;
  return `Error de GitHub (${e.status}): ${m}`;
}

async function gh(cfg, path, { method = 'GET', body } = {}) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${cfg.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (r.ok) return r.status === 204 ? null : r.json();
    const data = await r.json().catch(() => ({}));
    const msg = data.message || r.statusText;
    // Límite secundario de GitHub para creación de contenido: esperar y reintentar.
    const limited = r.status === 429 || (r.status === 403 && /rate limit/i.test(msg));
    if (limited && attempt < 6) {
      const wait = Number(r.headers.get('retry-after')) || 60;
      await countdown(wait, 'GitHub pidió esperar por exceso de solicitudes');
      continue;
    }
    throw new GhError(r.status, msg);
  }
}

async function countdown(seconds, label) {
  for (let s = seconds; s > 0; s--) {
    setPublishProgress(`${label}… ${s} s`);
    await new Promise((res) => setTimeout(res, 1000));
  }
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function repoPath(cfg) { return `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`; }
function refPath(cfg) { return cfg.branch.split('/').map(encodeURIComponent).join('/'); }

async function optimizeImage(blob) {
  let bmp;
  try { bmp = await createImageBitmap(blob); } catch { bmp = null; }
  if (!bmp) {
    // Formato que el navegador no puede redibujar (p. ej. SVG): se publica tal cual.
    const ext = (blob.type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    return { blob, ext };
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && blob.type === 'image/jpeg' && blob.size < 700 * 1024) { bmp.close?.(); return { blob, ext: 'jpg' }; }
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // las transparencias de PNG quedan sobre blanco
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const out = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', JPEG_QUALITY));
  if (!out) return { blob, ext: 'jpg' };
  if (scale === 1 && blob.type === 'image/jpeg' && out.size >= blob.size) return { blob, ext: 'jpg' };
  return { blob: out, ext: 'jpg' };
}

async function blobToBase64(blob) {
  const url = await blobToDataURL(blob);
  return url.slice(url.indexOf(',') + 1);
}

let publishing = false;

function setPublishProgress(text) {
  const el = $('#publishState');
  el.className = 'publish-state busy';
  el.textContent = text;
}

function renderPublishState() {
  if (publishing) return;
  const el = $('#publishState');
  if (!el) return;
  if (board.dirty) {
    el.className = 'publish-state dirty';
    el.textContent = 'Cambios sin publicar';
  } else if (board.publishedAt) {
    el.className = 'publish-state';
    el.textContent = 'Publicado ' + new Date(board.publishedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } else {
    el.className = 'publish-state';
    el.textContent = '';
  }
}

async function publish() {
  if (publishing) return;
  const cfg = getConfig();
  if (!cfg.owner || !cfg.repo || !cfg.branch || !cfg.token) { openSettings('Configura el repositorio y el token antes de publicar.'); return; }

  const usedIds = [...new Set(board.sections.flatMap((s) => s.cards.map((c) => c.imageId)))];
  const missing = usedIds.filter((id) => !images.has(id));
  const present = usedIds.filter((id) => images.has(id));
  if (missing.length && !confirm(`${missing.length} tarjetas no tienen su imagen en la biblioteca y se publicarán sin ella. ¿Continuar?`)) return;
  if (!confirm(`Se publicará el tablero con ${present.length} imágenes en ${cfg.owner}/${cfg.repo} (rama ${cfg.branch}). Todos los que abran el panel de lectura verán estos cambios. ¿Publicar?`)) return;

  publishing = true;
  const btn = $('#publishBtn');
  btn.disabled = true;
  try {
    const base = repoPath(cfg);
    setPublishProgress('Conectando con GitHub…');
    const ref = await gh(cfg, `${base}/git/ref/heads/${refPath(cfg)}`);
    const headSha = ref.object.sha;
    const head = await gh(cfg, `${base}/git/commits/${headSha}`);
    const tree = await gh(cfg, `${base}/git/trees/${head.tree.sha}?recursive=1`);

    // Imágenes ya publicadas: data/img/<sha1>.<ext>
    const existing = new Map();
    for (const t of tree.tree) {
      if (t.type !== 'blob' || !t.path.startsWith(`${PUB_DIR}/img/`)) continue;
      const file = t.path.slice(PUB_DIR.length + 5);
      existing.set(file.replace(/\.[^.]+$/, ''), t.path);
    }

    const entries = [];
    const keep = new Set();
    const srcById = new Map();
    let uploaded = 0, lastUpload = 0;
    for (let i = 0; i < present.length; i++) {
      const img = images.get(present[i]);
      if (!img.hash) img.hash = await sha1(img.blob);
      let path = existing.get(img.hash);
      if (!path) {
        setPublishProgress(`Optimizando y subiendo ${i + 1} de ${present.length}…`);
        const { blob, ext } = img.published ? { blob: img.blob, ext: img.ext || 'jpg' } : await optimizeImage(img.blob);
        // Espaciar las subidas para no chocar con el límite de GitHub (~80 por minuto).
        const wait = 800 - (Date.now() - lastUpload);
        if (wait > 0) await sleep(wait);
        lastUpload = Date.now();
        const created = await gh(cfg, `${base}/git/blobs`, { method: 'POST', body: { content: await blobToBase64(blob), encoding: 'base64' } });
        path = `${PUB_DIR}/img/${img.hash}.${ext}`;
        entries.push({ path, mode: '100644', type: 'blob', sha: created.sha });
        existing.set(img.hash, path);
        uploaded++;
      }
      keep.add(path);
      srcById.set(img.id, path.slice(PUB_DIR.length + 1));
    }

    // Quitar del repositorio las imágenes que ya no se usan.
    let removed = 0;
    for (const t of tree.tree) {
      if (t.type === 'blob' && t.path.startsWith(`${PUB_DIR}/img/`) && !keep.has(t.path)) {
        entries.push({ path: t.path, mode: '100644', type: 'blob', sha: null });
        removed++;
      }
    }

    const updatedAt = new Date().toISOString();
    const data = {
      app: 'tablero-senalizacion',
      version: 1,
      updatedAt,
      sections: board.sections.map((s) => ({
        name: s.name,
        cards: s.cards.filter((c) => srcById.has(c.imageId)).map((c) => ({ title: c.title, path: c.imageId, src: srcById.get(c.imageId) })),
      })),
    };
    entries.push({ path: PUB_JSON, mode: '100644', type: 'blob', content: JSON.stringify(data, null, 2) + '\n' });

    setPublishProgress('Guardando cambios en el repositorio…');
    const newTree = await gh(cfg, `${base}/git/trees`, { method: 'POST', body: { base_tree: head.tree.sha, tree: entries } });
    const cardCount = data.sections.reduce((n, s) => n + s.cards.length, 0);
    const commitObj = await gh(cfg, `${base}/git/commits`, {
      method: 'POST',
      body: { message: `Actualizar tablero de señalización (${cardCount} tarjetas)`, tree: newTree.sha, parents: [headSha] },
    });
    await gh(cfg, `${base}/git/refs/heads/${refPath(cfg)}`, { method: 'PATCH', body: { sha: commitObj.sha } });

    for (const [id, src] of srcById) {
      const img = images.get(id);
      if (img) img.publishedSrc = src;
    }
    board.dirty = false;
    board.publishedAt = updatedAt;
    publishing = false;
    saveBoard({ dirty: false });
    toast(`Publicado: ${uploaded} imágenes nuevas${removed ? `, ${removed} retiradas` : ''}. El panel de lectura se actualiza en 1–2 minutos.`, 6000);
  } catch (e) {
    console.error(e);
    publishing = false;
    renderPublishState();
    toast('No se publicó. ' + ghErrorText(e), 8000);
  } finally {
    publishing = false;
    btn.disabled = false;
    renderPublishState();
  }
}

/* ---------- Cargar lo publicado ---------- */
async function fetchPublished() {
  const r = await fetch(`${PUB_JSON}?t=${Date.now()}`, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return data && Array.isArray(data.sections) ? data : null;
}

async function loadPublished(data) {
  const cards = data.sections.flatMap((s) => (Array.isArray(s.cards) ? s.cards : [])).filter((c) => c && c.path && c.src);
  const toFetch = new Map();
  for (const c of cards) {
    const hash = String(c.src).split('/').pop().replace(/\.[^.]+$/, '');
    const local = images.get(c.path);
    if (!local || local.hash !== hash) toFetch.set(c.path, { src: c.src, hash });
  }

  let done = 0;
  const fetched = [];
  for (const [path, { src, hash }] of toFetch) {
    toast(`Descargando imágenes publicadas… ${++done}/${toFetch.size}`, 60000);
    try {
      const r = await fetch(`${PUB_DIR}/${src}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const cut = path.lastIndexOf('/');
      const prev = images.get(path);
      if (prev?.url) URL.revokeObjectURL(prev.url);
      const rec = {
        id: path, path,
        folder: cut === -1 ? '' : path.slice(0, cut),
        name: cut === -1 ? path : path.slice(cut + 1),
        blob, hash, published: true, ext: src.split('.').pop(),
      };
      images.set(path, { ...rec, url: null });
      fetched.push(rec);
    } catch (e) {
      console.warn('No se pudo descargar', src, e);
    }
  }
  if (fetched.length) await idb('images', 'readwrite', (s) => { fetched.forEach((r) => s.put(r)); }).catch(console.error);

  board = {
    dirty: false,
    publishedAt: data.updatedAt || null,
    sections: data.sections.map((s) => ({
      id: uid(),
      name: String(s.name || 'Sección'),
      collapsed: false,
      cards: (Array.isArray(s.cards) ? s.cards : []).filter((c) => c && c.path).map((c) => ({ id: uid(), imageId: String(c.path), title: String(c.title ?? '') })),
    })),
  };
  saveBoard({ dirty: false });
  render();
  toast('Se cargó la versión publicada.');
}

async function loadPublishedAction() {
  if (board.dirty && !confirm('Tienes cambios sin publicar. Se descartarán y se cargará la versión publicada. ¿Continuar?')) return;
  try {
    const data = await fetchPublished();
    if (!data) { toast('Todavía no hay nada publicado.'); return; }
    await loadPublished(data);
  } catch (e) {
    console.error(e);
    toast('No se pudo leer la versión publicada.');
  }
}

/* ---------- Configuración ---------- */
function openSettings(message) {
  const cfg = getConfig();
  $('#cfgOwner').value = cfg.owner;
  $('#cfgRepo').value = cfg.repo;
  $('#cfgBranch').value = cfg.branch || 'main';
  $('#cfgToken').value = cfg.token;
  const res = $('#cfgResult');
  res.className = 'cfg-result';
  res.textContent = message || '';
  $('#settings').showModal();
}

function readSettingsForm() {
  return {
    owner: $('#cfgOwner').value.trim(),
    repo: $('#cfgRepo').value.trim(),
    branch: $('#cfgBranch').value.trim() || 'main',
    token: $('#cfgToken').value.trim(),
  };
}

function setupSettings() {
  const dlg = $('#settings');
  const res = $('#cfgResult');
  $('#settingsForm').addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    if (!setConfig(readSettingsForm())) toast('Este navegador no permite guardar la configuración.');
    else toast('Configuración guardada.');
  });
  $('#cfgTest').addEventListener('click', async () => {
    const cfg = readSettingsForm();
    if (!cfg.owner || !cfg.repo || !cfg.token) { res.className = 'cfg-result err'; res.textContent = 'Completa organización, repositorio y token.'; return; }
    res.className = 'cfg-result'; res.textContent = 'Probando…';
    try {
      const repo = await gh(cfg, repoPath(cfg));
      await gh(cfg, `${repoPath(cfg)}/git/ref/heads/${refPath(cfg)}`);
      if (repo.permissions && !repo.permissions.push) {
        res.className = 'cfg-result err';
        res.textContent = 'El token puede leer el repositorio pero no escribir en él.';
      } else {
        res.className = 'cfg-result ok';
        res.textContent = `Conexión correcta con ${repo.full_name} (rama ${cfg.branch}).`;
      }
    } catch (e) {
      res.className = 'cfg-result err';
      res.textContent = ghErrorText(e);
    }
  });
  $('#cfgForget').addEventListener('click', () => {
    const cfg = { ...getConfig(), token: '' };
    setConfig(cfg);
    $('#cfgToken').value = '';
    res.className = 'cfg-result ok';
    res.textContent = 'Token borrado de este navegador.';
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Acciones del menú ---------- */
function autoPlace() {
  const counts = placementCounts();
  const bySec = new Map(board.sections.map((s) => [norm(s.name), s]));
  const plan = [];
  for (const img of images.values()) {
    if (counts.get(img.id) || !img.folder) continue;
    const sec = bySec.get(norm(img.folder));
    if (sec) plan.push([sec, img]);
  }
  if (!plan.length) { toast('No hay imágenes sin colocar cuya carpeta coincida con el nombre de una sección.', 4000); return; }
  if (!confirm(`Se colocarán ${plan.length} imágenes sin colocar en la sección cuyo nombre coincide con su carpeta (ignorando acentos y mayúsculas). ¿Continuar?`)) return;
  plan.sort((a, b) => collator.compare(a[1].name, b[1].name));
  for (const [sec, img] of plan) sec.cards.push({ id: uid(), imageId: img.id, title: titleFromName(img.name) });
  commit();
  toast(`${plan.length} imágenes colocadas.`);
}

function sectionsFromFolders() {
  const existing = new Set(board.sections.map((s) => norm(s.name)));
  const folders = [...new Set([...images.values()].map((i) => i.folder.split('/')[0].trim()).filter(Boolean))];
  const missing = folders.filter((f) => !existing.has(norm(f))).sort(collator.compare);
  if (!missing.length) { toast('Todas las carpetas ya tienen una sección con el mismo nombre.'); return; }
  if (!confirm(`Se crearán ${missing.length} secciones:\n\n${missing.join('\n')}`)) return;
  for (const name of missing) board.sections.push({ id: uid(), name, collapsed: false, cards: [] });
  commit();
}

async function clearLibrary() {
  if (!confirm('Se borrarán todas las imágenes guardadas en este navegador. El tablero conserva la distribución. ¿Continuar?')) return;
  for (const img of images.values()) if (img.url) URL.revokeObjectURL(img.url);
  images.clear();
  await idb('images', 'readwrite', (s) => s.clear()).catch(console.error);
  render();
  toast('Biblioteca borrada.');
}

function handleMenu(action) {
  switch (action) {
    case 'settings': return openSettings();
    case 'load-published': return loadPublishedAction();
    case 'auto-place': return autoPlace();
    case 'sections-from-folders': return sectionsFromFolders();
    case 'add-section': return addSection();
    case 'clear-board':
      if (confirm('Se quitarán todas las imágenes del tablero (las secciones se conservan). ¿Continuar?')) {
        board.sections.forEach((s) => { s.cards = []; });
        commit();
      }
      return;
    case 'reset-sections':
      if (confirm('Se reemplazarán las secciones por las originales y se vaciará el tablero. ¿Continuar?')) {
        board = defaultBoard();
        commit();
      }
      return;
    case 'clear-library': return clearLibrary();
  }
}

/* ---------- Eventos ---------- */
function setupEvents() {
  document.addEventListener('pointerdown', onPointerDown);

  $('#folderInput').addEventListener('change', (e) => {
    const files = [...e.target.files].map((f) => ({ file: f, path: f.webkitRelativePath || f.name }));
    e.target.value = '';
    addFiles(files);
  });
  $('#filesInput').addEventListener('change', (e) => {
    const files = [...e.target.files].map((f) => ({ file: f, path: f.name }));
    e.target.value = '';
    addFiles(files);
  });
  $('#openJsonInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) openJson(f);
  });
  $('#exportHtmlBtn').addEventListener('click', () => exportCatalog().catch((err) => { console.error(err); toast('No se pudo exportar el catálogo.'); }));
  $('#saveJsonBtn').addEventListener('click', saveJson);
  $('#publishBtn').addEventListener('click', publish);
  window.addEventListener('beforeunload', (e) => { if (publishing) { e.preventDefault(); e.returnValue = ''; } });
  $('#addSectionBtn').addEventListener('click', () => addSection());

  const menu = $('.menu');
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    menu.open = false;
    handleMenu(b.dataset.action);
  });
  document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });

  $('#searchInput').addEventListener('input', (e) => { ui.query = e.target.value; renderLibrary(placementCounts()); });
  $('#onlyUnplaced').addEventListener('change', (e) => { ui.onlyUnplaced = e.target.checked; renderLibrary(placementCounts()); });

  $('#libraryList').addEventListener('click', (e) => {
    const t = e.target.closest('[data-folder-toggle]');
    if (!t) return;
    const folder = t.parentElement.dataset.folder;
    if (ui.collapsedFolders.has(folder)) ui.collapsedFolders.delete(folder); else ui.collapsedFolders.add(folder);
    t.parentElement.classList.toggle('collapsed');
  });
  $('#libraryList').addEventListener('keydown', (e) => {
    const item = e.target.closest('.lib-item');
    if (item && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openViewer('lib', item.dataset.imageId); }
  });

  $('#sectionNav').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-jump]');
    if (chip) document.getElementById('sec-' + chip.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const boardEl = $('#board');
  boardEl.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-card-remove]');
    if (rm) { removeCard(rm.closest('.card').dataset.cardId); return; }
    const act = e.target.closest('[data-sec-action]');
    if (!act) return;
    const secId = act.closest('.sec').dataset.secId;
    const i = board.sections.findIndex((s) => s.id === secId);
    const sec = board.sections[i];
    switch (act.dataset.secAction) {
      case 'collapse': sec.collapsed = !sec.collapsed; saveBoard({ dirty: false }); render(); return;
      case 'up': if (i > 0) [board.sections[i - 1], board.sections[i]] = [board.sections[i], board.sections[i - 1]]; break;
      case 'down': if (i < board.sections.length - 1) [board.sections[i + 1], board.sections[i]] = [board.sections[i], board.sections[i + 1]]; break;
      case 'delete':
        if (!confirm(`¿Eliminar la sección "${sec.name}"${sec.cards.length ? ` y sus ${sec.cards.length} imágenes colocadas` : ''}?`)) return;
        board.sections.splice(i, 1);
        break;
    }
    commit();
  });

  // Edición en línea de títulos (secciones y tarjetas)
  boardEl.addEventListener('keydown', (e) => {
    if (e.target.matches('[contenteditable="true"]')) {
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Escape') { e.target.dataset.cancel = '1'; e.target.blur(); }
    }
  });
  boardEl.addEventListener('focusout', (e) => {
    const t = e.target;
    if (!t.matches || !t.matches('[contenteditable="true"]')) return;
    const value = t.textContent.replace(/\s+/g, ' ').trim();
    const cancel = t.dataset.cancel; delete t.dataset.cancel;
    if (t.matches('[data-sec-title]')) {
      const sec = board.sections.find((s) => s.id === t.closest('.sec').dataset.secId);
      if (!sec) return;
      if (cancel || !value) { t.textContent = sec.name; return; }
      if (value !== sec.name) { sec.name = value; commit(); }
    } else if (t.matches('[data-card-title]')) {
      const f = findCard(t.closest('.card').dataset.cardId);
      if (!f) return;
      if (cancel || !value) { t.textContent = f.card.title; return; }
      if (value !== f.card.title) { f.card.title = value; saveBoard(); }
    }
  });
  boardEl.addEventListener('paste', (e) => {
    if (!e.target.closest('[contenteditable="true"]')) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });

  setupFileDrop();
  setupViewer();
  setupSettings();
}

/* ---------- Inicio ---------- */
function trackHeaderHeight() {
  const bar = $('.topbar');
  const set = () => {
    const h = getComputedStyle(bar).position === 'sticky' ? bar.offsetHeight : 0;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  };
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(bar);
  window.addEventListener('resize', set);
}

async function init() {
  trackHeaderHeight();
  setupEvents();
  try {
    db = await openDB();
    navigator.storage?.persist?.().catch(() => {});
    const [saved, stored] = await Promise.all([
      idb('state', 'readonly', (s) => s.get('board')),
      idb('images', 'readonly', (s) => s.getAll()),
    ]);
    board = saved && Array.isArray(saved.sections) ? saved : null;
    for (const rec of stored || []) images.set(rec.id, { ...rec, url: null });
  } catch (e) {
    console.warn(e);
    toast('Este navegador no permite guardar datos: el tablero se perderá al cerrar la página.', 5000);
  }

  // Sincronizar con lo publicado: si no hay trabajo local, o si otra persona publicó después.
  let published = null;
  try { published = await fetchPublished(); } catch (e) { console.warn(e); }
  if (published && (!board || (!board.dirty && published.updatedAt && published.updatedAt !== board.publishedAt))) {
    board = board || defaultBoard();
    render();
    await loadPublished(published);
    return;
  }
  if (!board) board = defaultBoard();
  render();
  renderPublishState();
  if (published && board.dirty && published.updatedAt && board.publishedAt && published.updatedAt > board.publishedAt) {
    toast('Hay una versión publicada más reciente que tus cambios locales. Usa Más → Cargar lo publicado si quieres verla.', 7000);
  }
}

init();
