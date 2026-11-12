'use strict';

/* =========================================================================
   Panel de administrador del Manual de Señalización.
   Estructura: Formato → Zona → Área → Espacios (cada espacio: título + foto).
   - Las fotos se cargan desde la computadora y se guardan en IndexedDB.
   - El identificador de cada foto es su ruta relativa literal dentro de la
     carpeta cargada (se conservan acentos, espacios y erratas).
   - Publicar sube todo a la misma carpeta de SharePoint donde está este archivo.
   ========================================================================= */

const DEFAULT_ZONES = [
  {
    name: 'Frente de Tienda',
    areas: ['Entrada y Salida de Clientes', 'Autocobro SCO', 'Carritos Autoservicio', 'Kiosco', 'Línea de Cajas',
      'Servicios al Cliente', 'Lockers de Clientes', 'W.C. Clientes', 'Cajeros'],
  },
  {
    name: 'Piso de Venta',
    areas: ['Frutas y Verduras', 'Carnes', 'Pescados', 'Salchichonería', 'Deli', 'Cocina', 'Panadería', 'Tortillería',
      'Refrigeradores', 'On Demand', 'Electrónica', 'Farmacia', 'Consultorio Médico'],
  },
  {
    name: 'Trastienda',
    areas: ['Recibo', 'Trastienda', 'Compactadora', 'Patio de maniobras', 'Entrada de Personal', 'Comedor',
      'Sala de Descanso', 'W.C. Asociados'],
  },
  { name: 'Protección Civil', areas: [] },
];

// Espacios que ya se conocen por área (se pueden editar, agregar o quitar).
const DEFAULT_SPACES = {
  'Entrada y Salida de Clientes': [
    'Pizarron de Competencia', 'Horario de operación', 'Letrero “No discriminación”', 'Letrero de Pago de Remesas',
    'Medios de pago', 'Prohibida la venta de bebidas alcoholicas y cigarros a menores de edad',
    'Letrero de QFB (Responsable Sanitario)', 'Aviso de Privacidad', 'Tabaco',
    'Plano lay out de equipos de seguridad señalizado',
  ],
};

// Nombres de carpeta/sección anteriores que corresponden a un área.
const AREA_ALIASES = {
  'entrada y salida de cliente': 'Entrada y Salida de Clientes',
  'lockers clientes': 'Lockers de Clientes',
  'f&v': 'Frutas y Verduras',
  'electronica': 'Electrónica',
  'consultorio medico': 'Consultorio Médico',
};

const DEFAULT_FORMATS = [
  { name: 'W2', subtitle: 'Señalización Walmart', color: '#1f4fd6' },
  { name: 'B2', subtitle: 'Señalización Bodega Aurrera', color: '#2e7d32' },
  { name: 'BAE', subtitle: 'Señalización Bodega Aurrera', color: '#2e7d32' },
];

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

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif|svg)$/i;
const DB_NAME = 'tablero-senalizacion';
const DB_VERSION = 1;
const MAX_SIDE = 2000;      // px del lado mayor tras optimizar
const JPEG_QUALITY = 0.85;

/* ---------- Utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const titleFromName = (name) => name.replace(IMAGE_EXT, '').trim();
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
const defaultNote = (area) => `En ${area} solo deberás contar con la siguiente señalización`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

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

/* ---------- Almacenamiento local (IndexedDB) ---------- */
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

/* ---------- Modelo ---------- */
const images = new Map(); // id (ruta) -> { id, path, folder, name, blob, hash, url }
let state = null;          // { dirty, publishedAt, intro, formats, activeId }
let board = null;          // formato activo
const ui = { query: '', onlyUnplaced: false, collapsedFolders: new Set() };

const newSpace = (title, imageId = null) => ({ id: uid(), title, imageId, hidden: false });
const newArea = (name, spaces) => ({ id: uid(), name, note: '', hidden: false, spaces: spaces || (DEFAULT_SPACES[name] || []).map((t) => newSpace(t)) });
const newZone = (name, areas = []) => ({ id: uid(), name, hidden: false, areas });
const newZones = () => DEFAULT_ZONES.map((z) => newZone(z.name, z.areas.map((a) => newArea(a))));

// Botones de la barra del formato en el manual. type: back | checklist | link
const newButton = (type, label, url = '') => ({ id: uid(), type, label, url, visible: true });
function defaultPanel() {
  return {
    showBanner: true,   // foto de portada del formato
    showNotes: true,    // texto azul de cada área
    showEmpty: true,    // espacios que aún no tienen foto ("Imagen pendiente")
    buttons: [newButton('back', 'Cambiar formato'), newButton('checklist', 'Descarga Checklist')],
  };
}

// Completa campos que no existían en versiones anteriores.
function ensureFormatShape(f) {
  const panel = { ...defaultPanel(), ...(f.panel || {}) };
  if (!Array.isArray(panel.buttons)) panel.buttons = defaultPanel().buttons;
  panel.buttons = panel.buttons.map((b) => ({ id: b.id || uid(), type: ['back', 'checklist', 'link'].includes(b.type) ? b.type : 'link', label: String(b.label || ''), url: String(b.url || ''), visible: b.visible !== false }));
  f.panel = panel;
  f.hidden = !!f.hidden;
  f.logo = f.logo || null;
  return f;
}

function newFormat({ name = 'Nuevo formato', subtitle = '', color = '#1f4fd6', banner = null, logo = null, zones, hidden = false, panel } = {}) {
  const f = ensureFormatShape({ id: uid(), name, subtitle, color, banner, logo, hidden, panel, zones: zones || newZones() });
  f.activeZoneId = f.zones[0]?.id || null;
  f.activeAreaId = null;
  return f;
}

function defaultState() {
  const formats = DEFAULT_FORMATS.map((f) => newFormat(f));
  return { dirty: false, publishedAt: null, intro: structuredClone(DEFAULT_INTRO), formats, activeId: formats[0].id };
}

// Formatos de versiones anteriores (secciones con tarjetas) → zonas/áreas/espacios.
function migrateSections(sections, cardImage) {
  const zones = newZones();
  const byName = new Map();
  zones.forEach((z) => z.areas.forEach((a) => byName.set(norm(a.name), a)));
  let other = null;
  for (const s of sections || []) {
    const key = norm(AREA_ALIASES[norm(s.name)] || s.name);
    let area = byName.get(key);
    if (!area) {
      if (!other) { other = newZone('Otras áreas'); zones.push(other); }
      area = newArea(String(s.name || 'Área'), []);
      other.areas.push(area);
      byName.set(key, area);
    }
    for (const c of s.cards || []) {
      const imageId = cardImage(c);
      const empty = area.spaces.find((sp) => !sp.imageId && norm(sp.title) === norm(c.title || ''));
      if (empty) empty.imageId = imageId;
      else area.spaces.push(newSpace(String(c.title || 'Señalización'), imageId));
    }
  }
  return zones;
}

function normalizeState(saved) {
  if (!saved || !Array.isArray(saved.formats) || !saved.formats.length) return null;
  saved.intro = { ...structuredClone(DEFAULT_INTRO), ...(saved.intro || {}) };
  saved.formats = saved.formats.map((f) => {
    if (Array.isArray(f.zones)) return ensureFormatShape(f);
    const nf = newFormat({ name: f.name, subtitle: f.subtitle, color: f.color, zones: migrateSections(f.sections, (c) => c.imageId) });
    nf.id = f.id || nf.id;
    return nf;
  });
  return saved;
}

function setActiveFormat(id) {
  board = state.formats.find((f) => f.id === id) || state.formats[0];
  state.activeId = board.id;
  if (!board.zones.some((z) => z.id === board.activeZoneId)) board.activeZoneId = board.zones[0]?.id || null;
}

const activeZone = () => board.zones.find((z) => z.id === board.activeZoneId) || null;
const activeArea = () => { const z = activeZone(); return (z && z.areas.find((a) => a.id === board.activeAreaId)) || null; };
const allAreas = (f = board) => f.zones.flatMap((z) => z.areas.map((area) => ({ zone: z, area })));
const allSpaces = (f = board) => f.zones.flatMap((z) => z.areas.flatMap((a) => a.spaces));

function findArea(areaId, f = board) {
  for (const zone of f.zones) {
    const index = zone.areas.findIndex((a) => a.id === areaId);
    if (index !== -1) return { zone, area: zone.areas[index], index };
  }
  return null;
}

function findSpace(spaceId, f = board) {
  for (const zone of f.zones) {
    for (const area of zone.areas) {
      const index = area.spaces.findIndex((s) => s.id === spaceId);
      if (index !== -1) return { zone, area, index, space: area.spaces[index] };
    }
  }
  return null;
}

function placementCounts() {
  const counts = new Map();
  const add = (id) => { if (id) counts.set(id, (counts.get(id) || 0) + 1); };
  allSpaces().forEach((s) => add(s.imageId));
  add(board.banner);
  add(board.logo);
  add(state.intro && state.intro.banner);
  return counts;
}

let saveTimer;
function saveBoard({ dirty = true } = {}) {
  if (dirty) state.dirty = true;
  renderPublishState();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    idb('state', 'readwrite', (s) => s.put(state, 'board')).catch((e) => console.error(e));
  }, 250);
}

function commit() { saveBoard(); render(); }

function urlFor(img) {
  if (!img) return null;
  if (!img.url) img.url = URL.createObjectURL(img.blob);
  return img.url;
}

