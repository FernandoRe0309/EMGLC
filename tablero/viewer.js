'use strict';

/* Panel de solo lectura del Manual de Señalización.
   Portada → Formato → Zona → Área → Espacios (título + foto).
   Lee tablero.json y las fotos de la misma carpeta de SharePoint donde está este archivo. */

const $ = (s) => document.querySelector(s);
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeColor = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#1f4fd6');
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
const defaultNote = (area) => `En ${area} solo deberás contar con la siguiente señalización`;

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
};

let data = null;     // { intro, formats, updatedAt }
let items = [];      // fotos del área abierta, para el visor: { title, section, src }
let visible = [];
let current = -1;
let lastFormatId = null;

/* ---------- Inicio ---------- */
async function start() {
  setHero({ title: DEFAULT_INTRO.title, sub: '' });
  try {
    await SP.init();
  } catch (e) {
    console.error(e);
    showStatus('No se pudo iniciar', SP.errorText(e));
    return;
  }
  await load();
}

async function load() {
  showStatus('Cargando manual…', '');
  try {
    data = normalize((await SP.readJson()) || {});
  } catch (e) {
    console.error(e);
    showStatus('No se pudo cargar el manual', SP.errorText(e));
    return;
  }
  renderAccount();
  route();
  startAutoRefresh();
  checkConsiderations();
}

/* ---------- Consideraciones Importantes ----------
   Se muestran al abrir el manual hasta que la persona confirma. La confirmación se guarda en
   este navegador; si el texto cambia, se vuelve a pedir. */
const ACK_KEY = 'tablero-senalizacion:consideraciones';

function considerationsHaveContent() {
  const c = data && data.intro.considerations;
  return !!(c && (c.intro || (c.items && c.items.length) || (c.notes && c.notes.length)));
}

function considerationsHash() {
  const c = data.intro.considerations;
  const str = JSON.stringify([c.title, c.intro, c.items, c.confirmText, c.notes, c.buttonLabel]);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return String(h);
}

function readAck() { try { return localStorage.getItem(ACK_KEY); } catch { return null; } }
function writeAck(v) { try { localStorage.setItem(ACK_KEY, v); } catch { /* sin almacenamiento: se volverá a mostrar */ } }

function openConsiderations({ mandatory = false } = {}) {
  const c = data.intro.considerations;
  const dlg = $('#considerDlg');
  $('#cnTitle').textContent = c.title;
  $('#cnIntro').textContent = c.intro;
  $('#cnIntro').hidden = !c.intro;
  $('#cnItems').innerHTML = (c.items || []).map((x) => `<li>${esc(x)}</li>`).join('');
  $('#cnItems').hidden = !(c.items || []).length;
  $('#cnConfirm').textContent = c.confirmText;
  $('#cnConfirm').hidden = !c.confirmText;
  $('#cnNotes').innerHTML = (c.notes || []).map((x) => `<p>${esc(x)}</p>`).join('');
  $('#cnNotes').hidden = !(c.notes || []).length;
  $('#cnButtonLabel').textContent = c.buttonLabel;
  $('#cnClose').hidden = mandatory;
  dlg.dataset.mandatory = mandatory ? '1' : '';
  if (!dlg.open) dlg.showModal();
  dlg.querySelector('.cn-body').scrollTop = 0;
}

function checkConsiderations() {
  if (!data || !considerationsHaveContent() || data.intro.considerations.enabled === false) return;
  if (readAck() === considerationsHash()) return;
  if (lb.open) return;
  openConsiderations({ mandatory: true });
}

// Cada minuto revisa si se publicó algo nuevo y lo muestra sin recargar ni mover la página.
let refreshing = false;
function startAutoRefresh() {
  const tick = async () => {
    if (refreshing || document.visibilityState !== 'visible' || lb.open) return;
    refreshing = true;
    try {
      const raw = await SP.readJson();
      if (raw && data && raw.updatedAt !== data.updatedAt) {
        const y = window.scrollY;
        data = normalize(raw);
        route({ quiet: true });
        window.scrollTo(0, y);
        checkConsiderations();
      }
    } catch (e) { console.warn(e); }
    refreshing = false;
  };
  setInterval(tick, 60000);
  window.addEventListener('focus', tick);
  document.addEventListener('visibilitychange', tick);
  SP.watchForUpdates();
}

