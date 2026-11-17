'use strict';

/* =====================================================================
   Conexión con la carpeta de SharePoint (API REST del mismo sitio).
   La página vive dentro de una carpeta de SharePoint y guarda todo en esa
   MISMA carpeta (tablero.json y las subcarpetas <Formato>/<Área>/).
   Usa la sesión que la persona ya tiene abierta: no hay tokens ni configuración.
   ===================================================================== */

// Versión de estas páginas. Cambia en cada entrega; si el archivo en SharePoint es más nuevo
// que el que está abierto en el navegador, se avisa para recargar.
const APP_VERSION = '2026.11.17-4';

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

  /* ---------- ¿Hay una versión más nueva de esta página? ---------- */
  let updateAvailable = false;

  async function checkForUpdate() {
    if (!/^https?:$/.test(location.protocol) || updateAvailable) return;
    try {
      const r = await fetch(`${location.pathname}?nocache=${Date.now()}`, { cache: 'no-store', credentials: 'same-origin' });
      if (!r.ok) return;
      const text = await r.text();
      const m = text.match(/<meta name="app-version" content="([^"]+)"/) || text.match(/const APP_VERSION = '([^']+)'/);
      if (m && m[1] !== 'dev' && m[1] !== APP_VERSION) { updateAvailable = true; showUpdateBanner(); }
    } catch { /* sin conexión: se intenta después */ }
  }

  function showUpdateBanner() {
    if (document.getElementById('spUpdateBanner')) return;
    const bar = document.createElement('div');
    bar.id = 'spUpdateBanner';
    bar.setAttribute('role', 'alert');
    bar.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;display:flex;gap:12px;align-items:center;max-width:calc(100vw - 32px);padding:12px 16px;border-radius:12px;background:#1b2330;color:#fff;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)';
    bar.innerHTML = '<span>Hay una versión nueva de esta página.</span>';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Actualizar ahora';
    btn.style.cssText = 'padding:8px 14px;border:0;border-radius:8px;background:#ffc220;color:#1b2330;font:700 14px system-ui,sans-serif;cursor:pointer';
    btn.onclick = () => location.replace(`${location.pathname}?v=${Date.now()}${location.hash}`);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }

  function watchForUpdates() {
    checkForUpdate();
    setInterval(checkForUpdate, 5 * 60 * 1000);
    window.addEventListener('focus', checkForUpdate);
  }

  /* ---------- Registro de lectura (lista de SharePoint) ----------
     Una fila por persona: quién abrió el manual, cuándo y si confirmó las consideraciones.
     La lista la crea el administrador; las tiendas solo agregan/actualizan su propia fila. */
  const LOG_LIST = 'Registro Manual Señalización';
  const VERBOSE = 'application/json;odata=verbose';
  const LOG_FIELDS = [
    '<Field Type="Text" DisplayName="Correo" Name="Correo" StaticName="Correo" />',
    '<Field Type="DateTime" DisplayName="Primera apertura" Name="PrimeraApertura" StaticName="PrimeraApertura" Format="DateTime" />',
    '<Field Type="DateTime" DisplayName="Última apertura" Name="UltimaApertura" StaticName="UltimaApertura" Format="DateTime" />',
    '<Field Type="Number" DisplayName="Aperturas" Name="Aperturas" StaticName="Aperturas" Decimals="0" />',
    '<Field Type="Boolean" DisplayName="Confirmó" Name="Confirmo" StaticName="Confirmo"><Default>0</Default></Field>',
    '<Field Type="DateTime" DisplayName="Fecha de confirmación" Name="FechaConfirmacion" StaticName="FechaConfirmacion" Format="DateTime" />',
    '<Field Type="Text" DisplayName="Versión confirmada" Name="VersionConfirmada" StaticName="VersionConfirmada" />',
  ];
  const verbose = (extra = {}) => ({ Accept: VERBOSE, 'Content-Type': VERBOSE, ...extra });
  const logPath = () => `/_api/web/lists/GetByTitle('${encodeURIComponent(LOG_LIST.replace(/'/g, "''"))}')`;
  let logInfo = null;
  let logDisabled = false;
  let me = null;

  async function getLogInfo(force = false) {
    if (logInfo && !force) return logInfo;
    logInfo = await api(`${logPath()}?$select=Id,ItemCount,ListItemEntityTypeFullName,RootFolder/ServerRelativeUrl&$expand=RootFolder`);
    return logInfo;
  }

  async function getMe() {
    if (!me) me = await api('/_api/web/currentuser?$select=Id,Title,Email,LoginName');
    return me;
  }

  async function logListExists() {
    try { await getLogInfo(true); return true; } catch (e) { if (e.status === 404) return false; throw e; }
  }

  // Crea la lista con sus columnas. Cada quien solo ve y edita su propia fila
  // (quienes administran el sitio ven todas).
  async function createLogList() {
    await api('/_api/web/lists', {
      method: 'POST',
      headers: verbose(),
      body: JSON.stringify({
        __metadata: { type: 'SP.List' }, BaseTemplate: 100, Title: LOG_LIST,
        Description: 'Quién abrió el Manual de Señalización y quién confirmó las Consideraciones Importantes. La llena el manual automáticamente.',
        AllowContentTypes: false, ContentTypesEnabled: false,
      }),
    });
    for (const xml of LOG_FIELDS) {
      await api(`${logPath()}/fields/CreateFieldAsXml`, {
        method: 'POST',
        headers: verbose(),
        body: JSON.stringify({ parameters: { __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' }, SchemaXml: xml, Options: 24 } }),
      });
    }
    await api(logPath(), {
      method: 'POST',
      headers: verbose({ 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' }),
      body: JSON.stringify({ __metadata: { type: 'SP.List' }, ReadSecurity: 2, WriteSecurity: 2 }),
    });
    logDisabled = false;
    return getLogInfo(true);
  }

  // Da "Colaborar" en la lista (solo en ella) al grupo de visitantes del sitio, que es donde
  // normalmente están las tiendas. Requiere poder administrar permisos del sitio.
  async function grantLogPermissions() {
    const info = await getLogInfo(true);
    const visitors = await api('/_api/web/AssociatedVisitorGroup?$select=Id,Title');
    const role = await api('/_api/web/RoleDefinitions/GetByType(3)?$select=Id,Name');
    const lp = `/_api/web/lists(guid'${info.Id}')`;
    await api(`${lp}/breakroleinheritance(copyRoleAssignments=true,clearSubscopes=true)`, { method: 'POST' });
    await api(`${lp}/roleassignments/addroleassignment(principalid=${visitors.Id},roledefid=${role.Id})`, { method: 'POST' });
    return { group: visitors.Title, role: role.Name };
  }

  async function myLogRow() {
    const info = await getLogInfo();
    const u = await getMe();
    const d = await api(`/_api/web/lists(guid'${info.Id}')/items?$select=Id,Aperturas,PrimeraApertura,Confirmo,VersionConfirmada&$filter=AuthorId eq ${u.Id}&$top=1`);
    return (d.value || [])[0] || null;
  }

  async function writeVisit({ confirmed = false, version = '' } = {}) {
    if (logDisabled || !web) return;
    let info;
    try { info = await getLogInfo(); } catch (e) { if (e.status === 404 || e.status === 403) { logDisabled = true; return; } throw e; }
    const u = await getMe();
    const row = await myLogRow();
    const now = new Date().toISOString();
    const body = { __metadata: { type: info.ListItemEntityTypeFullName }, Title: u.Title || u.LoginName || 'Usuario', Correo: u.Email || '', UltimaApertura: now };
    if (confirmed) Object.assign(body, { Confirmo: true, FechaConfirmacion: now, VersionConfirmada: String(version) });
    const items = `/_api/web/lists(guid'${info.Id}')/items`;
    try {
      if (row) {
        if (!confirmed) body.Aperturas = (Number(row.Aperturas) || 0) + 1;
        await api(`${items}(${row.Id})`, { method: 'POST', headers: verbose({ 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' }), body: JSON.stringify(body) });
      } else {
        Object.assign(body, { PrimeraApertura: now, Aperturas: 1 });
        await api(items, { method: 'POST', headers: verbose(), body: JSON.stringify(body) });
      }
    } catch (e) {
      if (e.status === 403 || e.status === 401) logDisabled = true; // sin permiso para escribir: no insistir
      throw e;
    }
  }

  // Las escrituras van en fila, una tras otra; nunca interrumpen el uso del manual.
  let visitChain = Promise.resolve();
  function registerVisit(opts) {
    visitChain = visitChain.then(() => writeVisit(opts)).catch((e) => console.warn('Registro de lectura:', e && e.message));
    return visitChain;
  }

  // ¿Esta persona ya confirmó esta versión (en cualquier computadora)?
  async function hasConfirmed(version) {
    if (logDisabled || !web) return false;
    try { const row = await myLogRow(); return !!(row && row.Confirmo && row.VersionConfirmada === String(version)); } catch { return false; }
  }

  async function readLog() {
    const info = await getLogInfo(true);
    const d = await api(`/_api/web/lists(guid'${info.Id}')/items?$select=Id,Title,Correo,PrimeraApertura,UltimaApertura,Aperturas,Confirmo,FechaConfirmacion,VersionConfirmada&$orderby=UltimaApertura desc&$top=5000`);
    return { rows: d.value || [], listUrl: location.origin + enc(info.RootFolder.ServerRelativeUrl) };
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
    APP_VERSION,
    updateAvailable: () => updateAvailable,
    watchForUpdates,
    checkForUpdate,
    DATA_FILE,
    canSignOut: false,
    missingConfig,
    init,
    currentAccount: () => account,
    silentToken: async () => true,
    signIn: async () => account,
    signOut: async () => {},
    fileUrl, resolveRoot, readJson, list, upload, remove, ensureFolder, safeName, errorText, SPError,
    LOG_LIST, logListExists, createLogList, grantLogPermissions, registerVisit, hasConfirmed, readLog,
  };
})();