/* ---------- Carga de fotos ---------- */
async function addFiles(entries) {
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
  toast(`${plural(added, 'imagen nueva', 'imágenes nuevas')}${updated ? `, ${updated} actualizadas` : ''}.`);
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
      Usa <em>Cargar carpeta</em> y elige tu carpeta de fotos, o arrastra la carpeta aquí.</div>`;
    return;
  }

  const q = norm(ui.query);
  const groups = new Map();
  for (const img of images.values()) {
    if (q && !norm(img.path).includes(q)) continue;
    if (ui.onlyUnplaced && counts.get(img.id)) continue;
    if (!groups.has(img.folder)) groups.set(img.folder, []);
    groups.get(img.folder).push(img);
  }
  if (!groups.size) { list.innerHTML = '<div class="empty-lib">Nada coincide con el filtro.</div>'; return; }

  const frag = document.createDocumentFragment();
  for (const folder of [...groups.keys()].sort(collator.compare)) {
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
        ${n ? `<span class="badge" title="Colocada ${plural(n, 'vez', 'veces')}">${n}</span>` : ''}`;
      items.appendChild(el);
    }
    frag.appendChild(wrap);
  }
  list.replaceChildren(frag);
}

/* ---------- Render: formatos, zonas, áreas y espacios ---------- */
function renderFormatTabs() {
  $('#formatTabs').innerHTML = state.formats.map((f) => {
    const spaces = allSpaces(f);
    const filled = spaces.filter((s) => s.imageId).length;
    return `<button type="button" class="ftab${f.id === board.id ? ' active' : ''}" data-format="${f.id}" style="--fc:${escapeHtml(f.color)}">
      <span class="ftab-mark">${f.logo && images.get(f.logo) ? `<img alt="" src="${urlFor(images.get(f.logo))}">` : escapeHtml(f.name.slice(0, 3))}</span>
      <span class="ftab-text"><strong>${escapeHtml(f.name)}</strong><small>${f.hidden ? 'Oculto en la portada' : `${filled}/${spaces.length} con foto`}</small></span>
    </button>`;
  }).join('') + `<button type="button" class="ftab-tool" data-format-action="edit" title="Botones, secciones, zonas y áreas del panel de ${escapeHtml(board.name)}">⚙ Personalizar panel</button>
    <button type="button" class="ftab-tool" data-format-action="add">+ Formato</button>
    <button type="button" class="ftab-tool" data-format-action="intro" title="Foto y textos de la página de inicio">✎ Página de inicio</button>`;
}

function renderBanner() {
  const el = $('#bannerBox');
  const img = board.banner && images.get(board.banner);
  el.innerHTML = img
    ? `<img alt="" src="${urlFor(img)}"><button type="button" class="banner-clear" data-banner-clear title="Quitar foto de portada">×</button>`
    : `<span>Foto de portada de ${escapeHtml(board.name)} (opcional): arrastra aquí una imagen</span>`;
  el.classList.toggle('has-img', !!img);
}

function renderZoneBar() {
  $('#zoneBar').innerHTML = board.zones.map((z) => {
    const n = z.areas.reduce((k, a) => k + a.spaces.length, 0);
    return `<button type="button" class="zone-btn${z.id === board.activeZoneId ? ' active' : ''}${z.hidden ? ' is-hidden' : ''}" data-zone="${z.id}" data-drop-zone="${z.id}">
      ${escapeHtml(z.name)}<small>${z.hidden ? 'Oculta en el manual' : `${plural(z.areas.length, 'área', 'áreas')} · ${plural(n, 'espacio', 'espacios')}`}</small></button>`;
  }).join('') + '<button type="button" class="zone-add" data-zone-action="add">+ Zona</button>';
}

function renderZonePanel() {
  const panel = $('#zonePanel');
  const zone = activeZone();
  if (!zone) {
    panel.innerHTML = '<div class="empty-panel">Este formato no tiene zonas. Usa <strong>+ Zona</strong> para crear una.</div>';
    return;
  }
  const zi = board.zones.indexOf(zone);
  const area = activeArea();
  panel.innerHTML = `
    <div class="panel-head">
      <div>
        <h2 class="zone-title" contenteditable="true" spellcheck="false" data-zone-title>${escapeHtml(zone.name)}</h2>
        <p class="muted">Selecciona un área para acomodar su señalización.</p>
      </div>
      <div class="tools">
        <button type="button" class="eye-btn${zone.hidden ? ' off' : ''}" data-zone-action="toggle" title="${zone.hidden ? 'Mostrar esta zona en el manual' : 'Ocultar esta zona en el manual'}">${zone.hidden ? 'Oculta' : 'Visible'}</button>
        <button type="button" class="icon-btn" data-zone-action="left" title="Mover zona a la izquierda" ${zi === 0 ? 'disabled' : ''}>←</button>
        <button type="button" class="icon-btn" data-zone-action="right" title="Mover zona a la derecha" ${zi === board.zones.length - 1 ? 'disabled' : ''}>→</button>
        <button type="button" class="icon-btn danger" data-zone-action="delete" title="Eliminar zona">🗑</button>
      </div>
    </div>
    <div class="area-grid">
      ${zone.areas.map((a) => {
        const filled = a.spaces.filter((s) => s.imageId).length;
        return `<button type="button" class="area-btn${area && a.id === area.id ? ' active' : ''}${a.hidden ? ' is-hidden' : ''}" data-area="${a.id}" data-drop-area="${a.id}">
          <span>${escapeHtml(a.name)}</span><small>${a.hidden ? 'oculta' : `${filled}/${a.spaces.length}`}</small></button>`;
      }).join('')}
      <button type="button" class="area-add" data-area-action="add">+ Área</button>
    </div>
    ${area ? areaDetailHtml(zone, area) : `<p class="pick-hint">${zone.areas.length ? 'Elige un área para ver y acomodar sus espacios.' : 'Esta zona aún no tiene áreas. Usa <strong>+ Área</strong>.'}</p>`}`;

  if (area) {
    const dz = panel.querySelector('.dropzone');
    for (const sp of area.spaces) dz.insertBefore(spaceEl(sp), dz.lastElementChild);
  }
}

function areaDetailHtml(zone, area) {
  const ai = zone.areas.indexOf(area);
  return `
    <hr class="divider">
    <div class="area-head">
      <h3 class="area-title" contenteditable="true" spellcheck="false" data-area-title>${escapeHtml(area.name)}</h3>
      <div class="tools">
        <label class="move-zone">Zona
          <select data-area-zone>${board.zones.map((z) => `<option value="${z.id}" ${z.id === zone.id ? 'selected' : ''}>${escapeHtml(z.name)}</option>`).join('')}</select>
        </label>
        <button type="button" class="eye-btn${area.hidden ? ' off' : ''}" data-area-action="toggle" title="${area.hidden ? 'Mostrar esta área en el manual' : 'Ocultar esta área en el manual'}">${area.hidden ? 'Oculta' : 'Visible'}</button>
        <button type="button" class="icon-btn" data-area-action="left" title="Mover área antes" ${ai === 0 ? 'disabled' : ''}>←</button>
        <button type="button" class="icon-btn" data-area-action="right" title="Mover área después" ${ai === zone.areas.length - 1 ? 'disabled' : ''}>→</button>
        <button type="button" class="icon-btn danger" data-area-action="delete" title="Eliminar área">🗑</button>
      </div>
    </div>
    <p class="area-note" contenteditable="true" spellcheck="false" data-area-note data-placeholder="${escapeHtml(defaultNote(area.name))}">${escapeHtml(area.note || '')}</p>
    <div class="dropzone" data-area-id="${area.id}">
      <button type="button" class="space-add" data-space-action="add">+ Espacio<small>o suelta aquí una foto para crear uno</small></button>
    </div>`;
}

function spaceEl(sp) {
  const img = sp.imageId && images.get(sp.imageId);
  const el = document.createElement('article');
  el.className = 'card space' + (sp.hidden ? ' is-hidden' : '');
  el.dataset.cardId = sp.id;
  el.innerHTML = `
    <div class="space-head">
      <div class="space-title" contenteditable="true" spellcheck="false" data-space-title>${escapeHtml(sp.title)}</div>
      <button type="button" class="icon-btn eye${sp.hidden ? ' off' : ''}" data-space-action="toggle" title="${sp.hidden ? 'Mostrar este espacio en el manual' : 'Ocultar este espacio en el manual'}">${sp.hidden ? '🚫' : '👁'}</button>
      <button type="button" class="icon-btn danger" data-space-action="delete" title="Eliminar espacio">🗑</button>
    </div>
    <div class="slot${img ? ' filled' : ''}" data-slot="${sp.id}">
      ${img ? `<img alt="" loading="lazy" draggable="false" src="${urlFor(img)}">
        <button type="button" class="slot-clear" data-space-action="clear" title="Quitar foto">×</button>`
        : sp.imageId ? `<span class="missing">Falta la foto en la biblioteca:<br>${escapeHtml(sp.imageId)}</span>`
          : `<span class="slot-hint">Coloca aquí la imagen de ${escapeHtml(sp.title)}</span>`}
    </div>`;
  return el;
}

function renderStats(counts) {
  const spaces = allSpaces();
  const filled = spaces.filter((s) => s.imageId).length;
  const placed = [...images.keys()].filter((id) => counts.get(id)).length;
  $('#stats').textContent = `${board.name}: ${filled} de ${plural(spaces.length, 'espacio', 'espacios')} con foto · Biblioteca: ${plural(images.size, 'imagen', 'imágenes')}, ${placed} usadas en ${board.name}`;
}