function renderAccount() {
  const acc = SP.currentAccount();
  $('#account').hidden = !acc;
  $('#accountName').textContent = acc ? (acc.name || acc.username) : '';
  $('#signOutWrap').hidden = !SP.canSignOut;
}

const imgSrc = (ref) => (ref && ref.file ? `${SP.fileUrl(ref.file)}?v=${encodeURIComponent(ref.hash || '')}` : null);

function uniqueId(set, name) {
  let id = slug(name);
  while (set.has(id)) id += '-2';
  set.add(id);
  return id;
}

// Acepta tablero.json versión 4 (zonas) y versiones anteriores (secciones).
function normalize(raw) {
  const fmtIds = new Set();
  const list = Array.isArray(raw.formats) && raw.formats.length ? raw.formats : [
    { name: 'W2', subtitle: 'Señalización Walmart', color: '#1f4fd6' },
    { name: 'B2', subtitle: 'Señalización Bodega Aurrera', color: '#2e7d32' },
    { name: 'BAE', subtitle: 'Señalización Bodega Aurrera', color: '#2e7d32' },
  ];
  const formats = list.map((f) => {
    let zones = f.zones;
    if (!Array.isArray(zones)) {
      zones = Array.isArray(f.sections) && f.sections.length ? [{
        name: 'Áreas',
        areas: f.sections.map((s) => ({ name: s.name, note: '', spaces: (s.cards || []).map((c) => ({ title: c.title, image: c.file ? { file: c.file, hash: c.hash } : null })) })),
      }] : [];
    }
    const zoneIds = new Set();
    const panel = normalizePanel(f.panel);
    return {
      id: uniqueId(fmtIds, f.name || 'formato'),
      name: String(f.name || 'Formato'),
      subtitle: String(f.subtitle || ''),
      color: safeColor(f.color),
      hidden: !!f.hidden,
      panel,
      banner: panel.showBanner ? imgSrc(f.banner) : null,
      logo: imgSrc(f.logo),
      blocks: (f.blocks || []).map(normalizeBlock),
      // Lo marcado como oculto en el administrador no se muestra.
      zones: zones.filter((z) => !z.hidden).map((z) => {
        const areaIds = new Set();
        return {
          id: uniqueId(zoneIds, z.name || 'zona'),
          name: String(z.name || 'Zona'),
          blocks: (z.blocks || []).map(normalizeBlock),
          areas: (z.areas || []).filter((a) => !a.hidden).map((a) => {
            const all = (a.spaces || []).filter((sp) => !sp.hidden).map((sp) => (sp.kind === 'title'
              ? { kind: 'title', title: String(sp.title || '') }
              : { title: String(sp.title || ''), text: String(sp.text || '').trim(), src: imgSrc(sp.image) }));
            return {
              id: uniqueId(areaIds, a.name || 'area'),
              name: String(a.name || 'Área'),
              blocks: (a.blocks || []).map(normalizeBlock),
              note: panel.showNotes ? (String(a.note || '') || defaultNote(String(a.name || 'esta área'))) : '',
              checklist: all,                                          // el checklist incluye todos los espacios visibles
              spaces: panel.showEmpty ? all : all.filter((sp) => sp.kind === 'title' || sp.src), // el panel puede ocultar los pendientes
            };
          }),
        };
      }),
    };
  });
  const intro = { ...DEFAULT_INTRO, ...(raw.intro || {}) };
  intro.banner = imgSrc(raw.intro && raw.intro.banner);
  intro.considerations = { ...DEFAULT_CONSIDERATIONS, ...((raw.intro && raw.intro.considerations) || {}) };
  return { intro, formats, updatedAt: raw.updatedAt || null };
}

function normalizePanel(p) {
  const panel = { showBanner: true, showNotes: true, showEmpty: true, ...(p || {}) };
  const buttons = Array.isArray(panel.buttons) ? panel.buttons : [
    { type: 'back', label: 'Cambiar formato', visible: true },
    { type: 'checklist', label: 'Descarga Checklist', visible: true },
  ];
  panel.buttons = buttons
    .filter((b) => b && b.visible !== false)
    .map((b) => ({ type: b.type, label: String(b.label || ''), url: safeUrl(b.url) }))
    .filter((b) => (b.type === 'back' || b.type === 'checklist' || (b.type === 'link' && b.url)));
  return panel;
}

