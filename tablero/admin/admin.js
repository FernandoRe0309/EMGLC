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

// Tarjeta "Consideraciones Importantes" que el manual muestra al abrirse y que se debe confirmar.
const DEFAULT_CONSIDERATIONS = {
  enabled: true,
  title: 'Consideraciones Importantes',
  intro: 'Antes de iniciar tu recorrido, considera los siguientes puntos clave. Te ayudarán a garantizar que en cada área de tu tienda permanezca únicamente la señalización autorizada.',
  items: [
    'Retira toda señalización que no aparezca en este manual y mantén únicamente la señalización indicada',
    'Evita duplicidades: coloca máximo una señalización por departamento.',
    'Verifica que los letreros de Entrada y Salida permanezcan visibles en los accesos principales de clientes.',
    'Conserva toda la señalización ubicada en las gavetas de Farmacia.',
    'Mantén toda la señalización relacionada con precios. Esta señalización no debe retirarse.',
  ],
  confirmText: 'Confirma que has leído, comprendido y considerado estos puntos.',
  notes: [
    'La imagen mostrada puede variar respecto a la señalización de tu tienda. Guíate por el contenido de la señalización, no por su diseño. Los equipos correspondientes informarán posteriormente sobre reemplazos o fechas de llegada.',
    'Mantén todos los stickers ubicados en las máquinas del área de Perecederos.',
  ],
  buttonLabel: 'CONFIRMO DE LEÍDO Y ENTERADO',
};

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
  considerations: DEFAULT_CONSIDERATIONS,
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif|svg)$/i;
const DB_NAME = 'tablero-senalizacion';
const DB_VERSION = 1;
const MAX_SIDE = 2000;      // px del lado mayor tras optimizar
const JPEG_QUALITY = 0.85;

/* ---------- Utilidades ---------- */
// Íconos de línea (sin emojis).
const ICON_TRASH = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_EYE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const ICON_EYE_OFF = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6M3 3l18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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

const newSpace = (title, imageId = null) => ({ id: uid(), title, imageId, hidden: false, text: '' });
const newArea = (name, spaces) => ({ id: uid(), name, note: '', hidden: false, blocks: [], spaces: spaces || (DEFAULT_SPACES[name] || []).map((t) => newSpace(t)) });
const newZone = (name, areas = []) => ({ id: uid(), name, hidden: false, blocks: [], areas });
const newZones = () => DEFAULT_ZONES.map((z) => {
  const zone = newZone(z.name, z.areas.map((a) => newArea(a)));
  // Protección Civil empieza con las notas de ejemplo de la guía.
  if (z.name === 'Protección Civil') {
    const info = newBlock('info');
    info.text = 'Consulta aquí la señalización relacionada con Protección Civil.';
    zone.blocks = [newBlock('importante-amarillo'), info];
  }
  return zone;
});

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
  f.blocks = Array.isArray(f.blocks) ? f.blocks.map(normalizeBlock) : [];
  return f;
}

function newFormat({ name = 'Nuevo formato', subtitle = '', color = '#1f4fd6', banner = null, logo = null, zones, hidden = false, panel, blocks } = {}) {
  const f = ensureFormatShape({ id: uid(), name, subtitle, color, banner, logo, hidden, panel, blocks, zones: zones || newZones() });
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
// Los títulos (kind: 'title') van entre los recuadros para agruparlos; no son señalización.
const isTitle = (s) => s && s.kind === 'title';
const signsOf = (a) => a.spaces.filter((s) => !isTitle(s));
const allSpaces = (f = board) => f.zones.flatMap((z) => z.areas.flatMap((a) => signsOf(a)));
const newTitle = (title = 'Nuevo título') => ({ id: uid(), kind: 'title', title, imageId: null, hidden: false, text: '' });

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

// Guardado en este navegador: como máximo 0.3 s después de cada cambio (aunque sigas
// trabajando) y al instante al cerrar o cambiar de pestaña.
let saveTimer = null;
let lastSave = 0;
function persistNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  lastSave = Date.now();
  if (!state) return Promise.resolve();
  return idb('state', 'readwrite', (s) => s.put(state, 'board')).catch((e) => console.error(e));
}
function saveBoard({ dirty = true } = {}) {
  if (dirty) state.dirty = true;
  renderPublishState();
  if (saveTimer) return;
  saveTimer = setTimeout(persistNow, Math.max(0, 300 - (Date.now() - lastSave)));
}
window.addEventListener('pagehide', persistNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persistNow(); });

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
  }).join('') + `<button type="button" class="ftab-tool" data-format-action="edit" title="Botones, secciones, zonas y áreas del panel de ${escapeHtml(board.name)}">Personalizar panel</button>
    <button type="button" class="ftab-tool" data-format-action="add">+ Formato</button>
    <button type="button" class="ftab-tool" data-format-action="intro" title="Foto y textos de la página de inicio">Página de inicio</button>`;
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
    const n = z.areas.reduce((k, a) => k + signsOf(a).length, 0);
    return `<button type="button" class="zone-btn${z.id === board.activeZoneId ? ' active' : ''}${z.hidden ? ' is-hidden' : ''}" data-zone="${z.id}" data-drop-zone="${z.id}">
      ${escapeHtml(z.name)}<small>${z.hidden ? 'Oculta en el manual' : `${plural(z.areas.length, 'área', 'áreas')} · ${plural(n, 'espacio', 'espacios')}`}</small></button>`;
  }).join('') + '<button type="button" class="zone-add" data-zone-action="add">+ Zona</button>' + pasteButtonHtml('zone');
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
        <button type="button" class="copy-btn" data-zone-action="copy" title="Copiar esta zona con todas sus áreas, notas y fotos para pegarla en otro formato">Copiar</button>
        <button type="button" class="eye-btn${zone.hidden ? ' off' : ''}" data-zone-action="toggle" title="${zone.hidden ? 'Mostrar esta zona en el manual' : 'Ocultar esta zona en el manual'}">${zone.hidden ? 'Oculta' : 'Visible'}</button>
        <button type="button" class="icon-btn" data-zone-action="left" title="Mover zona a la izquierda" ${zi === 0 ? 'disabled' : ''}>←</button>
        <button type="button" class="icon-btn" data-zone-action="right" title="Mover zona a la derecha" ${zi === board.zones.length - 1 ? 'disabled' : ''}>→</button>
        <button type="button" class="icon-btn danger" data-zone-action="delete" title="Eliminar zona">${ICON_TRASH}</button>
      </div>
    </div>
    ${blocksEditHtml('zone', zone.blocks, 'top')}
    <div class="area-grid">
      ${zone.areas.map((a) => {
        const filled = a.spaces.filter((s) => s.imageId).length;
        const total = signsOf(a).length;
        return `<button type="button" class="area-btn${area && a.id === area.id ? ' active' : ''}${a.hidden ? ' is-hidden' : ''}" data-area="${a.id}" data-drop-area="${a.id}">
          <span>${escapeHtml(a.name)}</span><small>${a.hidden ? 'oculta' : `${filled}/${total}`}</small></button>`;
      }).join('')}
      <button type="button" class="area-add" data-area-action="add">+ Área</button>
      ${pasteButtonHtml('area')}
    </div>
    ${blocksEditHtml('zone', zone.blocks, 'bottom')}
    ${area ? areaDetailHtml(zone, area) : `<p class="pick-hint">${zone.areas.length ? 'Elige un área para ver y acomodar sus espacios.' : 'Esta zona aún no tiene áreas. Usa <strong>+ Área</strong>.'}</p>`}`;

  if (area) {
    const dz = panel.querySelector('.dropzone');
    const addBtn = dz.querySelector('.space-add');
    for (const sp of area.spaces) dz.insertBefore(spaceEl(sp), addBtn);
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
        <button type="button" class="copy-btn" data-area-action="copy" title="Copiar esta área con sus notas y fotos para pegarla en otra zona u otro formato">Copiar</button>
        <button type="button" class="eye-btn${area.hidden ? ' off' : ''}" data-area-action="toggle" title="${area.hidden ? 'Mostrar esta área en el manual' : 'Ocultar esta área en el manual'}">${area.hidden ? 'Oculta' : 'Visible'}</button>
        <button type="button" class="icon-btn" data-area-action="left" title="Mover área antes" ${ai === 0 ? 'disabled' : ''}>←</button>
        <button type="button" class="icon-btn" data-area-action="right" title="Mover área después" ${ai === zone.areas.length - 1 ? 'disabled' : ''}>→</button>
        <button type="button" class="icon-btn danger" data-area-action="delete" title="Eliminar área">${ICON_TRASH}</button>
      </div>
    </div>
    <p class="area-note" contenteditable="true" spellcheck="false" data-area-note data-placeholder="${escapeHtml(defaultNote(area.name))}">${escapeHtml(area.note || '')}</p>
    ${blocksEditHtml('area', area.blocks, 'top')}
    <div class="dropzone" data-area-id="${area.id}">
      <button type="button" class="space-add" data-space-action="add">+ Espacio<small>o suelta aquí una foto para crear uno</small></button>
      <button type="button" class="title-add" data-space-action="add-title">+ Título<small>para agrupar la señalización (ej. Licencias, Letreros). Después arrástralo a su lugar.</small></button>
    </div>
    ${blocksEditHtml('area', area.blocks, 'bottom')}`;
}