function render() {
  const counts = placementCounts();
  renderFormatTabs();
  renderBanner();
  renderZoneBar();
  renderZonePanel();
  renderLibrary(counts);
  renderStats(counts);
}

/* ---------- Operaciones ---------- */
function assignImage(spaceId, imageId) {
  const f = findSpace(spaceId);
  if (!f || !images.has(imageId)) return;
  f.space.imageId = imageId;
  commit();
}

function clearImage(spaceId) {
  const f = findSpace(spaceId);
  if (!f || !f.space.imageId) return;
  f.space.imageId = null;
  commit();
}

function addSpace(areaId, { title, imageId = null }, index = null) {
  const f = findArea(areaId);
  if (!f) return null;
  const sp = newSpace(title || 'Nuevo espacio', imageId);
  const i = index == null ? f.area.spaces.length : Math.max(0, Math.min(index, f.area.spaces.length));
  f.area.spaces.splice(i, 0, sp);
  commit();
  return sp;
}

function moveSpace(spaceId, areaId, index = null) {
  const from = findSpace(spaceId);
  const to = findArea(areaId);
  if (!from || !to) return;
  from.area.spaces.splice(from.index, 1);
  const i = index == null ? to.area.spaces.length : Math.max(0, Math.min(index, to.area.spaces.length));
  to.area.spaces.splice(i, 0, from.space);
  commit();
}

function selectArea(areaId) {
  const f = findArea(areaId);
  if (!f) return;
  board.activeZoneId = f.zone.id;
  board.activeAreaId = areaId;
  saveBoard({ dirty: false });
  render();
}

function focusEditable(selector) {
  const el = $(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus();
  document.getSelection().selectAllChildren(el);
}

/* ---------- Arrastrar y soltar (pointer events: mouse y táctil) ---------- */
let drag = null;

function onPointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  if (e.target.closest('button, input, select, label, [contenteditable="true"]')) return;
  const src = e.target.closest('.lib-item, .card');
  if (!src) return;

  drag = {
    src,
    kind: src.classList.contains('card') ? 'card' : 'lib',
    id: src.dataset.cardId || src.dataset.imageId,
    x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
    touch: e.pointerType !== 'mouse',
    active: false, timer: null, target: null, hoverEl: null, placeholder: null, ghost: null, raf: 0,
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

  let img, label;
  if (drag.kind === 'card') {
    const f = findSpace(drag.id);
    img = f && f.space.imageId && images.get(f.space.imageId);
    label = f ? f.space.title : '';
  } else {
    img = images.get(drag.id);
    label = img ? titleFromName(img.name) : '';
  }
  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.innerHTML = `${img ? `<img alt="" src="${urlFor(img)}">` : ''}<span>${escapeHtml(label)}</span>`;
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
  // Una foto de la biblioteca sobre cualquier parte de un espacio se asigna a ese espacio.
  const overCard = drag.kind === 'lib' && el && el.closest('.dropzone .card');
  const slot = overCard && overCard.querySelector('.slot');
  const banner = drag.kind === 'lib' && el && el.closest('#bannerBox');
  const zone = el && el.closest('.dropzone');
  const areaBtn = el && el.closest('[data-drop-area]');
  const lib = el && el.closest('#library');

  if (slot) {
    drag.placeholder.remove();
    setHover(slot);
    drag.target = { assign: slot.dataset.slot };
    return;
  }
  if (banner) {
    drag.placeholder.remove();
    setHover(banner);
    drag.target = { banner: true };
    return;
  }
  if (zone && drag.kind === 'lib') {
    // Foto suelta entre espacios: crea un espacio nuevo al final del área.
    setHover(zone);
    const anchor = zone.querySelector('.space-add');
    if (drag.placeholder.nextSibling !== anchor) zone.insertBefore(drag.placeholder, anchor);
    drag.target = { areaId: zone.dataset.areaId, append: true };
    return;
  }
  if (zone) {
    setHover(zone);
    const cards = [...zone.querySelectorAll('.card:not(.drag-source)')];
    let before = null;
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (drag.y < r.top || (drag.y <= r.bottom && drag.x < r.left + r.width / 2)) { before = c; break; }
    }
    const anchor = before || zone.querySelector('.space-add');
    if (drag.placeholder.nextSibling !== anchor) zone.insertBefore(drag.placeholder, anchor);
    drag.target = { areaId: zone.dataset.areaId, zone };
    return;
  }

  drag.placeholder.remove();
  if (areaBtn) {
    setHover(areaBtn);
    drag.target = { areaId: areaBtn.dataset.dropArea, append: true };
  } else if (lib && drag.kind === 'card') {
    setHover(lib, 'drop-remove');
    drag.target = { clearImage: true };
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
  const list = $('#libraryList');
  const lr = list.getBoundingClientRect();
  if (drag.x >= lr.left && drag.x <= lr.right) {
    if (drag.y > lr.top && drag.y < lr.top + 40) list.scrollTop -= 10;
    else if (drag.y < lr.bottom && drag.y > lr.bottom - 40) list.scrollTop += 10;
  }
  updateTarget();
  drag.raf = requestAnimationFrame(autoScroll);
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
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', cancelDrag);
  drag = null;
}

function cancelDrag() { cleanupDrag(); }

function onPointerUp(e) {
  if (!drag) return;
  const d = drag;
  if (!d.active) {
    cleanupDrag();
    if (e.target.closest('.lib-item, .card') !== d.src) return;
    if (d.kind === 'lib') openViewer('lib', d.id);
    else if (findSpace(d.id)?.space.imageId) openViewer('card', d.id);
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

  if (t.assign) { assignImage(t.assign, d.id); return; }
  if (t.banner) { board.banner = d.id; commit(); toast('Foto de portada asignada.'); return; }
  if (t.clearImage) { clearImage(d.id); toast('Foto quitada del espacio.'); return; }
  if (d.kind === 'lib') {
    const img = images.get(d.id);
    addSpace(t.areaId, { title: titleFromName(img.name), imageId: d.id }, t.append ? null : index);
    if (t.append) toast(`Espacio agregado en ${findArea(t.areaId).area.name}.`);
  } else {
    moveSpace(d.id, t.areaId, t.append ? null : index);
  }
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
    await addFiles(await filesFromDataTransfer(e.dataTransfer));
  });
}

/* ---------- Visor (clic en una foto) ---------- */
const viewer = { kind: null, id: null };

function areaOptions(selectedId) {
  return board.zones.map((z) => `<optgroup label="${escapeHtml(z.name)}">${z.areas.map((a) =>
    `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}</optgroup>`).join('');
}

function openViewer(kind, id) {
  let img, title, path, areaId;
  if (kind === 'card') {
    const f = findSpace(id);
    if (!f) return;
    img = images.get(f.space.imageId);
    title = f.space.title;
    path = f.space.imageId;
    areaId = f.area.id;
  } else {
    img = images.get(id);
    if (!img) return;
    title = titleFromName(img.name);
    path = img.path;
    const match = allAreas().find(({ area }) => norm(area.name) === norm(AREA_ALIASES[norm(img.folder)] || img.folder));
    areaId = (match && match.area.id) || board.activeAreaId;
  }
  viewer.kind = kind; viewer.id = id;
  $('#viewerImg').src = img ? urlFor(img) : '';
  $('#viewerImg').alt = title;
  $('#viewerTitle').textContent = title;
  $('#viewerPath').textContent = path || '';
  $('#viewerSection').innerHTML = areaOptions(areaId);
  $('#viewerPrimary').textContent = kind === 'card' ? 'Mover a esta área' : 'Agregar como espacio en esta área';
  $('#viewerRemove').hidden = kind !== 'card';
  $('#viewer').showModal();
}

function setupViewer() {
  const dlg = $('#viewer');
  $('#viewerPrimary').addEventListener('click', () => {
    const areaId = $('#viewerSection').value;
    if (!areaId) return;
    if (viewer.kind === 'lib') {
      const img = images.get(viewer.id);
      addSpace(areaId, { title: titleFromName(img.name), imageId: viewer.id });
      toast('Espacio agregado.');
    } else {
      moveSpace(viewer.id, areaId);
      toast('Espacio movido.');
    }
    dlg.close();
  });
  $('#viewerRemove').addEventListener('click', () => { clearImage(viewer.id); dlg.close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Exportar / respaldar ---------- */
function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

async function exportCatalog() {
  if (!allSpaces().length) { toast('Este formato no tiene espacios.'); return; }
  toast('Generando catálogo…', 10000);
  const cache = new Map();
  const dataUrl = async (id) => {
    const img = id && images.get(id);
    if (!img) return null;
    if (!cache.has(id)) cache.set(id, await blobToDataURL(img.blob));
    return cache.get(id);
  };
  let body = '';
  for (const z of board.zones) {
    if (!z.areas.length) continue;
    body += `<h2>${escapeHtml(z.name)}</h2>`;
    for (const a of z.areas) {
      body += `<section><h3>${escapeHtml(a.name)}</h3><p class="note">${escapeHtml(a.note || defaultNote(a.name))}</p><div class="g">`;
      for (const s of a.spaces) {
        const src = await dataUrl(s.imageId);
        body += `<figure><figcaption>${escapeHtml(s.title)}</figcaption><div class="f">${src ? `<img alt="" src="${src}">` : '<span>Imagen pendiente</span>'}</div></figure>`;
      }
      body += '</div></section>';
    }
  }
  const date = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(state.intro.title)} · ${escapeHtml(board.name)}</title>
<style>
body{margin:0;background:#f5f6f8;color:#1b2330;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
header{background:#1f4fd6;color:#fff;border-bottom:4px solid #ffc220;padding:18px;text-align:center}
header h1{margin:0;font-size:22px}header p{margin:4px 0 0;font-size:12px;opacity:.9}
main{max-width:1300px;margin:0 auto;padding:18px}
h2{color:#1e3a9a;margin:26px 0 10px}section{background:#fff;border:1px solid #dde2ea;border-radius:12px;padding:14px 16px;margin-bottom:14px}
h3{margin:0 0 8px;color:#1e3a9a}.note{margin:0 0 12px;padding:10px 14px;background:#eef3ff;border-radius:8px;color:#1e3a9a;font-weight:600}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
figure{margin:0;border:1px solid #dde2ea;border-radius:10px;padding:10px}figcaption{font-weight:600;margin-bottom:8px}
.f{border:2px dashed #cfd6e2;border-radius:8px;aspect-ratio:1;display:grid;place-items:center;overflow:hidden;color:#7a8596;text-align:center}
.f img{max-width:100%;max-height:100%;object-fit:contain}
</style></head><body><header><h1>${escapeHtml(state.intro.title)} · ${escapeHtml(board.name)}</h1><p>Generado el ${escapeHtml(date)}</p></header><main>${body}</main></body></html>`;
  download(`Señalización ${SP.safeName(board.name)}.html`, new Blob([html], { type: 'text/html' }));
  toast('Catálogo exportado.', 4000);
}

