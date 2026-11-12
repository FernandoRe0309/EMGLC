<%@ Page Language="C#" %>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Señalización en tu tienda</title>
<meta name="description" content="Manual de señalización autorizada por formato y área de tienda (solo lectura).">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect width=%2232%22 height=%2232%22 rx=%227%22 fill=%22%231f4fd6%22/><rect x=%226%22 y=%2224%22 width=%2220%22 height=%223%22 rx=%221.5%22 fill=%22%23ffc220%22/><rect x=%228%22 y=%227%22 width=%2216%22 height=%2213%22 rx=%222%22 fill=%22%23fff%22/></svg>">
<style>
:root {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --surface-2: #eef1f5;
  --border: #dde2ea;
  --text: #1b2330;
  --muted: #5d6878;
  --brand: #1f4fd6;
  --brand-yellow: #ffc220;
  --info-ink: #1e3a9a;
  --radius: 14px;
  --shadow: 0 1px 2px rgba(16, 24, 40, .05), 0 4px 12px rgba(16, 24, 40, .06);
  color-scheme: light;
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
button, input { font: inherit; color: inherit; }
[hidden] { display: none !important; }
.hidden { display: none !important; }

/* ---------- Encabezado ---------- */
.hero {
  background: var(--hero, var(--brand));
  color: #fff;
  border-bottom: 4px solid var(--brand-yellow);
  box-shadow: 0 2px 8px rgba(16, 24, 40, .12);
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 26px 20px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  position: relative;
}
.hero h1 { margin: 0; font-size: clamp(24px, 3.4vw, 32px); font-weight: 800; letter-spacing: -.01em; }
.hero p { margin: 6px 0 0; font-size: 14px; opacity: .9; }
.hero.compact .hero-inner { max-width: 1400px; justify-content: flex-start; text-align: left; padding: 14px 20px; }
.hero.compact h1 { font-size: 24px; }
.hero.compact p { margin-top: 2px; font-size: 13px; }
.back {
  flex: none;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, .45);
  border-radius: 999px;
  background: rgba(255, 255, 255, .12);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.back:hover { background: rgba(255, 255, 255, .24); }
.back:focus-visible { outline: 2px solid var(--brand-yellow); outline-offset: 2px; }

/* ---------- Portada ---------- */
.home { max-width: 1200px; margin: 0 auto; padding: 36px 20px 24px; display: grid; gap: 22px; }
.note {
  max-width: 1040px;
  width: 100%;
  margin: 0 auto;
  padding: 26px 28px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.note h2 { margin: 0; font-size: 15px; font-weight: 700; }
.note p { margin: 2px 0 0; color: #3b4555; }
.note-icon { width: 22px; height: 22px; flex: none; }
.note-info {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  border: 1.5px solid #9dbbf3;
  background: linear-gradient(135deg, #ffffff 0%, #f2f6ff 45%, #d9e6ff 100%);
}
.note-info .note-icon { color: #2b3445; margin-top: 2px; }
.note-info h2 { color: var(--info-ink); }
.note-warn {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 22px;
  align-items: start;
  border: 1.5px solid #f2c94c;
  background: linear-gradient(135deg, #ffffff 0%, #fffbea 45%, #fff1b8 100%);
}
.note-warn-title { display: flex; align-items: center; gap: 8px; white-space: nowrap; color: #2b2b2b; }
.note-warn ul { margin: 0; padding-left: 18px; color: #3b4555; }
.note-warn li + li { margin-top: 2px; }

.formats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 26px;
  margin-top: 14px;
}
.format {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 190px;
  padding: 28px 18px;
  border-radius: 16px;
  background: var(--fc, var(--brand));
  color: #fff;
  text-decoration: none;
  text-align: center;
  box-shadow: 0 6px 18px rgba(16, 24, 40, .16);
  transition: transform .15s ease, box-shadow .15s ease;
}
.format:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(16, 24, 40, .24); }
.format:focus-visible { outline: 3px solid var(--brand-yellow); outline-offset: 3px; }
.format strong { font-size: 22px; font-weight: 800; letter-spacing: .01em; }
.format-sub { font-size: 13px; opacity: .92; }
.format-count {
  margin-top: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .16);
  font-size: 12px;
}

.updated { margin: 6px 0 0; text-align: center; color: var(--muted); font-size: 12px; }

/* ---------- Catálogo de un formato ---------- */
.toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 4px rgba(16, 24, 40, .05);
}
.toolbar-inner { max-width: 1400px; margin: 0 auto; padding: 10px 20px 0; }
#search {
  width: min(420px, 100%);
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
}
#search:focus { outline: 2px solid var(--brand); outline-offset: 1px; }
.nav { display: flex; gap: 6px; overflow-x: auto; padding: 10px 0; scrollbar-width: thin; }
.nav a {
  flex: none;
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  font-size: 13px;
  white-space: nowrap;
}
.nav a:hover { background: var(--surface-2); }
.nav a.active { background: var(--brand); border-color: var(--brand); color: #fff; }
.nav a .n { opacity: .7; margin-left: 5px; }

.content { max-width: 1400px; margin: 0 auto; padding: 18px 20px 32px; display: grid; gap: 18px; }
.sec {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  scroll-margin-top: 110px;
  overflow: hidden;
}
.sec h2 {
  margin: 0;
  padding: 13px 16px;
  font-size: 17px;
  border-bottom: 1px solid var(--border);
  border-left: 5px solid var(--brand-yellow);
}
.sec h2 small { margin-left: 8px; color: var(--muted); font-weight: 400; font-size: 13px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; padding: 14px; }

.card {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
  cursor: zoom-in;
  text-align: left;
  transition: box-shadow .15s, transform .15s, border-color .15s;
}
.card:hover { box-shadow: 0 8px 20px rgba(16, 24, 40, .14); transform: translateY(-2px); border-color: #b9c6dc; }
.card:focus-visible { outline: 3px solid var(--brand); outline-offset: 2px; }
.card img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: contain; background: var(--surface-2); }
.card span { padding: 8px 10px 10px; font-size: 13px; line-height: 1.3; border-top: 1px solid var(--border); }

.status, .status-inline { padding: 60px 20px; text-align: center; color: var(--muted); grid-column: 1 / -1; }
.status strong, .status-inline strong { display: block; color: var(--text); font-size: 16px; margin-bottom: 4px; }

.foot { padding: 8px 20px 28px; text-align: center; font-size: 12px; }
.foot { color: var(--muted); }
.link-btn { padding: 0; border: 0; background: none; color: var(--brand); text-decoration: underline; cursor: pointer; font-size: inherit; }
.login-btn {
  display: block;
  margin: 18px auto 0;
  padding: 11px 22px;
  border: 0;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(31, 79, 214, .3);
}
.login-btn:hover { filter: brightness(1.08); }
.card.missing img { visibility: hidden; }
.card img:not([src]) { background: linear-gradient(90deg, var(--surface-2), #f7f8fa, var(--surface-2)); }

/* ---------- Lightbox ---------- */
.lightbox {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(8, 10, 14, .94);
  color: #f2f4f7;
  overflow: hidden;
}
.lightbox::backdrop { background: rgba(8, 10, 14, .94); }
.lightbox[open] { display: flex; flex-direction: column; }
.lb-top { display: flex; align-items: center; gap: 6px; padding: 10px 12px; flex: none; }
.lb-text { flex: 1; min-width: 0; display: grid; }
.lb-text strong { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lb-text span { font-size: 12px; color: #aab3c0; }
.lb-btn {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .1);
  color: #fff;
  text-decoration: none;
  font-size: 20px;
  cursor: pointer;
}
.lb-btn:hover { background: rgba(255, 255, 255, .2); }
.lb-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 0 64px 16px;
  touch-action: pan-x pan-y pinch-zoom;
}
.lb-stage img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: zoom-in;
  user-select: none;
  -webkit-user-select: none;
}
.lb-stage.zoomed { align-items: flex-start; justify-content: flex-start; }
.lb-stage.zoomed img { flex: none; height: auto; object-fit: initial; cursor: zoom-out; margin: auto; }
.lb-nav {
  position: absolute;
  top: 50%;
  width: 48px;
  height: 64px;
  transform: translateY(-50%);
  border: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, .1);
  color: #fff;
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
}
.lb-nav:hover { background: rgba(255, 255, 255, .22); }
.lb-nav.prev { left: 8px; }
.lb-nav.next { right: 8px; }
.lb-nav[hidden] { display: none; }


@media (max-width: 640px) {
  .hero-inner { padding: 20px 16px 18px; }
  .hero.compact .hero-inner { padding: 10px 16px; gap: 10px; }
  .hero.compact h1 { font-size: 20px; }
  .back { padding: 6px 10px; font-size: 13px; }
  .home { padding: 20px 16px; gap: 16px; }
  .note { padding: 18px; }
  .note-info { gap: 12px; }
  .note-warn { grid-template-columns: 1fr; }
  .formats { gap: 14px; grid-template-columns: 1fr; }
  .format { min-height: 170px; }
  .toolbar-inner { padding: 10px 16px 0; }
  .content { padding: 12px 16px 24px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; padding: 8px; }
  .lb-stage { padding: 0 0 12px; }
  .lb-nav { top: auto; bottom: 16px; transform: none; width: 52px; height: 52px; border-radius: 50%; background: rgba(0, 0, 0, .5); }
}

</style>
</head>
<body>

<header id="hero" class="hero">
  <div class="hero-inner">
    <button type="button" id="backBtn" class="back" hidden>‹ Formatos</button>
    <div class="hero-text">
      <h1 id="heroTitle">Señalización en tu tienda</h1>
      <p id="heroSub"></p>
    </div>
  </div>
</header>

<main id="home" class="home" hidden>
  <section class="note note-info">
    <svg class="note-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <div>
      <h2 id="guideTitle"></h2>
      <p id="guideText"></p>
    </div>
  </section>

  <section id="impBox" class="note note-warn">
    <h2 class="note-warn-title">
      <svg class="note-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z" fill="#f5b400" stroke="#9a6b00" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 10v5" stroke="#3d2b00" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1.2" fill="#3d2b00"/></svg>
      <span id="impTitle"></span>
    </h2>
    <ul id="impList"></ul>
  </section>

  <div id="formats" class="formats"></div>
  <p id="updatedHome" class="updated"></p>
</main>

<div id="catalog" hidden>
  <div class="toolbar">
    <div class="toolbar-inner">
      <input id="search" type="search" placeholder="Buscar señalización…" autocomplete="off" aria-label="Buscar señalización">
      <nav id="nav" class="nav" aria-label="Áreas de tienda"></nav>
    </div>
  </div>
  <main id="content" class="content" aria-live="polite"></main>
</div>

<div id="status" class="status" hidden></div>

<footer class="foot"><span id="account" hidden><span id="accountName"></span><span id="signOutWrap"> · <button type="button" id="signOut" class="link-btn">Cerrar sesión</button></span></span></footer>

<dialog id="lightbox" class="lightbox" aria-label="Imagen ampliada">
  <div class="lb-top">
    <div class="lb-text">
      <strong id="lbTitle"></strong>
      <span id="lbMeta"></span>
    </div>
    <button type="button" class="lb-btn" id="lbZoom" title="Acercar (Z)" aria-label="Acercar">⤢</button>
    <a class="lb-btn" id="lbOpen" target="_blank" rel="noopener" title="Descargar foto" aria-label="Descargar foto">⤓</a>
    <button type="button" class="lb-btn" id="lbClose" title="Cerrar (Esc)" aria-label="Cerrar">×</button>
  </div>
  <div class="lb-stage" id="lbStage">
    <img id="lbImg" alt="">
  </div>
  <button type="button" class="lb-nav prev" id="lbPrev" aria-label="Anterior">‹</button>
  <button type="button" class="lb-nav next" id="lbNext" aria-label="Siguiente">›</button>
</dialog>

<script>
'use strict';

/* =====================================================================
   Conexión con la carpeta de SharePoint (API REST del mismo sitio).
   La página vive dentro de una carpeta de SharePoint y guarda todo en esa
   MISMA carpeta (tablero.json y las subcarpetas <Formato>/<Área>/).
   Usa la sesión que la persona ya tiene abierta: no hay tokens ni configuración.
   ===================================================================== */

const SP = (() => {
  const DATA_FILE = 'tablero.json';
  const JSON_ACCEPT = 'application/json;odata=nometadata';

  let web = null;       // URL absoluta del sitio que contiene la carpeta
  let rootPath = null;  // ruta de la carpeta, relativa al servidor (decodificada, sin "/" final)
  let account = null;
  let digest = null;
  let digestAt = 0;
  const knownFolders = new Set();

  class SPError extends Error {
    constructor(status, code, message) { super(message); this.status = status; this.code = code; }
  }

  function missingConfig() { return []; }

  // La carpeta de trabajo es la carpeta donde está este archivo .html.
  function folderPathFromPage() {
    if (!/^https?:$/.test(location.protocol)) {
      throw new SPError(0, 'not_sharepoint', 'Abre este archivo desde su carpeta en SharePoint (no desde la computadora).');
    }
    const path = decodeURIComponent(location.pathname);
    return path.slice(0, path.lastIndexOf('/')).replace(/\/+$/, '');
  }

  const enc = (p) => String(p).split('/').map(encodeURIComponent).join('/');
  const lit = (s) => "'" + encodeURIComponent(String(s).replace(/'/g, "''")) + "'";

  async function getDigest(force = false) {
    if (!force && digest && Date.now() - digestAt < 20 * 60 * 1000) return digest;
    const r = await fetch(`${web}/_api/contextinfo`, { method: 'POST', headers: { Accept: JSON_ACCEPT }, credentials: 'same-origin' });
    if (!r.ok) throw new SPError(r.status, 'digest', 'No se pudo validar la sesión de SharePoint.');
    const d = await r.json();
    digest = d.FormDigestValue;
    digestAt = Date.now();
    return digest;
  }

  async function api(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
    for (let attempt = 0; ; attempt++) {
      const h = { Accept: JSON_ACCEPT, ...headers };
      if (method !== 'GET') h['X-RequestDigest'] = await getDigest(attempt > 0);
      const r = await fetch(web + path, { method, headers: h, body, credentials: 'same-origin', cache: 'no-store' });
      if (r.ok) {
        if (raw || r.status === 204) return r;
        const type = r.headers.get('content-type') || '';
        return type.includes('json') ? r.json() : r;
      }
      if ((r.status === 429 || r.status === 503) && attempt < 5) {
        const wait = Number(r.headers.get('retry-after')) || 2 ** attempt;
        await new Promise((res) => setTimeout(res, wait * 1000));
        continue;
      }
      const data = await r.json().catch(() => ({}));
      const msg = (data['odata.error'] && data['odata.error'].message && data['odata.error'].message.value)
        || (data.error && data.error.message && (data.error.message.value || data.error.message))
        || r.statusText;
      // Firma de seguridad vencida: renovar una vez.
      if (r.status === 403 && method !== 'GET' && attempt === 0 && /digest|security validation/i.test(msg)) continue;
      throw new SPError(r.status, '', msg);
    }
  }

  async function init() {
    rootPath = folderPathFromPage();
    // Buscar el sitio (web) que contiene la carpeta, del camino más largo al más corto.
    const segs = rootPath.split('/').filter(Boolean);
    for (let i = segs.length; i >= 0 && !web; i--) {
      const base = location.origin + enc('/' + segs.slice(0, i).join('/')).replace(/\/$/, '');
      try {
        const r = await fetch(`${base}/_api/contextinfo`, { method: 'POST', headers: { Accept: JSON_ACCEPT }, credentials: 'same-origin' });
        if (!r.ok) continue;
        const d = await r.json();
        if (!d.WebFullUrl) continue;
        web = d.WebFullUrl.replace(/\/$/, '');
        digest = d.FormDigestValue;
        digestAt = Date.now();
      } catch { /* probar el siguiente */ }
    }
    if (!web) throw new SPError(0, 'not_sharepoint', 'No se pudo conectar con SharePoint. Este archivo debe abrirse desde su carpeta en SharePoint.');
    try {
      const u = await api('/_api/web/currentuser?$select=Title,Email,LoginName');
      account = { name: u.Title, username: u.Email || u.LoginName };
    } catch {
      account = { name: 'Usuario de SharePoint', username: '' };
    }
    return account;
  }

  const fullPath = (rel) => (rel ? `${rootPath}/${rel}` : rootPath);
  const fileUrl = (rel) => location.origin + enc(fullPath(rel));

  async function folderInfo(rel) {
    try {
      return await api(`/_api/web/GetFolderByServerRelativePath(DecodedUrl=@a1)?$select=Exists,Name,ItemCount&@a1=${lit(fullPath(rel))}`);
    } catch (e) {
      if (e.status === 404) return { Exists: false };
      throw e;
    }
  }

  async function resolveRoot() {
    const info = await folderInfo('');
    if (!info.Exists) throw new SPError(404, 'folder_not_found', 'No se encontró la carpeta de este archivo en SharePoint.');
    return { name: info.Name || rootPath.split('/').pop(), webUrl: fileUrl('') };
  }

  async function readJson() {
    const r = await fetch(`${fileUrl(DATA_FILE)}?t=${Date.now()}`, { credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new SPError(r.status, 'read_failed', 'No se pudo leer tablero.json.');
    return r.json();
  }

  // Contenido de una subcarpeta: Map nombre -> { downloadUrl, isFolder }
  async function list(rel) {
    const out = new Map();
    let d;
    try {
      d = await api(`/_api/web/GetFolderByServerRelativePath(DecodedUrl=@a1)?$select=Exists,Files/Name,Folders/Name&$expand=Files,Folders&@a1=${lit(fullPath(rel))}`);
    } catch (e) {
      if (e.status === 404) return out;
      throw e;
    }
    if (d.Exists === false) return out;
    for (const f of d.Files || []) out.set(f.Name, { downloadUrl: fileUrl(rel ? `${rel}/${f.Name}` : f.Name), isFolder: false });
    for (const f of d.Folders || []) out.set(f.Name, { downloadUrl: null, isFolder: true });
    return out;
  }

  async function ensureFolder(rel) {
    let path = '';
    for (const name of String(rel).split('/').filter(Boolean)) {
      path = path ? `${path}/${name}` : name;
      if (knownFolders.has(path)) continue;
      const info = await folderInfo(path);
      if (!info.Exists) {
        try {
          await api(`/_api/web/Folders/AddUsingPath(DecodedUrl=@a1,Overwrite=false)?@a1=${lit(fullPath(path))}`, { method: 'POST' });
        } catch (e) {
          if (!/exist/i.test(e.message)) throw e;
        }
      }
      knownFolders.add(path);
    }
  }

  async function upload(rel, blob) {
    const cut = rel.lastIndexOf('/');
    const dir = cut === -1 ? '' : rel.slice(0, cut);
    const name = cut === -1 ? rel : rel.slice(cut + 1);
    if (dir) await ensureFolder(dir);
    return api(`/_api/web/GetFolderByServerRelativePath(DecodedUrl=@a1)/Files/AddUsingPath(DecodedUrl=@a2,Overwrite=true)?@a1=${lit(fullPath(dir))}&@a2=${lit(name)}`, {
      method: 'POST',
      body: blob,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }

  // Manda a la papelera de reciclaje un archivo o una carpeta.
  async function remove(rel) {
    for (const kind of ['File', 'Folder']) {
      try {
        await api(`/_api/web/Get${kind}ByServerRelativePath(DecodedUrl=@a1)/recycle()?@a1=${lit(fullPath(rel))}`, { method: 'POST' });
        knownFolders.delete(rel);
        return true;
      } catch (e) {
        if (e.status !== 404 && e.status !== 400) throw e;
      }
    }
    return false;
  }

  // Nombre válido para SharePoint (sin " * : < > ? / \ | ni espacios/puntos al inicio o final).
  function safeName(s) {
    let n = String(s).normalize('NFC').replace(/["*:<>?/\\|#%\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').trim();
    n = n.replace(/^[~.\s]+/, '').replace(/[.\s]+$/, '');
    if (/^(con|prn|aux|nul|com\d|lpt\d|desktop\.ini|_vti_|forms)$/i.test(n) || !n) n = '_' + n;
    return n.slice(0, 120);
  }

  function errorText(e) {
    if (!(e instanceof SPError)) return 'No se pudo conectar con SharePoint. Revisa tu conexión a internet.';
    if (e.status === 0) return e.message;
    if (e.status === 401 || e.status === 403) return 'Tu cuenta no puede modificar esta carpeta de SharePoint.';
    if (e.status === 404) return 'No se encontró la carpeta de este archivo en SharePoint.';
    return `SharePoint respondió con un error (${e.status}): ${e.message}`;
  }

  return {
    folderPath: () => rootPath,
    DATA_FILE,
    canSignOut: false,
    missingConfig,
    init,
    currentAccount: () => account,
    silentToken: async () => true,
    signIn: async () => account,
    signOut: async () => {},
    resolveRoot, readJson, list, upload, remove, ensureFolder, safeName, errorText, SPError,
  };
})();

</script>
<script>
'use strict';

/* Panel de solo lectura: portada con formatos y catálogo por formato.
   Lee tablero.json y las fotos de la misma carpeta de SharePoint donde está este archivo. */

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
  $('#signOutWrap').hidden = !SP.canSignOut;
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

</script>
</body>
</html>