// Solo enlaces web o rutas relativas (nunca javascript: ni data:).
function safeUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || /^(\/|\.\/|\.\.\/|#)/.test(s)) return s;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;
  return '';
}

function updatedText() {
  return data && data.updatedAt
    ? 'Actualizado el ' + new Date(data.updatedAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
    : '';
}

function showStatus(title, text) {
  $('#home').hidden = true;
  $('#catalog').hidden = true;
  const st = $('#status');
  st.hidden = false;
  st.innerHTML = `<strong>${esc(title)}</strong>${esc(text)}`;
}

/* ---------- Rutas: #/ · #/formato · #/formato/zona · #/formato/zona/area ---------- */
function route({ quiet = false } = {}) {
  if (!data) return;
  const [fid, zid, aid] = location.hash.replace(/^#\/?/, '').split('/').map((x) => decodeURIComponent(x || ''));
  const fmt = fid && data.formats.find((f) => f.id === fid);
  if (!fmt) { lastFormatId = null; renderHome(); if (!quiet) window.scrollTo(0, 0); return; }
  const zone = fmt.zones.find((z) => z.id === zid) || fmt.zones[0] || null;
  const area = zone && zone.areas.find((a) => a.id === aid) || null;
  const firstOpen = lastFormatId !== fmt.id;
  lastFormatId = fmt.id;
  renderFormat(fmt, zone, area);
  if (quiet) return;
  if (firstOpen) window.scrollTo(0, 0);
  else if (area) $('#areaDetail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.addEventListener('hashchange', () => route());

const link = (...parts) => '#/' + parts.map(encodeURIComponent).join('/');

function setHero({ title, sub, color }) {
  const hero = $('#hero');
  hero.style.setProperty('--hero', color || '');
  $('#heroTitle').textContent = title;
  $('#heroSub').textContent = sub || '';
  $('#heroSub').hidden = !sub;
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

  const homeBanner = $('#homeBanner');
  homeBanner.hidden = !t.banner;
  if (t.banner && homeBanner.getAttribute('src') !== t.banner) homeBanner.src = t.banner;

  $('#formats').innerHTML = data.formats.filter((f) => !f.hidden).map((f) => `
    <a class="format" href="${link(f.id)}" style="--fc:${esc(f.color)}">
      ${f.logo ? `<span class="format-logo"><img alt="" src="${esc(f.logo)}"></span>` : ''}
      <strong>${esc(f.name)}</strong>
      <span class="format-sub">${esc(f.subtitle)}</span>
    </a>`).join('');
  $('#updatedHome').textContent = updatedText();
  $('#considerBtn').hidden = !considerationsHaveContent();
  $('#considerBtnLabel').textContent = data.intro.considerations.title;
}

function renderFormat(f, zone, area) {
  document.title = `${data.intro.title} · ${f.name}`;
  setHero({ title: `${data.intro.title} · ${f.name}`, sub: '', color: f.color });
  $('#home').hidden = true;
  $('#status').hidden = true;
  $('#catalog').hidden = false;
  renderToolbar(f);

  const banner = $('#banner');
  banner.hidden = !f.banner;
  if (f.banner && banner.getAttribute('src') !== f.banner) banner.src = f.banner;

  const formatNotes = (pos) => {
    const list = f.blocks.filter((b) => b.pos === pos);
    return list.length ? `<div class="blocks">${list.map(blockHtml).join('')}</div>` : '';
  };
  $('#formatNotesTop').innerHTML = formatNotes('top');
  $('#formatNotesBottom').innerHTML = formatNotes('bottom');

  $('#zones').innerHTML = f.zones.map((z) =>
    `<a class="zone${zone && z.id === zone.id ? ' active' : ''}" href="${link(f.id, z.id)}">${esc(z.name)}</a>`).join('');
  $('#zones').hidden = !f.zones.length;

  const box = $('#zoneBox');
  items = [];
  visible = [];
  if (!zone) {
    box.innerHTML = '<div class="status-inline"><strong>Este formato aún no tiene señalización publicada</strong>Vuelve más tarde.</div>';
    return;
  }
  const notes = (list, pos) => {
    const items = list.filter((b) => b.pos === pos);
    return items.length ? `<div class="blocks">${items.map(blockHtml).join('')}</div>` : '';
  };
  const zoneSub = zone.areas.length ? 'Selecciona un área para consultar su señalización.' : zone.blocks.length ? '' : 'Aún no hay áreas en esta sección.';
  box.innerHTML = `
    <h2 class="zone-title">${esc(zone.name)}</h2>
    ${notes(zone.blocks, 'top')}
    ${zoneSub ? `<p class="zone-sub">${zoneSub}</p>` : ''}
    ${zone.areas.length ? `<div class="areas">${zone.areas.map((a) =>
      `<a class="area${area && a.id === area.id ? ' active' : ''}" href="${link(f.id, zone.id, a.id)}">${esc(a.name)}</a>`).join('')}</div>` : ''}
    ${notes(zone.blocks, 'bottom')}
    ${area ? `<div id="areaDetail" class="area-detail">
      <hr>
      <h3 class="area-title">${esc(area.name)}</h3>
      ${area.note ? `<p class="area-note">${esc(area.note)}</p>` : ''}
      ${notes(area.blocks, 'top')}
      <div class="spaces"></div>
      ${notes(area.blocks, 'bottom')}
    </div>` : ''}`;

  if (!area) return;
  const grid = box.querySelector('.spaces');
  if (!area.spaces.length) {
    grid.outerHTML = area.blocks.length ? '' : '<p class="zone-sub">Esta área aún no tiene señalización registrada.</p>';
    return;
  }
  for (const sp of area.spaces) {
    if (sp.kind === 'title') {
      // Título que agrupa los recuadros que van debajo (ej. Licencias, Letreros).
      grid.insertAdjacentHTML('beforeend', `<h4 class="group-title">${esc(sp.title)}</h4>`);
      continue;
    }
    const card = document.createElement('article');
    card.className = 'space';
    card.innerHTML = `<h4>${esc(sp.title)}</h4><div class="frame">${sp.src
      ? `<button type="button" class="frame-btn" aria-label="Ver ${esc(sp.title)} en grande"><img loading="lazy" alt="${esc(sp.title)}" src="${esc(sp.src)}"></button>`
      : '<span class="pending">Imagen pendiente</span>'}</div>${sp.text ? `<p class="space-text">${esc(sp.text)}</p>` : ''}`;
    if (sp.src) {
      const item = { title: sp.title, section: area.name, src: sp.src };
      items.push(item);
      card.querySelector('.frame-btn').addEventListener('click', () => openLightbox(visible.indexOf(item)));
    }
    grid.appendChild(card);
  }
  visible = items.slice();
}

// Barra del formato: "Cambiar formato" a la izquierda; los demás botones a la derecha.
function renderToolbar(f) {
  const bar = $('#toolbar');
  const html = (b) => {
    if (b.type === 'back') return `<button type="button" class="pill" data-tb="back">← ${esc(b.label || 'Cambiar formato')}</button>`;
    if (b.type === 'checklist') return `<button type="button" class="pill" data-tb="checklist">⤓ ${esc(b.label || 'Descarga Checklist')}</button>`;
    return `<a class="pill" href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.label || 'Enlace')} ↗</a>`;
  };
  const left = f.panel.buttons.filter((b) => b.type === 'back');
  const right = f.panel.buttons.filter((b) => b.type !== 'back');
  bar.innerHTML = `<div class="tb-group">${left.map(html).join('')}</div><div class="tb-group right">${right.map(html).join('')}</div>`;
  bar.hidden = !f.panel.buttons.length;
  bar.onclick = (e) => {
    const t = e.target.closest('[data-tb]');
    if (!t) return;
    if (t.dataset.tb === 'back') location.hash = '#/';
    else if (t.dataset.tb === 'checklist') openChecklist(f);
  };
}

/* ---------- Checklist para imprimir o guardar como PDF ---------- */
function openChecklist(f) {
  const rows = f.zones.filter((z) => z.areas.length).map((z) => `
    <h2>${esc(z.name)}</h2>
    ${z.areas.map((a) => `
      <table>
        <thead><tr><th colspan="5">${esc(a.name)}</th></tr>
          <tr><th class="n">#</th><th class="ph">Referencia</th><th>Señalización</th><th class="c">Cumple</th><th class="c">No cumple</th></tr></thead>
        <tbody>${a.checklist.length ? (() => { let n = 0; return a.checklist.map((s) => (s.kind === 'title'
          ? `<tr class="gt"><td colspan="5">${esc(s.title)}</td></tr>`
          : `<tr>
          <td class="n">${++n}</td>
          <td class="ph">${s.src ? `<img alt="" src="${esc(s.src)}">` : '<span>—</span>'}</td>
          <td>${esc(s.title)}${s.text ? `<div class="t">${esc(s.text)}</div>` : ''}</td><td class="c"><span class="box"></span></td><td class="c"><span class="box"></span></td></tr>`)).join(''); })()
        : '<tr><td colspan="5" class="empty">Sin señalización registrada</td></tr>'}</tbody>
      </table>`).join('')}`).join('');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Checklist de señalización ${esc(f.name)}</title>
<style>
body{font:13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1b2330;margin:24px}
header{border-bottom:4px solid #ffc220;padding-bottom:10px;margin-bottom:12px}
h1{margin:0;font-size:20px;color:#1f4fd6}h2{font-size:16px;color:#1e3a9a;margin:20px 0 6px;break-after:avoid}
.fields{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 24px;margin:10px 0 4px}
.fields div{border-bottom:1px solid #8a94a6;padding-top:16px;font-size:12px;color:#5d6878}
table{width:100%;border-collapse:collapse;margin:6px 0 12px;break-inside:auto}
th,td{border:1px solid #c9d1de;padding:5px 8px;text-align:left;vertical-align:middle}
thead tr:first-child th{background:#eef3ff;color:#1e3a9a;font-size:14px}
tr{break-inside:avoid}.n{width:26px;text-align:center}.c{width:70px;text-align:center}.ph{width:64px}
.ph img{width:56px;height:56px;object-fit:contain;display:block}.box{display:inline-block;width:14px;height:14px;border:1.5px solid #1b2330;border-radius:2px}
.empty{color:#7a8596;text-align:center}.gt td{background:#fffbeb;color:#1e3a9a;font-weight:800;border-left:4px solid #ffc220}.t{margin-top:3px;font-size:11.5px;color:#5d6878;white-space:pre-line}.obs{margin-top:16px}.obs div{border-bottom:1px solid #8a94a6;height:26px}
.actions{margin:14px 0}.actions button{padding:8px 16px;border:0;border-radius:8px;background:#1f4fd6;color:#fff;font-weight:700;cursor:pointer}
@media print{.actions{display:none}body{margin:0}}
</style></head><body>
<header><h1>Checklist de señalización · ${esc(f.name)}</h1><div>${esc(f.subtitle)}${data.updatedAt ? ' · Manual ' + esc(updatedText().toLowerCase()) : ''}</div>
<div class="fields"><div>Tienda:</div><div>Fecha:</div><div>Responsable:</div></div></header>
<div class="actions"><button onclick="window.print()">Imprimir o guardar como PDF</button></div>
${rows || '<p>Este formato aún no tiene señalización publicada.</p>'}
<div class="obs"><strong>Observaciones</strong><div></div><div></div><div></div></div>
</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const w = window.open(url, '_blank');
  if (!w) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Checklist señalización ${f.name}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* ---------- Imagen en grande ---------- */
const lb = $('#lightbox');
const stage = $('#lbStage');
const lbImg = $('#lbImg');

function openLightbox(i) {
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

function step(d) { openLightbox(current + d); }

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

// Botones de la tarjeta de consideraciones.
$('#cnAccept').addEventListener('click', () => {
  writeAck(considerationsHash());
  $('#considerDlg').close();
});
$('#cnClose').addEventListener('click', () => $('#considerDlg').close());
$('#considerDlg').addEventListener('cancel', (e) => { if ($('#considerDlg').dataset.mandatory) e.preventDefault(); });
$('#considerBtn').addEventListener('click', () => openConsiderations({ mandatory: false }));

start();