function formatToJson(f) {
  return {
    name: f.name, subtitle: f.subtitle, color: f.color, banner: f.banner, logo: f.logo || null, hidden: !!f.hidden, panel: f.panel,
    zones: f.zones.map((z) => ({
      name: z.name, hidden: !!z.hidden,
      areas: z.areas.map((a) => ({ name: a.name, note: a.note, hidden: !!a.hidden, spaces: a.spaces.map((s) => ({ title: s.title, image: s.imageId, hidden: !!s.hidden })) })),
    })),
  };
}

function formatFromJson(f) {
  if (!Array.isArray(f.zones)) {
    return newFormat({ name: String(f.name || 'Formato'), subtitle: String(f.subtitle || ''), color: String(f.color || '#1f4fd6'), zones: migrateSections(f.sections, (c) => c.path || c.imageId || null) });
  }
  return newFormat({
    name: String(f.name || 'Formato'),
    subtitle: String(f.subtitle || ''),
    color: String(f.color || '#1f4fd6'),
    banner: f.banner ? String(f.banner) : null,
    logo: f.logo ? String(f.logo) : null,
    hidden: !!f.hidden,
    panel: f.panel,
    zones: f.zones.map((z) => {
      const zone = newZone(String(z.name || 'Zona'), (z.areas || []).map((a) => {
        const area = newArea(String(a.name || 'Área'), (a.spaces || []).map((s) => {
          const sp = newSpace(String(s.title || 'Espacio'), s.image ? String(s.image) : null);
          sp.hidden = !!s.hidden;
          return sp;
        }));
        area.note = String(a.note || '');
        area.hidden = !!a.hidden;
        return area;
      }));
      zone.hidden = !!z.hidden;
      return zone;
    }),
  });
}

function saveJson() {
  const data = { app: 'tablero-senalizacion', version: 4, savedAt: new Date().toISOString(), intro: state.intro, formats: state.formats.map(formatToJson) };
  const stamp = new Date().toISOString().slice(0, 10);
  download(`tablero-senalizacion-${stamp}.json`, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  toast('Respaldo guardado. Las fotos no van en el archivo: vuelve a cargar la carpeta para verlas.', 4500);
}

async function openJson(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('El archivo no es un JSON válido.'); return; }
  if (!data || (!Array.isArray(data.formats) && !Array.isArray(data.sections))) { toast('El archivo no parece un respaldo del tablero.'); return; }
  if (!confirm('Esto reemplaza todos los formatos por los del archivo. ¿Continuar?')) return;
  const formats = Array.isArray(data.formats) ? data.formats : [{ ...DEFAULT_FORMATS[0], sections: data.sections }];
  state.intro = { ...structuredClone(DEFAULT_INTRO), ...(data.intro || {}) };
  state.formats = formats.map((f) => formatFromJson(f));
  if (!state.formats.length) state.formats = defaultState().formats;
  setActiveFormat(state.formats[0].id);
  commit();
  const missing = state.formats.flatMap((f) => allSpaces(f)).filter((s) => s.imageId && !images.has(s.imageId)).length;
  toast(missing ? `Respaldo abierto. Faltan ${plural(missing, 'foto', 'fotos')} en la biblioteca: carga la carpeta para verlas.` : 'Respaldo abierto.', 4500);
}

/* ---------- Publicación en SharePoint ---------- */
let spReady = false;
let publishing = false;

function renderAccount() {
  const btn = $('#authBtn');
  const acc = spReady ? SP.currentAccount() : null;
  btn.textContent = acc ? (acc.name || acc.username) : 'Sin conexión';
  btn.title = acc ? `Conectado a SharePoint como ${acc.name || acc.username}. Clic para ver la carpeta.` : 'No hay conexión con SharePoint';
  btn.classList.toggle('signed', !!acc);
}

function ensureConnected() {
  if (spReady) return true;
  toast('No hay conexión con SharePoint. Abre este archivo desde su carpeta en SharePoint.', 6000);
  return false;
}