// Qué hay entre las notas de arriba y las de abajo, según dónde están.
const NOTE_WHERE = { format: 'las zonas', zone: 'las áreas', area: 'la señalización' };

// Notas con sus herramientas (editar, mover, eliminar) y el botón para agregar en ese lugar.
function blocksEditHtml(owner, blocks, pos) {
  const list = (blocks || []).filter((b) => (b.pos || 'top') === pos);
  const where = NOTE_WHERE[owner];
  const other = pos === 'top' ? 'abajo' : 'arriba';
  const add = `<button type="button" class="note-add" data-block-action="add" data-owner="${owner}" data-pos="${pos}">+ Nota ${pos === 'top' ? 'arriba' : 'abajo'} de ${where}</button>`;
  const notes = list.length ? `<div class="blocks blocks-edit">${list.map((b, i) => `
    <div class="blk-wrap" data-block="${b.id}" data-owner="${owner}">
      ${blockHtml(b)}
      <div class="blk-tools">
        <span class="blk-kind">${escapeHtml(BLOCK_TYPES[b.type]?.label || 'Nota')} · ${pos === 'top' ? 'arriba' : 'abajo'} de ${where}</span>
        <button type="button" data-block-action="edit">Editar</button>
        <button type="button" data-block-action="up" title="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-block-action="down" title="Bajar" ${i === list.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" data-block-action="flip" title="Pasar ${other} de ${where}">Pasar ${other}</button>
        <button type="button" data-block-action="delete" class="danger" title="Eliminar nota">${ICON_TRASH}</button>
      </div>
    </div>`).join('')}</div>` : '';
  // Arriba: primero las notas y luego el botón; abajo: igual, para que el botón quede junto a su lugar.
  return `<div class="notes-slot notes-${pos}">${notes}${add}</div>`;
}

function spaceEl(sp) {
  if (isTitle(sp)) {
    const el = document.createElement('article');
    el.className = 'card space title-card' + (sp.hidden ? ' is-hidden' : '');
    el.dataset.cardId = sp.id;
    el.innerHTML = `
      <span class="grip" title="Arrastra para mover el título">⋮⋮</span>
      <div class="title-text" contenteditable="true" spellcheck="true" data-space-title>${escapeHtml(sp.title)}</div>
      <span class="title-tag">Título</span>
      <button type="button" class="icon-btn eye${sp.hidden ? ' off' : ''}" data-space-action="toggle" title="${sp.hidden ? 'Mostrar este título en el manual' : 'Ocultar este título en el manual'}">${sp.hidden ? ICON_EYE_OFF : ICON_EYE}</button>
      <button type="button" class="icon-btn danger" data-space-action="delete" title="Eliminar título">${ICON_TRASH}</button>`;
    return el;
  }
  const img = sp.imageId && images.get(sp.imageId);
  const el = document.createElement('article');
  el.className = 'card space' + (sp.hidden ? ' is-hidden' : '');
  el.dataset.cardId = sp.id;
  el.innerHTML = `
    <div class="space-head">
      <div class="space-title" contenteditable="true" spellcheck="false" data-space-title>${escapeHtml(sp.title)}</div>
      <button type="button" class="icon-btn eye${sp.hidden ? ' off' : ''}" data-space-action="toggle" title="${sp.hidden ? 'Mostrar este espacio en el manual' : 'Ocultar este espacio en el manual'}">${sp.hidden ? ICON_EYE_OFF : ICON_EYE}</button>
      <button type="button" class="icon-btn danger" data-space-action="delete" title="Eliminar espacio">${ICON_TRASH}</button>
    </div>
    <div class="slot${img ? ' filled' : ''}" data-slot="${sp.id}">
      ${img ? `<img alt="" loading="lazy" draggable="false" src="${urlFor(img)}">
        <button type="button" class="slot-clear" data-space-action="clear" title="Quitar foto">×</button>`
        : sp.imageId ? `<span class="missing">Falta la foto en la biblioteca:<br>${escapeHtml(sp.imageId)}</span>`
          : `<span class="slot-hint">Coloca aquí la imagen de ${escapeHtml(sp.title)}</span>`}
    </div>
    <div class="space-text${sp.text ? ' has-text' : ''}" contenteditable="true" spellcheck="true" data-space-text
      data-placeholder="+ Agregar texto debajo de la imagen" title="Texto opcional que aparece debajo de la imagen. Mayús + Enter para un renglón nuevo.">${escapeHtml(sp.text || '')}</div>`;
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
  $('#formatNotesTop').innerHTML = blocksEditHtml('format', board.blocks, 'top');
  $('#formatNotesBottom').innerHTML = blocksEditHtml('format', board.blocks, 'bottom');
  renderLibrary(counts);
  renderStats(counts);
}

/* ---------- Operaciones ---------- */
function assignImage(spaceId, imageId) {
  const f = findSpace(spaceId);
  if (!f || isTitle(f.space) || !images.has(imageId)) return;
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
  if (drag.kind === 'card') drag.src.classList.add('drag-source'); // queda atenuado en su lugar
  if (navigator.vibrate && drag.touch) navigator.vibrate(12);
  moveGhost();
  updateTarget();
  autoScroll();
}

function moveGhost() {
  drag.ghost.style.left = drag.x + 'px';
  drag.ghost.style.top = drag.y + 'px';
}

function showDropMarker(el) {
  if (!el) return hideDropMarker();
  if (!drag.marker) {
    drag.marker = document.createElement('div');
    drag.marker.className = 'drop-marker';
    document.body.appendChild(drag.marker);
  }
  const r = el.getBoundingClientRect();
  drag.marker.style.left = `${r.left - 9}px`;
  drag.marker.style.top = `${r.top}px`;
  drag.marker.style.height = `${r.height}px`;
  drag.marker.hidden = false;
}

