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

/* ---------- Utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const titleFromName = (name) => name.replace(IMAGE_EXT, '').trim();
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

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
function saveBoard() {
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

  // Si todas comparten la misma carpeta raíz (p. ej. "Señalización/"), se quita.
  const firsts = new Set(list.map((e) => (e.path.includes('/') ? e.path.split('/')[0] : null)));
  const stripRoot = firsts.size === 1 && !firsts.has(null);

  const records = list.map(({ file, path }) => {
    const rel = stripRoot ? path.slice(path.indexOf('/') + 1) : path;
    const cut = rel.lastIndexOf('/');
    return {
      id: rel,
      path: rel,
      folder: cut === -1 ? '' : rel.slice(0, cut),
      name: cut === -1 ? rel : rel.slice(cut + 1),
      blob: file,
    };
  });

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
      case 'collapse': sec.collapsed = !sec.collapsed; break;
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
}

/* ---------- Inicio ---------- */
async function init() {
  setupEvents();
  try {
    db = await openDB();
    navigator.storage?.persist?.().catch(() => {});
    const [saved, stored] = await Promise.all([
      idb('state', 'readonly', (s) => s.get('board')),
      idb('images', 'readonly', (s) => s.getAll()),
    ]);
    board = saved && Array.isArray(saved.sections) ? saved : defaultBoard();
    for (const rec of stored || []) images.set(rec.id, { ...rec, url: null });
  } catch (e) {
    console.warn(e);
    board = defaultBoard();
    toast('Este navegador no permite guardar datos: el tablero se perderá al cerrar la página.', 5000);
  }
  render();
}

init();