async function optimizeImage(blob) {
  let bmp;
  try { bmp = await createImageBitmap(blob); } catch { bmp = null; }
  if (!bmp) return { blob, ext: (blob.type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('svg+xml', 'svg') };
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

// Logos: PNG (con transparencia) salvo que el original sea JPG o SVG.
const logoExt = (img) => (img.published ? img.ext || 'png' : /svg/.test(img.blob.type || '') ? 'svg' : /jpe?g/.test(img.blob.type || '') ? 'jpg' : 'png');

async function optimizeLogo(blob) {
  if (/jpe?g/.test(blob.type || '')) return optimizeImage(blob);
  if (/svg/.test(blob.type || '')) return { blob, ext: 'svg' };
  let bmp;
  try { bmp = await createImageBitmap(blob); } catch { return { blob, ext: 'png' }; }
  const k = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
  if (k === 1 && blob.type === 'image/png') { bmp.close?.(); return { blob, ext: 'png' }; }
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  const png = await new Promise((res) => c.toBlob(res, 'image/png'));
  return { blob: png || blob, ext: 'png' };
}

const expectedExt = (img) => (img.published ? img.ext || 'jpg' : /svg/.test(img.blob.type || '') ? 'svg' : 'jpg');

function setPublishProgress(text) {
  const el = $('#publishState');
  el.className = 'publish-state busy';
  el.textContent = text;
}

function renderPublishState() {
  if (publishing) return;
  const el = $('#publishState');
  if (!el || !state) return;
  if (state.dirty) {
    el.className = 'publish-state dirty';
    el.textContent = 'Cambios sin publicar';
  } else if (state.publishedAt) {
    el.className = 'publish-state';
    el.textContent = 'Publicado ' + new Date(state.publishedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } else {
    el.className = 'publish-state';
    el.textContent = '';
  }
}

// Carpetas en SharePoint: <Formato>/<Zona>/<Área>/<Espacio>.jpg y <Formato>/Portada.jpg
async function buildPlan() {
  const files = new Map(); // ruta -> img
  const uniq = (set, name) => { let n = name, k = 2; while (set.has(n.toLowerCase())) n = `${name} (${k++})`; set.add(n.toLowerCase()); return n; };
  const ref = async (img, file) => {
    if (!img.hash) img.hash = await sha1(img.blob);
    files.set(file, img);
    return { path: img.id, hash: img.hash, file };
  };
  // Foto de portada de la página de inicio: <carpeta>/Portada inicio.jpg
  const homeImg = state.intro.banner && images.get(state.intro.banner);
  const intro = { ...state.intro, banner: homeImg ? await ref(homeImg, `Portada inicio.${expectedExt(homeImg)}`) : null };
  const logoFiles = new Set(); // los logos se publican en PNG para conservar la transparencia
  const fmtNames = new Set();
  const formats = [];
  for (const f of state.formats) {
    const fname = uniq(fmtNames, SP.safeName(f.name) || 'Formato');
    const bannerImg = f.banner && images.get(f.banner);
    const banner = bannerImg ? await ref(bannerImg, `${fname}/Portada.${expectedExt(bannerImg)}`) : null;
    const logoImg = f.logo && images.get(f.logo);
    let logo = null;
    if (logoImg) {
      logo = await ref(logoImg, `${fname}/Logo.${logoExt(logoImg)}`);
      logoFiles.add(logo.file);
    }
    const zoneNames = new Set(['portada.jpg', 'portada.png', 'portada.svg', 'logo.jpg', 'logo.png', 'logo.svg']);
    const zones = [];
    for (const z of f.zones) {
      const zname = uniq(zoneNames, SP.safeName(z.name) || 'Zona');
      const areaNames = new Set();
      const areas = [];
      for (const a of z.areas) {
        const aname = uniq(areaNames, SP.safeName(a.name) || 'Área');
        const folder = `${fname}/${zname}/${aname}`;
        const used = new Set();
        const spaces = [];
        for (const s of a.spaces) {
          const img = s.imageId && images.get(s.imageId);
          let image = null;
          if (img) {
            const ext = expectedExt(img);
            const base = SP.safeName(s.title) || 'Señalización';
            let name = `${base}.${ext}`;
            for (let k = 2; used.has(name.toLowerCase()); k++) name = `${base} (${k}).${ext}`;
            used.add(name.toLowerCase());
            image = await ref(img, `${folder}/${name}`);
          }
          spaces.push({ title: s.title, hidden: !!s.hidden, image });
        }
        areas.push({ name: a.name, note: a.note || '', hidden: !!a.hidden, spaces });
      }
      zones.push({ name: z.name, hidden: !!z.hidden, areas });
    }
    formats.push({ name: f.name, subtitle: f.subtitle, color: f.color, hidden: !!f.hidden, panel: f.panel, banner, logo, zones });
  }
  return { files, formats, intro, logoFiles };
}

// Todas las imágenes referenciadas por un tablero.json publicado (versión 3 o 4).
function publishedRefs(data) {
  const refs = [];
  if (data && data.intro && data.intro.banner && data.intro.banner.file) refs.push(data.intro.banner);
  for (const f of (data && data.formats) || []) {
    if (f.banner && f.banner.file) refs.push(f.banner);
    if (f.logo && f.logo.file) refs.push(f.logo);
    for (const z of f.zones || []) for (const a of z.areas || []) for (const s of a.spaces || []) if (s.image && s.image.file) refs.push(s.image);
    for (const s of f.sections || []) for (const c of s.cards || []) if (c.file) refs.push({ path: c.path, hash: c.hash, file: c.file });
  }
  return refs;
}

const parentDirs = (file) => {
  const parts = file.split('/');
  const out = [];
  for (let i = parts.length - 1; i > 0; i--) out.push(parts.slice(0, i).join('/'));
  return out;
};

async function publish() {
  if (publishing || !ensureConnected()) return;
  const missing = state.formats.flatMap((f) => allSpaces(f)).filter((s) => s.imageId && !images.has(s.imageId)).length;
  if (missing && !confirm(`${plural(missing, 'espacio tiene', 'espacios tienen')} una foto que no está en la biblioteca y se publicará sin foto. ¿Continuar?`)) return;
  if (!confirm(`Se publicarán los ${state.formats.length} formatos en esta carpeta de SharePoint. Todos los que abran el manual verán estos cambios. ¿Publicar?`)) return;

  publishing = true;
  const btn = $('#publishBtn');
  btn.disabled = true;
  try {
    setPublishProgress('Conectando con SharePoint…');
    await SP.resolveRoot();
    const prev = await SP.readJson();
    const prevFiles = new Map(publishedRefs(prev).map((r) => [r.file, r.hash]));

    setPublishProgress('Preparando…');
    const plan = await buildPlan();
    const uploads = [...plan.files].filter(([file, img]) => prevFiles.get(file) !== img.hash);

    let done = 0;
    const queue = uploads.slice();
    const worker = async () => {
      while (queue.length) {
        const [file, img] = queue.shift();
        const { blob } = img.published ? { blob: img.blob } : plan.logoFiles.has(file) ? await optimizeLogo(img.blob) : await optimizeImage(img.blob);
        await SP.upload(file, blob);
        setPublishProgress(`Subiendo fotos ${++done} de ${uploads.length}…`);
      }
    };
    await Promise.all([worker(), worker(), worker()]);

    // Mandar a la papelera las fotos que ya no se usan (solo las que publicó esta app).
    const stale = [...prevFiles.keys()].filter((f) => !plan.files.has(f));
    let k = 0;
    for (const file of stale) {
      setPublishProgress(`Retirando fotos ${++k} de ${stale.length}…`);
      await SP.remove(file);
    }

    const updatedAt = new Date().toISOString();
    const acc = SP.currentAccount();
    const data = { app: 'tablero-senalizacion', version: 4, updatedAt, updatedBy: acc ? acc.name || acc.username : null, intro: plan.intro, formats: plan.formats };
    setPublishProgress('Guardando tablero.json…');
    await SP.upload(SP.DATA_FILE, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));

    // Quitar carpetas que quedaron vacías (de la más profunda a la más alta).
    const keepDirs = new Set([...plan.files.keys()].flatMap(parentDirs));
    const staleDirs = [...new Set(stale.flatMap(parentDirs))].filter((d) => !keepDirs.has(d)).sort((a, b) => b.split('/').length - a.split('/').length);
    for (const dir of staleDirs) {
      const children = await SP.list(dir);
      if (!children.size) await SP.remove(dir);
    }

    state.dirty = false;
    state.publishedAt = updatedAt;
    publishing = false;
    saveBoard({ dirty: false });
    toast(`Publicado: ${plural(uploads.length, 'foto subida', 'fotos subidas')}${stale.length ? `, ${plural(stale.length, 'foto retirada', 'fotos retiradas')}` : ''}.`, 6000);
  } catch (e) {
    console.error(e);
    publishing = false;
    toast('No se publicó. ' + SP.errorText(e), 8000);
  } finally {
    publishing = false;
    btn.disabled = false;
    renderPublishState();
  }
}

/* ---------- Cargar lo publicado ---------- */
async function fetchPublished() {
  const data = await SP.readJson();
  return data && Array.isArray(data.formats) ? data : null;
}

async function loadPublished(data) {
  const refs = publishedRefs(data).filter((r) => r.path && r.file);
  const need = [...new Map(refs.filter((r) => images.get(r.path)?.hash !== r.hash).map((r) => [r.path, r])).values()];
  const fetched = [];
  let done = 0;
  for (const r of need) {
    toast(`Descargando fotos publicadas… ${++done}/${need.length}`, 60000);
    try {
      const res = await fetch(`${SP.fileUrl(r.file)}?v=${encodeURIComponent(r.hash || '')}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const cut = r.path.lastIndexOf('/');
      const prevImg = images.get(r.path);
      if (prevImg?.url) URL.revokeObjectURL(prevImg.url);
      const rec = {
        id: r.path, path: r.path,
        folder: cut === -1 ? '' : r.path.slice(0, cut),
        name: cut === -1 ? r.path : r.path.slice(cut + 1),
        blob, hash: r.hash, published: true, ext: r.file.split('.').pop(),
      };
      images.set(r.path, { ...rec, url: null });
      fetched.push(rec);
    } catch (e) {
      console.warn('No se pudo descargar', r.file, e);
    }
  }
  if (fetched.length) await idb('images', 'readwrite', (s) => { fetched.forEach((x) => s.put(x)); }).catch(console.error);

  const prevActive = board && board.name;
  const toLocal = (f) => {
    if (Array.isArray(f.zones)) {
      return formatFromJson({
        ...f,
        banner: f.banner ? f.banner.path : null,
        logo: f.logo ? f.logo.path : null,
        zones: f.zones.map((z) => ({ ...z, areas: (z.areas || []).map((a) => ({ ...a, spaces: (a.spaces || []).map((s) => ({ title: s.title, hidden: !!s.hidden, image: s.image ? s.image.path : null })) })) })),
      });
    }
    return formatFromJson(f);
  };
  const intro = { ...structuredClone(DEFAULT_INTRO), ...(data.intro || {}) };
  intro.banner = data.intro && data.intro.banner && data.intro.banner.path ? data.intro.banner.path : null;
  state = { dirty: false, publishedAt: data.updatedAt || null, intro, formats: data.formats.map(toLocal) };
  if (!state.formats.length) state.formats = defaultState().formats;
  setActiveFormat((state.formats.find((f) => f.name === prevActive) || state.formats[0]).id);
  saveBoard({ dirty: false });
  render();
  toast('Se cargó la versión publicada.');
}

async function loadPublishedAction() {
  if (!ensureConnected()) return;
  if (state.dirty && !confirm('Tienes cambios sin publicar. Se descartarán y se cargará la versión publicada. ¿Continuar?')) return;
  try {
    const data = await fetchPublished();
    if (!data) { toast('Todavía no hay nada publicado.'); return; }
    await loadPublished(data);
  } catch (e) {
    console.error(e);
    toast('No se pudo leer la versión publicada. ' + SP.errorText(e), 7000);
  }
}

async function syncWithPublished() {
  let published = null;
  try { published = await fetchPublished(); } catch (e) { console.warn(e); toast(SP.errorText(e), 7000); return; }
  if (!published) return;
  if (!state.dirty && published.updatedAt !== state.publishedAt) { await loadPublished(published); return; }
  if (state.dirty && state.publishedAt && published.updatedAt > state.publishedAt) {
    toast('Hay una versión publicada más reciente que tus cambios locales. Usa Más → Cargar lo publicado si quieres verla.', 7000);
  }
}

/* ---------- Carpeta de SharePoint ---------- */
function openConnection() {
  const acc = spReady ? SP.currentAccount() : null;
  $('#connFolder').textContent = (spReady && SP.folderPath()) || decodeURIComponent(location.pathname.slice(0, location.pathname.lastIndexOf('/')));
  $('#connAccount').textContent = acc ? `${acc.name || ''}${acc.username ? ` (${acc.username})` : ''}` : 'Sin conexión';
  $('#connResult').className = 'cfg-result';
  $('#connResult').textContent = '';
  $('#connSignOut').hidden = true;
  $('#connection').showModal();
}

function setupConnection() {
  const dlg = $('#connection');
  const res = $('#connResult');
  $('#connTest').addEventListener('click', async () => {
    if (!ensureConnected()) return;
    res.className = 'cfg-result'; res.textContent = 'Probando…';
    try {
      const r = await SP.resolveRoot();
      res.className = 'cfg-result ok';
      res.textContent = `Conexión correcta con la carpeta "${r.name}".`;
    } catch (e) {
      console.error(e);
      res.className = 'cfg-result err';
      res.textContent = SP.errorText(e);
    }
  });
  $('#authBtn').addEventListener('click', openConnection);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Formatos y textos de portada ---------- */
let editingFormatId = null;

// Las imágenes con "logo" en el nombre aparecen primero.
function logoOptions(selected) {
  const list = [...images.values()].sort((a, b) => {
    const pa = /logo/i.test(a.path) ? 0 : 1, pb = /logo/i.test(b.path) ? 0 : 1;
    return pa - pb || collator.compare(a.path, b.path);
  });
  return '<option value="">(Sin logo)</option>' +
    list.map((i) => `<option value="${escapeHtml(i.id)}" ${i.id === selected ? 'selected' : ''}>${escapeHtml(i.path)}</option>`).join('');
}

function bannerOptions(selected) {
  const list = [...images.values()].sort((a, b) => {
    const pa = /portada|fachada|banner|tienda/i.test(a.path) ? 0 : 1, pb = /portada|fachada|banner|tienda/i.test(b.path) ? 0 : 1;
    return pa - pb || collator.compare(a.path, b.path);
  });
  return '<option value="">(Sin foto de portada)</option>' +
    list.map((i) => `<option value="${escapeHtml(i.id)}" ${i.id === selected ? 'selected' : ''}>${escapeHtml(i.path)}</option>`).join('');
}

/* ---------- Editor del panel de un formato ----------
   Se edita una copia (draft) y solo se aplica al presionar Guardar. */
let draft = null;

const BUTTON_TYPES = { back: 'Regresar a la portada', checklist: 'Descargar checklist', link: 'Enlace' };

function renderFormatPreview() {
  const prev = $('#fmtPreview');
  prev.style.setProperty('--fc', $('#fmtColor').value);
  const logo = images.get($('#fmtLogo').value);
  prev.innerHTML = `${logo ? `<span class="fp-logo"><img alt="" src="${urlFor(logo)}"></span>` : ''}<strong>${escapeHtml($('#fmtName').value.trim() || 'Formato')}</strong><small>${escapeHtml($('#fmtSubtitle').value.trim())}</small>`;
  const img = images.get($('#fmtBanner').value);
  $('#fmtBannerPreview').innerHTML = img ? `<img alt="" src="${urlFor(img)}">` : '';
}

function renderPanelButtons() {
  const list = draft.panel.buttons;
  $('#peButtons').innerHTML = list.length ? list.map((b, i) => `
    <div class="pe-row${b.visible ? '' : ' off'}" data-btn="${b.id}">
      <label class="pe-check" title="Mostrar este botón"><input type="checkbox" data-btn-field="visible" ${b.visible ? 'checked' : ''}></label>
      <div class="pe-main">
        <input data-btn-field="label" value="${escapeHtml(b.label)}" placeholder="Texto del botón" maxlength="40" aria-label="Texto del botón">
        ${b.type === 'link'
          ? `<input data-btn-field="url" value="${escapeHtml(b.url)}" placeholder="https://… (enlace a un PDF, página o archivo de SharePoint)" aria-label="Enlace">`
          : `<span class="pe-kind">${BUTTON_TYPES[b.type]}</span>`}
      </div>
      <button type="button" class="icon-btn" data-btn-move="-1" ${i === 0 ? 'disabled' : ''} title="Subir">↑</button>
      <button type="button" class="icon-btn" data-btn-move="1" ${i === list.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
      <button type="button" class="icon-btn danger" data-btn-remove title="Quitar botón">🗑</button>
    </div>`).join('') : '<p class="muted small">No hay botones. La barra no se mostrará.</p>';
  const missing = ['back', 'checklist'].filter((t) => !list.some((b) => b.type === t));
  $('#peRestoreButtons').innerHTML = missing.map((t) => `<button type="button" class="btn" data-btn-restore="${t}">+ ${t === 'back' ? 'Cambiar formato' : 'Descarga Checklist'}</button>`).join('');
}

function renderPanelZones() {
  const zones = draft.zones;
  $('#peZones').innerHTML = zones.map((z, zi) => `
    <div class="pe-zone${z.hidden ? ' off' : ''}" data-pe-zone="${z.id}">
      <div class="pe-row">
        <label class="pe-check" title="Mostrar esta zona"><input type="checkbox" data-zone-field="visible" ${z.hidden ? '' : 'checked'}></label>
        <div class="pe-main"><input data-zone-field="name" value="${escapeHtml(z.name)}" maxlength="60" aria-label="Nombre de la zona"></div>
        <span class="pe-count">${plural(z.areas.length, 'área', 'áreas')}</span>
        <button type="button" class="icon-btn" data-zone-move="-1" ${zi === 0 ? 'disabled' : ''} title="Mover antes">↑</button>
        <button type="button" class="icon-btn" data-zone-move="1" ${zi === zones.length - 1 ? 'disabled' : ''} title="Mover después">↓</button>
        <button type="button" class="icon-btn danger" data-zone-remove title="Eliminar zona">🗑</button>
      </div>
      <div class="pe-areas">
        ${z.areas.map((a, ai) => `
          <div class="pe-row pe-area${a.hidden ? ' off' : ''}" data-pe-area="${a.id}">
            <label class="pe-check" title="Mostrar esta área"><input type="checkbox" data-area-field="visible" ${a.hidden ? '' : 'checked'}></label>
            <div class="pe-main"><input data-area-field="name" value="${escapeHtml(a.name)}" maxlength="80" aria-label="Nombre del área"></div>
            <span class="pe-count">${plural(a.spaces.length, 'espacio', 'espacios')}</span>
            <button type="button" class="icon-btn" data-area-move="-1" ${ai === 0 ? 'disabled' : ''} title="Subir">↑</button>
            <button type="button" class="icon-btn" data-area-move="1" ${ai === z.areas.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
            <button type="button" class="icon-btn danger" data-area-remove title="Eliminar área">🗑</button>
          </div>`).join('')}
        <button type="button" class="pe-add" data-area-add>+ Agregar área a ${escapeHtml(z.name)}</button>
      </div>
    </div>`).join('') || '<p class="muted small">Este formato no tiene zonas.</p>';
}

function showPanelTab(name) {
  document.querySelectorAll('#formatDlg [data-pe-tab]').forEach((b) => b.classList.toggle('active', b.dataset.peTab === name));
  document.querySelectorAll('#formatDlg [data-pe-page]').forEach((pg) => { pg.hidden = pg.dataset.pePage !== name; });
}

function openFormatDialog(formatId, tab = 'datos') {
  const f = formatId ? state.formats.find((x) => x.id === formatId) : null;
  editingFormatId = f ? f.id : null;
  draft = f ? structuredClone(f) : newFormat({ name: '' });
  $('#formatDlgTitle').textContent = f ? `Personalizar panel de ${f.name}` : 'Nuevo formato';
  $('#fmtName').value = draft.name;
  $('#fmtSubtitle').value = draft.subtitle;
  $('#fmtColor').value = /^#[0-9a-f]{6}$/i.test(draft.color || '') ? draft.color : '#1f4fd6';
  $('#fmtBanner').innerHTML = bannerOptions(draft.banner);
  $('#fmtLogo').innerHTML = logoOptions(draft.logo);
  $('#fmtShowHome').checked = !draft.hidden;
  $('#peShowBanner').checked = draft.panel.showBanner;
  $('#peShowNotes').checked = draft.panel.showNotes;
  $('#peShowEmpty').checked = draft.panel.showEmpty;
  $('#fmtDelete').hidden = !f || state.formats.length < 2;
  renderFormatPreview();
  renderPanelButtons();
  renderPanelZones();
  showPanelTab(tab);
  $('#formatDlg').showModal();
  if (tab === 'datos') $('#fmtName').focus();
}

function setupPanelEditor() {
  const dlg = $('#formatDlg');
  dlg.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-pe-tab]');
    if (tab) { showPanelTab(tab.dataset.peTab); return; }
  });

  // Botones de la barra
  const btnBox = $('#peButtons');
  const btnOf = (el) => draft.panel.buttons.find((b) => b.id === el.closest('[data-btn]').dataset.btn);
  btnBox.addEventListener('input', (e) => {
    const field = e.target.dataset.btnField;
    if (!field) return;
    const b = btnOf(e.target);
    if (field === 'visible') { b.visible = e.target.checked; e.target.closest('.pe-row').classList.toggle('off', !b.visible); }
    else b[field] = e.target.value;
  });
  btnBox.addEventListener('click', (e) => {
    const list = draft.panel.buttons;
    const mv = e.target.closest('[data-btn-move]');
    const rm = e.target.closest('[data-btn-remove]');
    if (!mv && !rm) return;
    const b = btnOf(e.target);
    const i = list.indexOf(b);
    if (mv) { const j = i + Number(mv.dataset.btnMove); [list[i], list[j]] = [list[j], list[i]]; }
    else list.splice(i, 1);
    renderPanelButtons();
  });
  $('#peAddButton').addEventListener('click', () => {
    draft.panel.buttons.push(newButton('link', 'Nuevo botón', ''));
    renderPanelButtons();
    const inputs = btnBox.querySelectorAll('[data-btn-field="label"]');
    inputs[inputs.length - 1]?.select();
  });
  $('#peRestoreButtons').addEventListener('click', (e) => {
    const t = e.target.closest('[data-btn-restore]')?.dataset.btnRestore;
    if (!t) return;
    draft.panel.buttons.push(newButton(t, t === 'back' ? 'Cambiar formato' : 'Descarga Checklist'));
    renderPanelButtons();
  });

  // Secciones visibles
  $('#peShowBanner').addEventListener('change', (e) => { draft.panel.showBanner = e.target.checked; });
  $('#peShowNotes').addEventListener('change', (e) => { draft.panel.showNotes = e.target.checked; });
  $('#peShowEmpty').addEventListener('change', (e) => { draft.panel.showEmpty = e.target.checked; });

  // Zonas y áreas
  const zBox = $('#peZones');
  const zoneOf = (el) => draft.zones.find((z) => z.id === el.closest('[data-pe-zone]').dataset.peZone);
  const areaOf = (el) => zoneOf(el).areas.find((a) => a.id === el.closest('[data-pe-area]').dataset.peArea);
  zBox.addEventListener('input', (e) => {
    const zf = e.target.dataset.zoneField;
    const af = e.target.dataset.areaField;
    if (zf) {
      const z = zoneOf(e.target);
      if (zf === 'visible') { z.hidden = !e.target.checked; e.target.closest('.pe-zone').classList.toggle('off', z.hidden); }
      else z.name = e.target.value;
    } else if (af) {
      const a = areaOf(e.target);
      if (af === 'visible') { a.hidden = !e.target.checked; e.target.closest('.pe-row').classList.toggle('off', a.hidden); }
      else a.name = e.target.value;
    }
  });
  zBox.addEventListener('focusout', (e) => {
    // Nombres vacíos no se permiten.
    if (e.target.dataset.zoneField === 'name' && !e.target.value.trim()) { zoneOf(e.target).name = 'Zona'; e.target.value = 'Zona'; }
    if (e.target.dataset.areaField === 'name' && !e.target.value.trim()) { areaOf(e.target).name = 'Área'; e.target.value = 'Área'; }
  });
  zBox.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-zone-move]')) {
      const z = zoneOf(t); const i = draft.zones.indexOf(z); const j = i + Number(t.closest('[data-zone-move]').dataset.zoneMove);
      [draft.zones[i], draft.zones[j]] = [draft.zones[j], draft.zones[i]];
    } else if (t.closest('[data-zone-remove]')) {
      const z = zoneOf(t);
      const n = z.areas.reduce((k, a) => k + a.spaces.length, 0);
      if ((z.areas.length || n) && !confirm(`¿Eliminar la zona "${z.name}" con ${plural(z.areas.length, 'área', 'áreas')} y ${plural(n, 'espacio', 'espacios')}?`)) return;
      draft.zones.splice(draft.zones.indexOf(z), 1);
    } else if (t.closest('[data-area-move]')) {
      const z = zoneOf(t); const a = areaOf(t); const i = z.areas.indexOf(a); const j = i + Number(t.closest('[data-area-move]').dataset.areaMove);
      [z.areas[i], z.areas[j]] = [z.areas[j], z.areas[i]];
    } else if (t.closest('[data-area-remove]')) {
      const z = zoneOf(t); const a = areaOf(t);
      if (a.spaces.length && !confirm(`¿Eliminar el área "${a.name}" y sus ${plural(a.spaces.length, 'espacio', 'espacios')}?`)) return;
      z.areas.splice(z.areas.indexOf(a), 1);
    } else if (t.closest('[data-area-add]')) {
      const z = zoneOf(t);
      z.areas.push(newArea('Nueva área', []));
      renderPanelZones();
      const inputs = zBox.querySelectorAll(`[data-pe-zone="${z.id}"] [data-area-field="name"]`);
      inputs[inputs.length - 1]?.select();
      return;
    } else return;
    renderPanelZones();
  });
  $('#peAddZone').addEventListener('click', () => {
    draft.zones.push(newZone('Nueva zona'));
    renderPanelZones();
    const inputs = zBox.querySelectorAll('[data-zone-field="name"]');
    inputs[inputs.length - 1]?.select();
  });
}

function applyDraft() {
  draft.name = $('#fmtName').value.trim() || 'Formato';
  draft.subtitle = $('#fmtSubtitle').value.trim();
  draft.color = $('#fmtColor').value;
  draft.banner = $('#fmtBanner').value || null;
  draft.logo = $('#fmtLogo').value || null;
  draft.hidden = !$('#fmtShowHome').checked;
  draft.panel.buttons = draft.panel.buttons.map((b) => ({ ...b, label: b.label.trim() || (b.type === 'back' ? 'Cambiar formato' : b.type === 'checklist' ? 'Descarga Checklist' : 'Enlace'), url: b.url.trim() }));
  const badLink = draft.panel.buttons.find((b) => b.type === 'link' && b.visible && !b.url);
  if (badLink) { showPanelTab('botones'); toast(`El botón "${badLink.label}" no tiene enlace.`, 4000); return false; }
  // Solo enlaces web (https://…) o rutas de SharePoint; nunca javascript:, data:, etc.
  const unsafe = draft.panel.buttons.find((b) => b.type === 'link' && b.url && /^[a-z][a-z0-9+.-]*:/i.test(b.url) && !/^https?:\/\//i.test(b.url));
  if (unsafe) { showPanelTab('botones'); toast(`El enlace de "${unsafe.label}" no es válido. Usa una dirección que empiece con https://`, 5000); return false; }
  if (editingFormatId) {
    const i = state.formats.findIndex((f) => f.id === editingFormatId);
    state.formats[i] = draft;
  } else {
    state.formats.push(draft);
  }
  setActiveFormat(draft.id);
  if (!findArea(board.activeAreaId)) board.activeAreaId = null;
  commit();
  return true;
}

function openIntroDialog() {
  const t = state.intro;
  $('#inTitle').value = t.title;
  $('#inSubtitle').value = t.subtitle;
  $('#inGuideTitle').value = t.guideTitle;
  $('#inGuide').value = t.guide;
  $('#inImportantTitle').value = t.importantTitle;
  $('#inImportant').value = (t.important || []).join('\n');
  $('#inBanner').innerHTML = bannerOptions(t.banner || null);
  renderIntroBannerPreview();
  $('#introDlg').showModal();
}

function renderIntroBannerPreview() {
  const img = images.get($('#inBanner').value);
  $('#inBannerPreview').innerHTML = img ? `<img alt="" src="${urlFor(img)}">` : '';
}

function setupFormatUI() {
  $('#formatTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-format]');
    if (tab) { setActiveFormat(tab.dataset.format); saveBoard({ dirty: false }); render(); return; }
    const act = e.target.closest('[data-format-action]');
    if (!act) return;
    if (act.dataset.formatAction === 'edit') openFormatDialog(board.id);
    else if (act.dataset.formatAction === 'add') openFormatDialog(null);
    else if (act.dataset.formatAction === 'intro') openIntroDialog();
  });

  ['#fmtName', '#fmtSubtitle', '#fmtColor', '#fmtBanner', '#fmtLogo'].forEach((sel) => $(sel).addEventListener('input', renderFormatPreview));
  setupPanelEditor();

  $('#formatForm').addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    if (!applyDraft()) e.preventDefault();
  });

  $('#fmtDelete').addEventListener('click', () => {
    const f = state.formats.find((x) => x.id === editingFormatId);
    if (!f || state.formats.length < 2) return;
    const n = allSpaces(f).length;
    if (!confirm(`¿Eliminar el formato ${f.name}${n ? ` y sus ${plural(n, 'espacio', 'espacios')}` : ''}? Esto no se puede deshacer.`)) return;
    state.formats = state.formats.filter((x) => x.id !== f.id);
    setActiveFormat(state.formats[0].id);
    $('#formatDlg').close();
    commit();
  });

  $('#introForm').addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    state.intro = {
      title: $('#inTitle').value.trim() || DEFAULT_INTRO.title,
      subtitle: $('#inSubtitle').value.trim(),
      guideTitle: $('#inGuideTitle').value.trim(),
      guide: $('#inGuide').value.trim(),
      importantTitle: $('#inImportantTitle').value.trim(),
      important: $('#inImportant').value.split('\n').map((x) => x.trim()).filter(Boolean),
      banner: $('#inBanner').value || null,
    };
    commit();
    toast('Página de inicio actualizada. Publica para que se vea.');
  });
  $('#inBanner').addEventListener('input', renderIntroBannerPreview);
  $('#introReset').addEventListener('click', () => {
    // Restablece los textos; la foto de portada se conserva.
    state.intro = { ...structuredClone(DEFAULT_INTRO), banner: state.intro.banner || null };
    $('#introDlg').close();
    commit();
  });

  ['#formatDlg', '#introDlg'].forEach((sel) => {
    const dlg = $(sel);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });
}