function hideDropMarker() {
  if (drag && drag.marker) drag.marker.hidden = true;
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
    hideDropMarker();
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
    // Mover un recuadro o un título: nada se reacomoda; una barra azul marca dónde caerá.
    setHover(zone);
    let before = null;
    for (const c of zone.querySelectorAll('.card:not(.drag-source)')) {
      const r = c.getBoundingClientRect();
      if (drag.y < r.top || (drag.y <= r.bottom && drag.x < r.left + r.width / 2)) { before = c; break; }
    }
    showDropMarker(before || zone.querySelector('.space-add'));
    drag.target = { areaId: zone.dataset.areaId, zone, before };
    return;
  }

  hideDropMarker();
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
  drag.marker?.remove();
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
    else if (findSpace(d.id)?.space.imageId && !isTitle(findSpace(d.id).space)) openViewer('card', d.id);
    return;
  }

  let index = null;
  const t = d.target;
  if (t && t.zone && d.kind === 'card') {
    const cards = [...t.zone.querySelectorAll('.card:not(.drag-source)')];
    index = t.before ? cards.indexOf(t.before) : cards.length;
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
        if (isTitle(s)) { if (!s.hidden) body += `<h4 class="gt">${escapeHtml(s.title)}</h4>`; continue; }
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
.gt{grid-column:1/-1;margin:10px 0 0;padding-bottom:6px;border-bottom:2px solid #ffc220;color:#1e3a9a;font-size:16px}
</style></head><body><header><h1>${escapeHtml(state.intro.title)} · ${escapeHtml(board.name)}</h1><p>Generado el ${escapeHtml(date)}</p></header><main>${body}</main></body></html>`;
  download(`Señalización ${SP.safeName(board.name)}.html`, new Blob([html], { type: 'text/html' }));
  toast('Catálogo exportado.', 4000);
}

function formatToJson(f) {
  return {
    id: f.id, name: f.name, subtitle: f.subtitle, color: f.color, banner: f.banner || null, logo: f.logo || null, hidden: !!f.hidden, panel: f.panel, blocks: f.blocks || [],
    zones: f.zones.map((z) => ({
      id: z.id, name: z.name, hidden: !!z.hidden, blocks: z.blocks || [],
      areas: z.areas.map((a) => ({ id: a.id, name: a.name, note: a.note || '', hidden: !!a.hidden, blocks: a.blocks || [], spaces: a.spaces.map((s) => (isTitle(s) ? { id: s.id, kind: 'title', title: s.title, hidden: !!s.hidden } : { id: s.id, title: s.title, image: s.imageId || null, hidden: !!s.hidden, text: s.text || '' })) })),
    })),
  };
}

function formatFromJson(f) {
  const nf = formatFromJsonRaw(f);
  if (f.id) nf.id = String(f.id);
  return nf;
}

function formatFromJsonRaw(f) {
  if (!Array.isArray(f.zones)) {
    return newFormat({ name: String(f.name || 'Formato'), subtitle: String(f.subtitle || ''), color: String(f.color || '#1f4fd6'), zones: migrateSections(f.sections, (c) => c.path || c.imageId || null) });
  }
  return newFormat({
    name: String(f.name || 'Formato'),
    subtitle: String(f.subtitle || ''),
    color: String(f.color || '#1f4fd6'),
    banner: f.banner ? String(f.banner) : null,
    logo: f.logo ? String(f.logo) : null,
    blocks: f.blocks,
    hidden: !!f.hidden,
    panel: f.panel,
    zones: f.zones.map((z) => {
      const zone = newZone(String(z.name || 'Zona'), (z.areas || []).map((a) => {
        const area = newArea(String(a.name || 'Área'), (a.spaces || []).map((s) => {
          const sp = newSpace(String(s.title || 'Espacio'), s.image ? String(s.image) : null);
          if (s.id) sp.id = String(s.id);
          if (s.kind === 'title') { sp.kind = 'title'; sp.imageId = null; }
          sp.hidden = !!s.hidden;
          sp.text = String(s.text || '');
          return sp;
        }));
        area.note = String(a.note || '');
        area.blocks = (a.blocks || []).map(normalizeBlock);
        area.hidden = !!a.hidden;
        if (a.id) area.id = String(a.id);
        return area;
      }));
      if (z.id) zone.id = String(z.id);
      zone.hidden = !!z.hidden;
      zone.blocks = (z.blocks || []).map(normalizeBlock);
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
    el.textContent = 'Publicado ' + new Date(state.publishedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) + (state.publishedBy ? ` por ${state.publishedBy}` : '');
  } else {
    el.className = 'publish-state';
    el.textContent = '';
  }
}

// Carpetas en SharePoint: <Formato>/<Zona>/<Área>/<Espacio>.jpg y <Formato>/Portada.jpg
async function buildPlan(pubRefs = new Map()) {
  const files = new Map(); // ruta -> img
  // Si una foto publicada (por otra persona) no está en esta computadora, se conserva tal cual.
  const keepRef = (id) => (id && pubRefs.get(id)) || null;
  const uniq = (set, name) => { let n = name, k = 2; while (set.has(n.toLowerCase())) n = `${name} (${k++})`; set.add(n.toLowerCase()); return n; };
  const ref = async (img, file) => {
    if (!img.hash) img.hash = await sha1(img.blob);
    files.set(file, img);
    return { path: img.id, hash: img.hash, file };
  };
  // Foto de portada de la página de inicio: <carpeta>/Portada inicio.jpg
  const homeImg = state.intro.banner && images.get(state.intro.banner);
  const intro = { ...state.intro, banner: homeImg ? await ref(homeImg, `Portada inicio.${expectedExt(homeImg)}`) : keepRef(state.intro.banner) };
  const logoFiles = new Set(); // los logos se publican en PNG para conservar la transparencia
  const fmtNames = new Set();
  const formats = [];
  for (const f of state.formats) {
    const fname = uniq(fmtNames, SP.safeName(f.name) || 'Formato');
    const bannerImg = f.banner && images.get(f.banner);
    const banner = bannerImg ? await ref(bannerImg, `${fname}/Portada.${expectedExt(bannerImg)}`) : keepRef(f.banner);
    const logoImg = f.logo && images.get(f.logo);
    let logo = keepRef(f.logo);
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
          if (isTitle(s)) { spaces.push({ id: s.id, kind: 'title', title: s.title, hidden: !!s.hidden }); continue; }
          const img = s.imageId && images.get(s.imageId);
          let image = img ? null : keepRef(s.imageId);
          if (img) {
            const ext = expectedExt(img);
            const base = SP.safeName(s.title) || 'Señalización';
            let name = `${base}.${ext}`;
            for (let k = 2; used.has(name.toLowerCase()); k++) name = `${base} (${k}).${ext}`;
            used.add(name.toLowerCase());
            image = await ref(img, `${folder}/${name}`);
          }
          spaces.push({ id: s.id, title: s.title, hidden: !!s.hidden, text: s.text || '', image });
        }
        areas.push({ id: a.id, name: a.name, note: a.note || '', hidden: !!a.hidden, blocks: (a.blocks || []).map(normalizeBlock), spaces });
      }
      zones.push({ id: z.id, name: z.name, hidden: !!z.hidden, blocks: (z.blocks || []).map(normalizeBlock), areas });
    }
    formats.push({ id: f.id, name: f.name, subtitle: f.subtitle, color: f.color, hidden: !!f.hidden, panel: f.panel, blocks: (f.blocks || []).map(normalizeBlock), banner, logo, zones });
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

/* ---------- Trabajo en equipo ----------
   Cada persona edita en su navegador. Para no perder lo de nadie:
   - Al publicar se COMBINAN los cambios con lo que otra persona haya publicado
     (combinación de tres vías: lo último que viste, lo tuyo y lo publicado).
   - Cada 20 s se revisa si alguien publicó, y se trae a tu pantalla.
   - Antes de guardar se respalda la versión anterior en _historial/.
   - Publicar nunca borra fotos; hay una opción aparte para limpiar las que ya no se usan. */
const SCHEMA = 5;              // versión del formato de tablero.json
const HISTORY_DIR = '_historial';
const HISTORY_KEEP = 60;

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const stable = (v) => JSON.stringify(v, (k, x) => (isObj(x) ? Object.keys(x).sort().reduce((o, kk) => { o[kk] = x[kk]; return o; }, {}) : x));
const same = (a, b) => stable(a) === stable(b);
const isKeyed = (...arrs) => arrs.some((x) => Array.isArray(x) && x.length && isObj(x[0]) && 'id' in x[0]);

// Combina dos versiones a partir de la versión base que ambos tenían.
function merge3(base, mine, theirs, conflicts) {
  if (same(mine, theirs)) return structuredClone(mine);
  if (base !== undefined && same(mine, base)) return structuredClone(theirs);
  if (base !== undefined && same(theirs, base)) return structuredClone(mine);
  if (Array.isArray(mine) && Array.isArray(theirs) && isKeyed(base, mine, theirs)) return mergeList(Array.isArray(base) ? base : [], mine, theirs, conflicts);
  if (isObj(mine) && isObj(theirs)) {
    const out = {};
    const bo = isObj(base) ? base : {};
    for (const k of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
      if (!(k in mine)) out[k] = structuredClone(theirs[k]);
      else if (!(k in theirs)) out[k] = structuredClone(mine[k]);
      else out[k] = merge3(bo[k], mine[k], theirs[k], conflicts);
    }
    return out;
  }
  conflicts.push(stable(mine).slice(0, 80));
  // Los dos cambiaron lo mismo: gana lo tuyo. Si no se sabe qué tenías antes (copia de la
  // versión anterior del administrador), gana lo publicado para no deshacer el trabajo de otros.
  return structuredClone(base === undefined ? theirs : mine);
}

// Clave por nombre para reconocer el mismo elemento aunque tenga otro identificador
// (pasa con datos publicados por la versión anterior, que no traían identificadores).
function sameThingKey(x) {
  if (!isObj(x)) return null;
  if (x.name != null) return 'n:' + norm(x.name);
  if (x.type != null) return `b:${x.type}|${norm(x.label || x.title || '')}|${norm(x.text || '').slice(0, 40)}`;
  if (x.title != null) return 't:' + norm(x.title);
  return null;
}

function mergeList(base, mine, theirs, conflicts) {
  // Alinear identificadores: lo tuyo que no está en lo publicado pero tiene el mismo nombre
  // que algo nuevo de lo publicado es el mismo elemento.
  const mineIds = new Set(mine.map((x) => x.id));
  const baseIds = new Set(base.map((x) => x.id));
  const theirIds = new Set(theirs.map((x) => x.id));
  const free = theirs.filter((t) => !mineIds.has(t.id) && !baseIds.has(t.id));
  const used = new Set();
  base = base.slice();
  mine = mine.map((m) => {
    if (theirIds.has(m.id)) return m;
    const k = sameThingKey(m);
    const t = k && free.find((x) => !used.has(x.id) && sameThingKey(x) === k);
    if (!t) return m;
    used.add(t.id);
    const bi = base.findIndex((x) => x.id === m.id);
    if (bi !== -1) base[bi] = { ...base[bi], id: t.id };
    return { ...m, id: t.id };
  });
  const B = new Map(base.map((x) => [x.id, x]));
  const M = new Map(mine.map((x) => [x.id, x]));
  const T = new Map(theirs.map((x) => [x.id, x]));
  const out = [];
  for (const m of mine) {
    if (T.has(m.id)) out.push(merge3(B.get(m.id), m, T.get(m.id), conflicts));
    else if (!B.has(m.id) || !same(m, B.get(m.id))) out.push(structuredClone(m)); // nuevo tuyo, o lo cambiaste aunque el otro lo borró
  }
  theirs.forEach((t, i) => {
    if (M.has(t.id)) return;
    if (B.has(t.id) && same(t, B.get(t.id))) return; // lo borraste tú y el otro no lo tocó
    let pos = 0; // se inserta después de su vecino anterior
    for (let j = i - 1; j >= 0; j--) {
      const k = out.findIndex((x) => x.id === theirs[j].id);
      if (k !== -1) { pos = k + 1; break; }
    }
    out.splice(pos, 0, structuredClone(t));
  });
  return out;
}

// Versiones publicadas por administradores anteriores no traían identificadores: se asignan por nombre.
function adoptIds(doc, ref) {
  const nk = (x) => norm(x.name || '');
  const bk = (x) => `${x.type}|${norm(x.title || '')}|${norm(x.text || '').slice(0, 40)}`;
  const adopt = (items, refItems, key, recurse) => {
    if (!Array.isArray(items)) return;
    const refs = refItems || [];
    const used = new Set(items.filter((x) => x && x.id).map((x) => x.id));
    for (const it of items) {
      let match = it.id ? refs.find((r) => r.id === it.id) || null : null;
      if (!it.id) {
        match = refs.find((r) => !used.has(r.id) && key(r) === key(it)) || null;
        if (match) { it.id = match.id; used.add(match.id); }
      }
      if (recurse) recurse(it, match);
    }
  };
  adopt(doc.formats, ref && ref.formats, nk, (f, rf) => {
    adopt(f.blocks, rf && rf.blocks, bk);
    adopt(f.panel && f.panel.buttons, rf && rf.panel && rf.panel.buttons, (x) => `${x.type}|${norm(x.label || '')}`);
    adopt(f.zones, rf && rf.zones, nk, (z, rz) => {
      adopt(z.blocks, rz && rz.blocks, bk);
      adopt(z.areas, rz && rz.areas, nk, (ar, ra) => {
        adopt(ar.blocks, ra && ra.blocks, bk);
        adopt(ar.spaces, ra && ra.spaces, (x) => norm(x.title || ''));
      });
    });
  });
}

// Estado local → documento comparable.
function toDoc(st = state) {
  return { intro: structuredClone(st.intro), formats: st.formats.map((f) => structuredClone(formatToJson(f))) };
}

// tablero.json publicado → documento comparable (fotos por su ruta original).
function docFromPublished(data, ref) {
  const intro = { ...structuredClone(DEFAULT_INTRO), ...(data.intro || {}) };
  intro.banner = data.intro && data.intro.banner && data.intro.banner.path ? data.intro.banner.path : null;
  const raw = {
    intro,
    formats: (data.formats || []).map((f) => (Array.isArray(f.zones) ? {
      ...f,
      banner: f.banner && f.banner.path ? f.banner.path : null,
      logo: f.logo && f.logo.path ? f.logo.path : null,
      zones: f.zones.map((z) => ({ ...z, areas: (z.areas || []).map((ar) => ({ ...ar, spaces: (ar.spaces || []).map((x) => (x.kind === 'title' ? { id: x.id, kind: 'title', title: x.title, hidden: !!x.hidden } : { id: x.id, title: x.title, hidden: !!x.hidden, text: x.text || '', image: x.image && x.image.path ? x.image.path : null })) })) })),
    } : f)),
  };
  adoptIds(raw, ref);
  return { intro: raw.intro, formats: raw.formats.map((f) => formatToJson(formatFromJson(f))) };
}

// Aplica un documento al estado local conservando qué formato, zona y área tenías abiertos.
function applyDoc(doc) {
  const keepFmt = board && board.id;
  const actives = new Map(state.formats.map((f) => [f.id, { z: f.activeZoneId, a: f.activeAreaId }]));
  state.intro = { ...structuredClone(DEFAULT_INTRO), ...structuredClone(doc.intro) };
  state.formats = doc.formats.map((f) => {
    const nf = formatFromJson(f);
    const act = actives.get(nf.id);
    if (act) { nf.activeZoneId = act.z; nf.activeAreaId = act.a; }
    return nf;
  });
  if (!state.formats.length) state.formats = defaultState().formats;
  setActiveFormat(state.formats.some((f) => f.id === keepFmt) ? keepFmt : state.formats[0].id);
  if (!findArea(board.activeAreaId)) board.activeAreaId = null;
}

// Descarga las fotos publicadas que no tienes en este navegador.
async function downloadPublishedImages(data, { quiet = false } = {}) {
  const refs = publishedRefs(data).filter((r) => r.path && r.file);
  const need = [...new Map(refs.filter((r) => images.get(r.path)?.hash !== r.hash).map((r) => [r.path, r])).values()];
  const fetched = [];
  let done = 0;
  for (const r of need) {
    if (!quiet) toast(`Descargando fotos publicadas… ${++done}/${need.length}`, 60000);
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
  if (fetched.length) await idb('images', 'readwrite', (st) => { fetched.forEach((x) => st.put(x)); }).catch(console.error);
}

function publishedByText(data) {
  const who = data && data.updatedBy ? data.updatedBy : 'Otra persona';
  const when = data && data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  return { who, when };
}

// Trae lo publicado y lo combina con tus cambios sin publicar (si los hay).
async function mergeFromPublished(data, { quiet = false } = {}) {
  await downloadPublishedImages(data, { quiet });
  const theirs = docFromPublished(data, state.base || toDoc());
  const conflicts = [];
  if (!state.dirty) {
    applyDoc(theirs);
  } else {
    applyDoc(merge3(state.base, toDoc(), theirs, conflicts));
  }
  state.base = theirs;
  state.publishedAt = data.updatedAt || null;
  state.publishedBy = data.updatedBy || null;
  state.dirty = !same(toDoc(), theirs);
  saveBoard({ dirty: false });
  render();
  return conflicts;
}

function versionProblem(data) {
  if (SP.updateAvailable()) return 'Hay una versión nueva de esta página. Presiona "Actualizar ahora" (abajo) antes de publicar.';
  if (data && (data.schema || 0) > SCHEMA) return 'Lo publicado se hizo con una versión más nueva del administrador. Actualiza esta página (Ctrl+F5) antes de publicar para no borrar nada.';
  return null;
}

async function saveHistoryCopy(prev) {
  if (!prev || !prev.updatedAt) return;
  const stamp = prev.updatedAt.replace('T', ' ').slice(0, 19).replace(/:/g, '-');
  const name = SP.safeName(`tablero ${stamp}${prev.updatedBy ? ' ' + prev.updatedBy : ''}`) + '.json';
  await SP.upload(`${HISTORY_DIR}/${name}`, new Blob([JSON.stringify(prev, null, 2)], { type: 'application/json' }));
  // Conservar solo las más recientes.
  const files = [...(await SP.list(HISTORY_DIR)).keys()].filter((n) => /\.json$/i.test(n)).sort();
  for (const old of files.slice(0, Math.max(0, files.length - HISTORY_KEEP))) await SP.remove(`${HISTORY_DIR}/${old}`).catch(() => {});
}

async function publish() {
  if (publishing || !ensureConnected()) return;
  const problem = versionProblem(null);
  if (problem) { toast(problem, 8000); return; }
  if (!confirm(`Se publicarán tus cambios en esta carpeta de SharePoint. Si otra persona publicó mientras tanto, sus cambios se conservan y se combinan con los tuyos. ¿Publicar?`)) return;

  publishing = true;
  const btn = $('#publishBtn');
  btn.disabled = true;
  try {
    setPublishProgress('Conectando con SharePoint…');
    await SP.resolveRoot();
    let prev = await SP.readJson();
    let merged = 0;
    for (let attempt = 0; attempt < 4; attempt++) {
      const vp = versionProblem(prev);
      if (vp) throw new SP.SPError(0, 'version', vp);
      // 1) Si alguien publicó después de lo último que viste, combinar primero.
      if (prev && prev.updatedAt !== state.publishedAt) {
        setPublishProgress('Combinando con los cambios de otra persona…');
        const conflicts = await mergeFromPublished(prev, { quiet: true });
        merged++;
        state.dirty = true;
        if (conflicts.length) console.warn('Cambios en el mismo lugar (se conservó lo tuyo):', conflicts);
      }
      // 2) Subir fotos nuevas o cambiadas.
      setPublishProgress('Preparando…');
      const pubRefs = new Map(publishedRefs(prev).map((r) => [r.path, r]));
      const prevFiles = new Map(publishedRefs(prev).map((r) => [r.file, r.hash]));
      const plan = await buildPlan(pubRefs);
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

      // 3) Justo antes de guardar, revisar que nadie haya publicado en este momento.
      const check = await SP.readJson();
      if ((check && check.updatedAt) !== (prev && prev.updatedAt)) { prev = check; continue; }

      // 4) Respaldo de la versión anterior y guardado.
      setPublishProgress('Guardando…');
      await saveHistoryCopy(prev).catch((e) => console.warn('No se pudo guardar el historial', e));
      const updatedAt = new Date().toISOString();
      const acc = SP.currentAccount();
      const data = {
        app: 'tablero-senalizacion', version: SCHEMA, schema: SCHEMA, appVersion: SP.APP_VERSION,
        updatedAt, updatedBy: acc ? acc.name || acc.username : null,
        intro: plan.intro, formats: plan.formats,
      };
      await SP.upload(SP.DATA_FILE, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));

      state.base = docFromPublished(data, toDoc());
      state.dirty = false;
      state.publishedAt = updatedAt;
      state.publishedBy = data.updatedBy;
      publishing = false;
      saveBoard({ dirty: false });
      render();
      toast(`Publicado${merged ? ' (combinado con los cambios de otra persona)' : ''}: ${plural(uploads.length, 'foto subida', 'fotos subidas')}.`, 6000);
      return;
    }
    throw new SP.SPError(0, 'busy', 'Otra persona está publicando al mismo tiempo. Espera unos segundos e intenta de nuevo.');
  } catch (e) {
    console.error(e);
    publishing = false;
    toast('No se publicó. ' + SP.errorText(e), 9000);
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

// Reemplaza lo local por lo publicado (descarta cambios sin publicar).
async function loadPublished(data) {
  await downloadPublishedImages(data);
  const doc = docFromPublished(data, state && state.base);
  applyDoc(doc);
  state.base = doc;
  state.dirty = false;
  state.publishedAt = data.updatedAt || null;
  state.publishedBy = data.updatedBy || null;
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

async function syncWithPublished({ quiet = false } = {}) {
  let published = null;
  try { published = await fetchPublished(); } catch (e) { console.warn(e); if (!quiet) toast(SP.errorText(e), 7000); return; }
  if (!published || published.updatedAt === state.publishedAt) return;
  const hadChanges = state.dirty;
  const conflicts = await mergeFromPublished(published, { quiet });
  const { who, when } = publishedByText(published);
  toast(hadChanges
    ? `${who} publicó cambios a las ${when}. Se combinaron con los tuyos; recuerda publicar.${conflicts.length ? ' En lo que ambos cambiaron se conservó lo tuyo.' : ''}`
    : `${who} publicó cambios a las ${when}. Ya los ves aquí.`, 7000);
}

// Revisión periódica: sin interrumpir si estás escribiendo, arrastrando o con una ventana abierta.
function isBusyEditing() {
  const a = document.activeElement;
  return !!(drag || publishing || document.querySelector('dialog[open]') || (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))));
}

function startPolling() {
  const tick = async () => {
    if (!spReady || document.visibilityState !== 'visible' || isBusyEditing()) return;
    await syncWithPublished({ quiet: true });
  };
  setInterval(tick, 20000);
  window.addEventListener('focus', tick);
  document.addEventListener('visibilitychange', tick);
}

/* ---------- Versiones anteriores ---------- */
async function openHistory() {
  if (!ensureConnected()) return;
  const dlg = $('#historyDlg');
  const list = $('#historyList');
  list.innerHTML = '<p class="muted">Cargando…</p>';
  dlg.showModal();
  try {
    const files = [...(await SP.list(HISTORY_DIR)).entries()].filter(([n]) => /\.json$/i.test(n)).sort((a, b) => b[0].localeCompare(a[0]));
    if (!files.length) { list.innerHTML = '<p class="muted">Todavía no hay versiones anteriores. Se guarda una cada vez que alguien publica.</p>'; return; }
    list.innerHTML = files.map(([n, f]) => {
      const m = n.match(/^tablero (\d{4}-\d{2}-\d{2}) (\d{2})-(\d{2})-(\d{2})\s*(.*)\.json$/i);
      const label = m ? `${m[1]} ${m[2]}:${m[3]}${m[5] ? ' · ' + m[5] : ''}` : n;
      return `<div class="hist-row"><span>${escapeHtml(label)}</span><button type="button" class="btn" data-hist-url="${escapeHtml(f.downloadUrl)}">Restaurar</button></div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<p class="cfg-result err">${escapeHtml(SP.errorText(e))}</p>`;
  }
}

function setupHistory() {
  const dlg = $('#historyDlg');
  $('#historyList').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-hist-url]');
    if (!b) return;
    if (!confirm('Se cargará esa versión en tu tablero (no se publica todavía). Tus cambios sin publicar se reemplazarán. Revísala y presiona Publicar para restaurarla para todos. ¿Continuar?')) return;
    try {
      const r = await fetch(`${b.dataset.histUrl}?t=${Date.now()}`, { credentials: 'same-origin', cache: 'no-store' });
      const data = await r.json();
      await downloadPublishedImages(data);
      applyDoc(docFromPublished(data, toDoc()));
      state.dirty = true;
      saveBoard();
      render();
      dlg.close();
      toast('Versión anterior cargada. Revísala y presiona Publicar para restaurarla.', 7000);
    } catch (err) {
      console.error(err);
      toast('No se pudo abrir esa versión.', 5000);
    }
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Registro de lectura (quién abrió el manual y quién confirmó) ---------- */
// Mismo cálculo que el manual para saber qué versión de las consideraciones se confirmó.
function considerationsHashOf(intro) {
  const c = { ...DEFAULT_CONSIDERATIONS, ...((intro && intro.considerations) || {}) };
  const str = JSON.stringify([c.title, c.intro, c.items, c.confirmText, c.notes, c.buttonLabel]);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return String(h);
}

let logRows = [];
const fmtDate = (v) => (v ? new Date(v).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '');

async function openReadLog() {
  if (!ensureConnected()) return;
  $('#logDlg').showModal();
  await renderReadLog();
}

async function renderReadLog() {
  const box = $('#logBody');
  const res = $('#logResult');
  res.className = 'cfg-result'; res.textContent = '';
  box.innerHTML = '<p class="muted">Cargando…</p>';
  $('#logActions').hidden = true;
  try {
    if (!(await SP.logListExists())) {
      box.innerHTML = `<p>Todavía no existe la lista <strong>${escapeHtml(SP.LOG_LIST)}</strong> en este sitio de SharePoint.</p>
        <p class="muted small">Al crearla, el manual empezará a registrar automáticamente quién lo abre (primera y última vez, cuántas veces) y quién confirma las Consideraciones Importantes. Cada persona solo puede ver su propia fila; quienes administran el sitio ven todas.</p>
        <button type="button" class="btn btn-primary" id="logCreate">Crear la lista y dar permiso a las tiendas</button>`;
      return;
    }
    const { rows, listUrl } = await SP.readLog();
    logRows = rows;
    const current = considerationsHashOf(state.intro);
    const confirmed = rows.filter((r) => r.Confirmo);
    const confirmedCurrent = confirmed.filter((r) => r.VersionConfirmada === current);
    $('#logOpen').href = listUrl;
    $('#logActions').hidden = false;
    box.innerHTML = `
      <div class="log-stats">
        <div><strong>${rows.length}</strong><span>${rows.length === 1 ? 'persona abrió' : 'personas abrieron'} el manual</span></div>
        <div><strong>${confirmed.length}</strong><span>confirmaron</span></div>
        <div><strong>${confirmedCurrent.length}</strong><span>confirmaron el texto actual</span></div>
      </div>
      ${rows.length ? `<div class="log-table-wrap"><table class="log-table">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Primera vez</th><th>Última vez</th><th>Veces</th><th>Confirmó</th></tr></thead>
        <tbody>${rows.map((r) => `<tr>
          <td>${escapeHtml(r.Title || '')}</td><td>${escapeHtml(r.Correo || '')}</td>
          <td>${escapeHtml(fmtDate(r.PrimeraApertura))}</td><td>${escapeHtml(fmtDate(r.UltimaApertura))}</td>
          <td class="num">${Number(r.Aperturas) || 0}</td>
          <td>${r.Confirmo ? `<span class="ok">Sí</span> ${escapeHtml(fmtDate(r.FechaConfirmacion))}${r.VersionConfirmada !== current ? ' <span class="old">(texto anterior)</span>' : ''}` : '<span class="no">No</span>'}</td>
        </tr>`).join('')}</tbody></table></div>`
      : '<p class="muted">Todavía nadie ha abierto el manual desde que se creó la lista.</p>'}
      <p class="muted small">Si no aparece nadie aunque ya lo abrieron, las tiendas no tienen permiso para escribir en la lista: usa <em>Dar permiso a las tiendas</em>.</p>`;
  } catch (e) {
    console.error(e);
    box.innerHTML = `<p class="cfg-result err">${escapeHtml(SP.errorText(e))}</p>`;
  }
}

async function grantReadLogPermissions() {
  const res = $('#logResult');
  res.className = 'cfg-result'; res.textContent = 'Dando permiso…';
  try {
    const r = await SP.grantLogPermissions();
    res.className = 'cfg-result ok';
    res.textContent = `Listo: el grupo "${r.group}" puede registrar su lectura en la lista ("${r.role}" solo en esa lista; cada quien solo ve su fila).`;
  } catch (e) {
    console.error(e);
    res.className = 'cfg-result err';
    res.textContent = 'Tu cuenta no puede cambiar permisos en este sitio. Pide a la persona dueña del sitio de SharePoint que, en la lista "' + SP.LOG_LIST
      + '", vaya a Configuración de la lista → Permisos de esta lista → Dejar de heredar permisos, y conceda "Colaborar" al grupo de visitantes del sitio (o a "Todos excepto usuarios externos").';
  }
}

function downloadReadLog() {
  const head = ['Nombre', 'Correo', 'Primera apertura', 'Última apertura', 'Aperturas', 'Confirmó', 'Fecha de confirmación', 'Confirmó el texto actual'];
  const current = considerationsHashOf(state.intro);
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [head.map(q).join(',')].concat(logRows.map((r) => [
    r.Title, r.Correo, fmtDate(r.PrimeraApertura), fmtDate(r.UltimaApertura), Number(r.Aperturas) || 0,
    r.Confirmo ? 'Sí' : 'No', fmtDate(r.FechaConfirmacion), r.Confirmo ? (r.VersionConfirmada === current ? 'Sí' : 'No') : '',
  ].map(q).join(',')));
  download(`Registro de lectura ${new Date().toISOString().slice(0, 10)}.csv`, new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}

function setupReadLog() {
  const dlg = $('#logDlg');
  $('#logBody').addEventListener('click', async (e) => {
    if (!e.target.closest('#logCreate')) return;
    const res = $('#logResult');
    res.className = 'cfg-result'; res.textContent = 'Creando la lista…';
    try {
      await SP.createLogList();
      await grantReadLogPermissions();
      const msg = res.textContent;
      await renderReadLog();
      res.className = /no puede/.test(msg) ? 'cfg-result err' : 'cfg-result ok';
      res.textContent = 'Lista creada. ' + msg;
    } catch (err) {
      console.error(err);
      res.className = 'cfg-result err';
      res.textContent = 'No se pudo crear la lista. ' + SP.errorText(err);
    }
  });
  $('#logRefresh').addEventListener('click', renderReadLog);
  $('#logGrant').addEventListener('click', grantReadLogPermissions);
  $('#logCsv').addEventListener('click', downloadReadLog);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Limpiar fotos que ya no se usan ---------- */
async function cleanupUnusedPhotos() {
  if (!ensureConnected()) return;
  try {
    toast('Buscando fotos que ya no se usan…', 60000);
    const data = await SP.readJson();
    const used = new Set(publishedRefs(data).map((r) => r.file));
    const files = [];
    const dirs = [];
    const walk = async (dir) => {
      for (const [name, it] of await SP.list(dir)) {
        const rel = dir ? `${dir}/${name}` : name;
        if (it.isFolder) {
          if (!dir && (name === HISTORY_DIR || name === 'Forms')) continue;
          dirs.push(rel);
          await walk(rel);
        } else if (dir && /\.(jpe?g|png|svg|gif|webp)$/i.test(name)) files.push(rel);
      }
    };
    await walk('');
    const unused = files.filter((f) => !used.has(f));
    if (!unused.length) { toast('No hay fotos sin usar.'); return; }
    if (!confirm(`Hay ${plural(unused.length, 'foto', 'fotos')} en las carpetas que ya no aparecen en el manual publicado. Se mandarán a la papelera de reciclaje de SharePoint (se pueden recuperar desde ahí). ¿Continuar?`)) { toast('No se borró nada.'); return; }
    let k = 0;
    for (const f of unused) { toast(`Enviando a la papelera ${++k}/${unused.length}…`, 60000); await SP.remove(f); }
    for (const d of dirs.sort((x, y) => y.split('/').length - x.split('/').length)) {
      const kids = await SP.list(d);
      if (!kids.size) await SP.remove(d);
    }
    toast(`${plural(unused.length, 'foto enviada', 'fotos enviadas')} a la papelera de reciclaje.`, 5000);
  } catch (e) {
    console.error(e);
    toast('No se pudo limpiar. ' + SP.errorText(e), 7000);
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
      <button type="button" class="icon-btn danger" data-btn-remove title="Quitar botón">${ICON_TRASH}</button>
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
        <button type="button" class="icon-btn danger" data-zone-remove title="Eliminar zona">${ICON_TRASH}</button>
      </div>
      <div class="pe-areas">
        ${z.areas.map((a, ai) => `
          <div class="pe-row pe-area${a.hidden ? ' off' : ''}" data-pe-area="${a.id}">
            <label class="pe-check" title="Mostrar esta área"><input type="checkbox" data-area-field="visible" ${a.hidden ? '' : 'checked'}></label>
            <div class="pe-main"><input data-area-field="name" value="${escapeHtml(a.name)}" maxlength="80" aria-label="Nombre del área"></div>
            <span class="pe-count">${plural(signsOf(a).length, 'espacio', 'espacios')}</span>
            <button type="button" class="icon-btn" data-area-move="-1" ${ai === 0 ? 'disabled' : ''} title="Subir">↑</button>
            <button type="button" class="icon-btn" data-area-move="1" ${ai === z.areas.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
            <button type="button" class="icon-btn danger" data-area-remove title="Eliminar área">${ICON_TRASH}</button>
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
  const c = { ...DEFAULT_CONSIDERATIONS, ...(t.considerations || {}) };
  $('#cnEnabled').checked = c.enabled !== false;
  $('#cnTitle').value = c.title;
  $('#cnIntro').value = c.intro;
  $('#cnItems').value = (c.items || []).join('\n');
  $('#cnConfirm').value = c.confirmText;
  $('#cnNotes').value = (c.notes || []).join('\n');
  $('#cnButton').value = c.buttonLabel;
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
      considerations: {
        enabled: $('#cnEnabled').checked,
        title: $('#cnTitle').value.trim() || DEFAULT_CONSIDERATIONS.title,
        intro: $('#cnIntro').value.trim(),
        items: $('#cnItems').value.split('\n').map((x) => x.trim()).filter(Boolean),
        confirmText: $('#cnConfirm').value.trim(),
        notes: $('#cnNotes').value.split('\n').map((x) => x.trim()).filter(Boolean),
        buttonLabel: $('#cnButton').value.trim() || DEFAULT_CONSIDERATIONS.buttonLabel,
      },
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

/* ---------- Copiar y pegar zonas y áreas (entre formatos) ----------
   Lo copiado se guarda en este navegador, así que sigue disponible al cambiar de formato o recargar. */
const CLIP_KEY = 'tablero-senalizacion:portapapeles';
let clipMemory = null;

function getClip() {
  try { const raw = localStorage.getItem(CLIP_KEY); if (raw) return JSON.parse(raw); } catch { /* sin almacenamiento */ }
  return clipMemory;
}

function setClip(clip) {
  clipMemory = clip;
  try { if (clip) localStorage.setItem(CLIP_KEY, JSON.stringify(clip)); else localStorage.removeItem(CLIP_KEY); } catch { /* solo en memoria */ }
}

function copyToClip(kind, item) {
  const zone = kind === 'area' ? activeZone() : item;
  setClip({ kind, from: board.name, fromZone: kind === 'area' ? zone.name : null, item: structuredClone(item), at: Date.now() });
  render();
  const what = kind === 'zone' ? `la zona "${item.name}"` : `el área "${item.name}"`;
  toast(`Copiaste ${what}. Ve al formato o zona donde la quieres y presiona "Pegar".`, 6000);
}

function pasteButtonHtml(kind) {
  const c = getClip();
  if (!c || c.kind !== kind) return '';
  const label = kind === 'zone' ? 'Pegar zona' : 'Pegar área';
  const from = `de ${c.from}${c.fromZone ? ' · ' + c.fromZone : ''}`;
  return `<button type="button" class="${kind === 'zone' ? 'zone-add' : 'area-add'} paste-btn" data-paste="${kind}" title="Pegar lo que copiaste">
      ${label} <strong>${escapeHtml(c.item.name)}</strong><small>${escapeHtml(from)}</small>
      <span class="clip-clear" data-clip-clear title="Olvidar lo copiado" role="button" aria-label="Olvidar lo copiado">×</span></button>`;
}

// Copia con identificadores nuevos (lo pegado es independiente del original).
function withNewIds(obj) {
  const c = structuredClone(obj);
  const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') { if ('id' in o) o.id = uid(); Object.values(o).forEach(walk); }
  };
  walk(c);
  return c;
}

// Ventana con opciones; devuelve el valor elegido o null.
function choose(title, text, options) {
  return new Promise((resolve) => {
    const dlg = $('#chooseDlg');
    $('#chooseTitle').textContent = title;
    $('#chooseText').textContent = text;
    const box = $('#chooseOptions');
    box.innerHTML = options.map((o, i) => `<button type="button" class="btn${i === 0 ? ' btn-primary' : ''}${o.danger ? ' danger' : ''}" data-choice="${o.value}">${escapeHtml(o.label)}</button>`).join('') +
      '<button type="button" class="btn" data-choice="">Cancelar</button>';
    const done = (v) => { dlg.close(); resolve(v || null); };
    box.onclick = (e) => { const b = e.target.closest('[data-choice]'); if (b) done(b.dataset.choice); };
    dlg.oncancel = () => resolve(null);
    dlg.showModal();
  });
}

async function pasteClip(kind) {
  const c = getClip();
  if (!c || c.kind !== kind) return;
  const pasted = withNewIds(c.item);
  if (kind === 'zone') {
    const existing = board.zones.find((z) => norm(z.name) === norm(pasted.name));
    let mode = 'new';
    if (existing) {
      mode = await choose(`Pegar zona "${pasted.name}" en ${board.name}`,
        `Ya existe una zona "${existing.name}" en ${board.name}. ¿Qué quieres hacer?`,
        [{ value: 'new', label: 'Agregar como zona nueva' }, { value: 'replace', label: `Reemplazar "${existing.name}"`, danger: true }]);
      if (!mode) return;
    }
    if (mode === 'replace') {
      if (!confirm(`Se reemplazará todo el contenido de "${existing.name}" en ${board.name} (áreas, notas y fotos) por lo copiado de ${c.from}. ¿Continuar?`)) return;
      const i = board.zones.indexOf(existing);
      board.zones[i] = { ...pasted, id: existing.id };
      board.activeZoneId = existing.id;
    } else {
      board.zones.push(pasted);
      board.activeZoneId = pasted.id;
    }
    board.activeAreaId = null;
    commit();
    toast(`Zona "${pasted.name}" pegada en ${board.name}. Recuerda publicar.`, 5000);
    return;
  }
  // Área: se pega en la zona abierta.
  const zone = activeZone();
  if (!zone) { toast('Primero elige la zona donde quieres pegar el área.'); return; }
  const found = allAreas().find(({ area }) => norm(area.name) === norm(pasted.name));
  let mode = 'new';
  if (found) {
    mode = await choose(`Pegar área "${pasted.name}"`,
      `Ya existe un área "${found.area.name}" en ${board.name} (zona ${found.zone.name}). ¿Qué quieres hacer?`,
      [{ value: 'new', label: `Agregar como área nueva en ${zone.name}` }, { value: 'replace', label: `Reemplazar "${found.area.name}"`, danger: true }]);
    if (!mode) return;
  }
  if (mode === 'replace') {
    if (!confirm(`Se reemplazará todo el contenido de "${found.area.name}" (notas, espacios y fotos) por lo copiado de ${c.from}. ¿Continuar?`)) return;
    const i = found.zone.areas.indexOf(found.area);
    found.zone.areas[i] = { ...pasted, id: found.area.id };
    board.activeZoneId = found.zone.id;
    board.activeAreaId = found.area.id;
  } else {
    zone.areas.push(pasted);
    board.activeAreaId = pasted.id;
  }
  commit();
  toast(`Área "${pasted.name}" pegada en ${board.name}. Recuerda publicar.`, 5000);
}

/* ---------- Zonas, áreas y espacios: clics y edición ---------- */
function setupBoardUI() {
  $('#bannerBox').addEventListener('click', (e) => {
    if (e.target.closest('[data-banner-clear]')) { board.banner = null; commit(); }
  });

  $('#zoneBar').addEventListener('click', (e) => {
    const z = e.target.closest('[data-zone]');
    if (z) { board.activeZoneId = z.dataset.zone; board.activeAreaId = null; saveBoard({ dirty: false }); render(); return; }
    if (e.target.closest('[data-clip-clear]')) { setClip(null); render(); toast('Se olvidó lo copiado.'); return; }
    if (e.target.closest('[data-paste="zone"]')) { pasteClip('zone'); return; }
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

    if (e.target.closest('[data-clip-clear]')) { setClip(null); render(); toast('Se olvidó lo copiado.'); return; }
    if (e.target.closest('[data-paste="area"]')) { pasteClip('area'); return; }
    const za = e.target.closest('[data-zone-action]');
    if (za && zone) {
      const i = board.zones.indexOf(zone);
      if (za.dataset.zoneAction === 'copy') { copyToClip('zone', zone); return; }
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
      if (aa.dataset.areaAction === 'copy') { copyToClip('area', area); return; }
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
      if (sa.dataset.spaceAction === 'add-title' && area) {
        area.spaces.push(newTitle());
        commit();
        const titles = panel.querySelectorAll('.title-card [data-space-title]');
        const last = titles[titles.length - 1];
        if (last) { last.scrollIntoView({ block: 'center' }); last.focus(); document.getSelection().selectAllChildren(last); }
        toast('Escribe el título y luego arrástralo arriba de los recuadros que agrupa.', 5000);
        return;
      }
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
        if (f && confirm(`¿Eliminar ${isTitle(f.space) ? 'el título' : 'el espacio'} "${f.space.title}"?${isTitle(f.space) ? ' (los recuadros no se borran)' : ''}`)) { f.area.spaces.splice(f.index, 1); commit(); }
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
    if (e.key === 'Enter' && !(e.shiftKey && e.target.matches('[data-space-text]'))) { e.preventDefault(); e.target.blur(); }
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
    } else if (t.matches('[data-space-text]')) {
      const f = findSpace(t.closest('.card').dataset.cardId);
      if (!f) return;
      if (cancel) { t.textContent = f.space.text || ''; return; }
      const text = t.innerText.replace(/\r/g, '').split('\n').map((x) => x.replace(/\s+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
      if (text !== (f.space.text || '')) { f.space.text = text; saveBoard(); }
      t.textContent = text;
      t.classList.toggle('has-text', !!text);
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

/* ---------- Editor de notas ---------- */
let blockEdit = null; // { owner: 'format'|'zone'|'area', id: string|null, touched: bool }

function blockOwner(owner) {
  const o = owner === 'format' ? board : owner === 'zone' ? activeZone() : activeArea();
  if (o && !Array.isArray(o.blocks)) o.blocks = [];
  return o;
}

function readBlockForm() {
  return normalizeBlock({
    id: blockEdit && blockEdit.id,
    type: $('#blkType').value,
    pos: $('#blkPos').value,
    title: $('#blkTitle').value.trim(),
    text: $('#blkText').value.trim(),
    items: $('#blkItems').value.split('\n').map((x) => x.trim()).filter(Boolean),
    footer: $('#blkFooter').value.trim(),
    buttonLabel: $('#blkBtnLabel').value.trim(),
    buttonUrl: $('#blkBtnUrl').value.trim(),
  });
}

function fillBlockForm(b) {
  $('#blkType').value = b.type;
  $('#blkPos').value = b.pos;
  $('#blkTitle').value = b.title;
  $('#blkText').value = b.text;
  $('#blkItems').value = b.items.join('\n');
  $('#blkFooter').value = b.footer;
  $('#blkBtnLabel').value = b.buttonLabel;
  $('#blkBtnUrl').value = b.buttonUrl;
}

function renderBlockForm() {
  const fields = BLOCK_TYPES[$('#blkType').value].fields;
  document.querySelectorAll('#blockDlg [data-f]').forEach((el) => { el.hidden = !fields.includes(el.dataset.f); });
  $('#blkPreview').innerHTML = blockHtml(readBlockForm());
}

function openBlockDialog(owner, id, pos = 'top') {
  const o = blockOwner(owner);
  if (!o) return;
  const existing = id ? o.blocks.find((b) => b.id === id) : null;
  blockEdit = { owner, id: existing ? existing.id : null, touched: !!existing };
  $('#blockDlgTitle').textContent = `${existing ? 'Editar nota' : 'Nueva nota'} · ${o.name}`;
  $('#blkType').innerHTML = Object.entries(BLOCK_TYPES).map(([k, t]) => `<option value="${k}">${escapeHtml(t.label)}</option>`).join('');
  const where = NOTE_WHERE[owner];
  $('#blkPos').innerHTML = `<option value="top">Arriba de ${where}</option><option value="bottom">Abajo de ${where}</option>`;
  fillBlockForm(existing ? normalizeBlock(existing) : newBlock('importante-rojo', pos));
  $('#blkDelete').hidden = !existing;
  renderBlockForm();
  $('#blockDlg').showModal();
}

function moveBlock(owner, id, dir) {
  const o = blockOwner(owner);
  const list = o.blocks;
  const i = list.findIndex((b) => b.id === id);
  const pos = list[i].pos || 'top';
  let j = i + dir;
  while (j >= 0 && j < list.length && (list[j].pos || 'top') !== pos) j += dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  commit();
}

function setupBlockEditor() {
  const dlg = $('#blockDlg');
  $('#blkType').addEventListener('change', () => {
    // Si aún no escribiste nada, se cargan los textos de ejemplo del tipo elegido.
    if (!blockEdit.touched) {
      const pos = $('#blkPos').value;
      fillBlockForm(newBlock($('#blkType').value, pos));
    }
    renderBlockForm();
  });
  dlg.addEventListener('input', (e) => {
    if (e.target.id === 'blkType') return;
    if (e.target.id !== 'blkPos') blockEdit.touched = true;
    renderBlockForm();
  });
  $('#blkPreview').addEventListener('click', (e) => { if (e.target.closest('a')) e.preventDefault(); });

  $('#blockForm').addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    const b = readBlockForm();
    const fields = BLOCK_TYPES[b.type].fields;
    if (fields.includes('button')) {
      if (!b.buttonUrl) { e.preventDefault(); toast('Agrega el enlace del botón.', 4000); return; }
      if (/^[a-z][a-z0-9+.-]*:/i.test(b.buttonUrl) && !/^https?:\/\//i.test(b.buttonUrl)) { e.preventDefault(); toast('El enlace no es válido. Usa una dirección que empiece con https://', 5000); return; }
    }
    // Solo se guardan los campos que usa el tipo elegido.
    for (const f of ['title', 'text', 'items', 'footer']) if (!fields.includes(f)) b[f] = f === 'items' ? [] : '';
    if (!fields.includes('button')) { b.buttonLabel = ''; b.buttonUrl = ''; }
    const o = blockOwner(blockEdit.owner);
    const i = o.blocks.findIndex((x) => x.id === b.id);
    if (i === -1) o.blocks.push(b); else o.blocks[i] = b;
    commit();
  });
  $('#blkDelete').addEventListener('click', () => {
    const o = blockOwner(blockEdit.owner);
    if (!confirm('¿Eliminar esta nota?')) return;
    o.blocks = o.blocks.filter((b) => b.id !== blockEdit.id);
    dlg.close();
    commit();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  // Botones de las notas en el tablero.
  $('.board-wrap').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-block-action]');
    if (!btn) {
      if (e.target.closest('.blk a')) e.preventDefault(); // en el admin los enlaces no navegan
      return;
    }
    const wrap = btn.closest('[data-block]');
    const owner = btn.dataset.owner || wrap?.dataset.owner;
    const id = wrap?.dataset.block;
    switch (btn.dataset.blockAction) {
      case 'add': return openBlockDialog(owner, null, btn.dataset.pos || 'top');
      case 'flip': {
        const o = blockOwner(owner);
        const b = o.blocks.find((x) => x.id === id);
        b.pos = b.pos === 'bottom' ? 'top' : 'bottom';
        // Al cambiar de lugar queda al final de las notas de su nuevo lugar.
        o.blocks = [...o.blocks.filter((x) => x.id !== id), b];
        commit();
        toast(`Nota movida ${b.pos === 'top' ? 'arriba' : 'abajo'} de ${NOTE_WHERE[owner]}.`);
        return;
      }
      case 'edit': return openBlockDialog(owner, id);
      case 'up': return moveBlock(owner, id, -1);
      case 'down': return moveBlock(owner, id, 1);
      case 'delete': {
        const o = blockOwner(owner);
        if (!confirm('¿Eliminar esta nota?')) return;
        o.blocks = o.blocks.filter((b) => b.id !== id);
        commit();
      }
    }
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
    const empty = area.spaces.find((s) => !isTitle(s) && !s.imageId && norm(s.title) === norm(title));
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
    case 'history': return openHistory();
    case 'readlog': return openReadLog();
    case 'cleanup': return cleanupUnusedPhotos();
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
  setupBlockEditor();
  setupHistory();
  setupReadLog();
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
  SP.watchForUpdates();
  if (spReady) {
    await syncWithPublished();
    startPolling();
  }
}

init();