/* ---------- Zonas, áreas y espacios: clics y edición ---------- */
function setupBoardUI() {
  $('#bannerBox').addEventListener('click', (e) => {
    if (e.target.closest('[data-banner-clear]')) { board.banner = null; commit(); }
  });

  $('#zoneBar').addEventListener('click', (e) => {
    const z = e.target.closest('[data-zone]');
    if (z) { board.activeZoneId = z.dataset.zone; board.activeAreaId = null; saveBoard({ dirty: false }); render(); return; }
    if (e.target.closest('[data-zone-action="add"]')) {
      const zone = newZone('Nueva zona');
      board.zones.push(zone);
      board.activeZoneId = zone.id;
      board.activeAreaId = null;
      commit();
      focusEditable('[data-zone-title]');
    }
  });

  const panel = $('#zonePanel');
  panel.addEventListener('click', (e) => {
    const zone = activeZone();
    const areaBtn = e.target.closest('[data-area]');
    if (areaBtn) { selectArea(areaBtn.dataset.area); return; }

    const za = e.target.closest('[data-zone-action]');
    if (za && zone) {
      const i = board.zones.indexOf(zone);
      if (za.dataset.zoneAction === 'toggle') zone.hidden = !zone.hidden;
      else if (za.dataset.zoneAction === 'left' && i > 0) [board.zones[i - 1], board.zones[i]] = [board.zones[i], board.zones[i - 1]];
      else if (za.dataset.zoneAction === 'right' && i < board.zones.length - 1) [board.zones[i + 1], board.zones[i]] = [board.zones[i], board.zones[i + 1]];
      else if (za.dataset.zoneAction === 'delete') {
        const n = zone.areas.reduce((k, a) => k + a.spaces.length, 0);
        if (!confirm(`¿Eliminar la zona "${zone.name}" con ${plural(zone.areas.length, 'área', 'áreas')} y ${plural(n, 'espacio', 'espacios')}?`)) return;
        board.zones.splice(i, 1);
        board.activeZoneId = board.zones[Math.max(0, i - 1)]?.id || null;
        board.activeAreaId = null;
      } else return;
      commit();
      return;
    }

    const aa = e.target.closest('[data-area-action]');
    if (aa && zone) {
      const area = activeArea();
      if (aa.dataset.areaAction === 'add') {
        const a = newArea('Nueva área', []);
        zone.areas.push(a);
        board.activeAreaId = a.id;
        commit();
        focusEditable('[data-area-title]');
        return;
      }
      if (!area) return;
      const i = zone.areas.indexOf(area);
      if (aa.dataset.areaAction === 'toggle') area.hidden = !area.hidden;
      else if (aa.dataset.areaAction === 'left' && i > 0) [zone.areas[i - 1], zone.areas[i]] = [zone.areas[i], zone.areas[i - 1]];
      else if (aa.dataset.areaAction === 'right' && i < zone.areas.length - 1) [zone.areas[i + 1], zone.areas[i]] = [zone.areas[i], zone.areas[i + 1]];
      else if (aa.dataset.areaAction === 'delete') {
        if (!confirm(`¿Eliminar el área "${area.name}"${area.spaces.length ? ` y sus ${plural(area.spaces.length, 'espacio', 'espacios')}` : ''}?`)) return;
        zone.areas.splice(i, 1);
        board.activeAreaId = null;
      } else return;
      commit();
      return;
    }

    const sa = e.target.closest('[data-space-action]');
    if (sa) {
      const area = activeArea();
      if (sa.dataset.spaceAction === 'add' && area) {
        addSpace(area.id, { title: 'Nuevo espacio' });
        const cards = panel.querySelectorAll('.space [data-space-title]');
        const last = cards[cards.length - 1];
        if (last) { last.focus(); document.getSelection().selectAllChildren(last); }
        return;
      }
      const spaceId = sa.closest('.card')?.dataset.cardId;
      if (!spaceId) return;
      if (sa.dataset.spaceAction === 'clear') clearImage(spaceId);
      else if (sa.dataset.spaceAction === 'toggle') { const f = findSpace(spaceId); if (f) { f.space.hidden = !f.space.hidden; commit(); } }
      else if (sa.dataset.spaceAction === 'delete') {
        const f = findSpace(spaceId);
        if (f && confirm(`¿Eliminar el espacio "${f.space.title}"?`)) { f.area.spaces.splice(f.index, 1); commit(); }
      }
    }
  });

  panel.addEventListener('change', (e) => {
    if (!e.target.matches('[data-area-zone]')) return;
    const area = activeArea();
    const from = activeZone();
    const to = board.zones.find((z) => z.id === e.target.value);
    if (!area || !from || !to || to === from) return;
    from.areas.splice(from.areas.indexOf(area), 1);
    to.areas.push(area);
    board.activeZoneId = to.id;
    commit();
    toast(`"${area.name}" ahora está en ${to.name}.`);
  });

  // Edición en línea de títulos y notas.
  panel.addEventListener('keydown', (e) => {
    if (!e.target.matches('[contenteditable="true"]')) return;
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    if (e.key === 'Escape') { e.target.dataset.cancel = '1'; e.target.blur(); }
  });
  panel.addEventListener('focusout', (e) => {
    const t = e.target;
    if (!t.matches || !t.matches('[contenteditable="true"]')) return;
    const value = t.textContent.replace(/\s+/g, ' ').trim();
    const cancel = t.dataset.cancel; delete t.dataset.cancel;
    const zone = activeZone();
    const area = activeArea();
    if (t.matches('[data-zone-title]') && zone) {
      if (cancel || !value) { t.textContent = zone.name; return; }
      if (value !== zone.name) { zone.name = value; commit(); }
    } else if (t.matches('[data-area-title]') && area) {
      if (cancel || !value) { t.textContent = area.name; return; }
      if (value !== area.name) { area.name = value; commit(); }
    } else if (t.matches('[data-area-note]') && area) {
      if (cancel) { t.textContent = area.note; return; }
      const note = value === defaultNote(area.name) ? '' : value;
      if (note !== area.note) { area.note = note; saveBoard(); }
      if (!note) t.textContent = '';
    } else if (t.matches('[data-space-title]')) {
      const f = findSpace(t.closest('.card').dataset.cardId);
      if (!f) return;
      if (cancel || !value) { t.textContent = f.space.title; return; }
      if (value !== f.space.title) { f.space.title = value; commit(); }
    }
  });
  panel.addEventListener('paste', (e) => {
    if (!e.target.closest('[contenteditable="true"]')) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });
}

/* ---------- Menú ---------- */
function autoPlace() {
  const counts = placementCounts();
  const areaByName = new Map(allAreas().map(({ area }) => [norm(area.name), area]));
  const plan = [];
  for (const img of images.values()) {
    if (counts.get(img.id) || !img.folder) continue;
    const area = areaByName.get(norm(AREA_ALIASES[norm(img.folder)] || img.folder));
    if (area) plan.push([area, img]);
  }
  if (!plan.length) { toast('No hay fotos sin colocar cuya carpeta coincida con el nombre de un área.', 4000); return; }
  if (!confirm(`Se colocarán ${plural(plan.length, 'foto', 'fotos')} en el área cuyo nombre coincide con su carpeta, en el formato ${board.name}. Si el área ya tiene un espacio vacío con el mismo nombre que la foto, se usa ese espacio. ¿Continuar?`)) return;
  plan.sort((a, b) => collator.compare(a[1].name, b[1].name));
  for (const [area, img] of plan) {
    const title = titleFromName(img.name);
    const empty = area.spaces.find((s) => !s.imageId && norm(s.title) === norm(title));
    if (empty) empty.imageId = img.id;
    else area.spaces.push(newSpace(title, img.id));
  }
  commit();
  toast(`${plural(plan.length, 'foto colocada', 'fotos colocadas')}.`);
}

function areasFromFolders() {
  const zone = activeZone();
  if (!zone) { toast('Primero crea o elige una zona.'); return; }
  const existing = new Set(allAreas().map(({ area }) => norm(area.name)));
  const folders = [...new Set([...images.values()].map((i) => i.folder.split('/')[0].trim()).filter(Boolean))];
  const missing = folders.filter((f) => !existing.has(norm(AREA_ALIASES[norm(f)] || f))).sort(collator.compare);
  if (!missing.length) { toast('Todas las carpetas ya tienen un área con el mismo nombre.'); return; }
  if (!confirm(`Se crearán ${plural(missing.length, 'área', 'áreas')} en la zona ${zone.name}:\n\n${missing.join('\n')}`)) return;
  for (const name of missing) zone.areas.push(newArea(name, []));
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
    case 'connection': return openConnection();
    case 'load-published': return loadPublishedAction();
    case 'auto-place': return autoPlace();
    case 'areas-from-folders': return areasFromFolders();
    case 'clear-board':
      if (confirm(`Se quitarán todas las fotos de los espacios del formato ${board.name} (los espacios se conservan). ¿Continuar?`)) {
        allSpaces().forEach((s) => { s.imageId = null; });
        commit();
      }
      return;
    case 'reset-structure':
      if (confirm(`Se reemplazarán las zonas, áreas y espacios del formato ${board.name} por los originales, sin fotos. ¿Continuar?`)) {
        board.zones = newZones();
        board.activeZoneId = board.zones[0].id;
        board.activeAreaId = null;
        commit();
      }
      return;
    case 'clear-library': return clearLibrary();
  }
}

/* ---------- Eventos generales ---------- */
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

  setupFileDrop();
  setupViewer();
  setupConnection();
  setupFormatUI();
  setupBoardUI();
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
    state = normalizeState(saved);
    for (const rec of stored || []) images.set(rec.id, { ...rec, url: null });
  } catch (e) {
    console.warn(e);
    toast('Este navegador no permite guardar datos: el tablero se perderá al cerrar la página.', 5000);
  }

  if (!state) state = defaultState();
  setActiveFormat(state.activeId);
  render();
  renderPublishState();

  try {
    await SP.init();
    spReady = true;
  } catch (e) {
    console.error(e);
    toast(SP.errorText(e) + ' Puedes acomodar el tablero, pero no publicar.', 9000);
  }
  renderAccount();
  if (spReady) await syncWithPublished();
}

init();
