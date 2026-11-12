'use strict';

/* =====================================================================
   Conexión con la carpeta de SharePoint (Microsoft Graph).
   La usan el panel de lectura y el de administrador.
   - Inicio de sesión con la cuenta de la empresa (MSAL, ventana emergente).
   - Todas las rutas son relativas a la carpeta configurada en config.js.
   ===================================================================== */

const SP = (() => {
  const cfg = window.TABLERO_CONFIG || {};
  const ROOT_URL = new URL('.', document.currentScript.src); // carpeta donde están config.js y auth.html
  const GRAPH = 'https://graph.microsoft.com/v1.0';
  const DATA_FILE = 'tablero.json';

  let app = null;
  let account = null;
  let scopes = [];
  let root = null; // { driveId, itemId, webUrl }

  class SPError extends Error {
    constructor(status, code, message) { super(message); this.status = status; this.code = code; }
  }

  function missingConfig() {
    const out = [];
    if (!String(cfg.sharepointFolderUrl || '').trim()) out.push('la URL de la carpeta de SharePoint (sharepointFolderUrl)');
    if (!String(cfg.clientId || '').trim()) out.push('el Client ID de la app (clientId)');
    if (!String(cfg.tenantId || '').trim()) out.push('el Tenant ID (tenantId)');
    return out;
  }

  async function init(scopeList) {
    scopes = scopeList;
    if (!window.msal) throw new SPError(0, 'msal_missing', 'No se cargó la librería de inicio de sesión de Microsoft.');
    app = new msal.PublicClientApplication({
      auth: {
        clientId: cfg.clientId.trim(),
        authority: `https://login.microsoftonline.com/${encodeURIComponent(cfg.tenantId.trim())}`,
        redirectUri: new URL('auth.html', ROOT_URL).href,
      },
      cache: { cacheLocation: 'localStorage' },
    });
    await app.initialize();
    await app.handleRedirectPromise().catch(() => null);
    account = app.getActiveAccount() || app.getAllAccounts()[0] || null;
    if (account) app.setActiveAccount(account);
    return account;
  }

  function currentAccount() { return account; }

  // Intenta obtener un token sin mostrar nada. Lanza error si hace falta iniciar sesión.
  async function silentToken() {
    if (!account) throw new SPError(401, 'login_required', 'Hace falta iniciar sesión.');
    const r = await app.acquireTokenSilent({ scopes, account });
    return r.accessToken;
  }

  // Debe llamarse directamente desde un clic (abre una ventana emergente).
  async function signIn() {
    const r = await app.loginPopup({ scopes, prompt: 'select_account', redirectUri: new URL('auth.html', ROOT_URL).href });
    account = r.account;
    app.setActiveAccount(account);
    return account;
  }

  async function signOut() {
    const acc = account;
    account = null;
    root = null;
    if (acc) await app.logoutPopup({ account: acc, postLogoutRedirectUri: new URL('auth.html', ROOT_URL).href }).catch(() => {});
  }

  async function token() {
    try {
      return await silentToken();
    } catch (e) {
      if (!account) throw e;
      // Consentimiento o sesión vencida: pedir de nuevo en ventana emergente.
      const r = await app.acquireTokenPopup({ scopes, account });
      return r.accessToken;
    }
  }

  async function graph(path, { method = 'GET', body, headers = {}, json = true } = {}) {
    for (let attempt = 0; ; attempt++) {
      const t = await token();
      const r = await fetch(path.startsWith('http') ? path : GRAPH + path, {
        method,
        headers: { Authorization: `Bearer ${t}`, ...headers },
        body,
        cache: 'no-store',
      });
      if (r.ok) {
        if (r.status === 204 || !json) return r;
        return r.json();
      }
      if ((r.status === 429 || r.status === 503 || r.status === 504) && attempt < 5) {
        const wait = Number(r.headers.get('retry-after')) || 2 ** attempt;
        await new Promise((res) => setTimeout(res, wait * 1000));
        continue;
      }
      const data = await r.json().catch(() => ({}));
      const err = data.error || {};
      throw new SPError(r.status, err.code || '', err.message || r.statusText);
    }
  }

  /* ---------- Ubicar la carpeta configurada ---------- */
  function normalizeFolderUrl(raw) {
    const url = new URL(String(raw).trim());
    // Dirección de la vista de carpeta: .../Forms/AllItems.aspx?id=/sites/X/Documentos/Carpeta
    const id = url.searchParams.get('id') || url.searchParams.get('RootFolder');
    if (id && /\.aspx$/i.test(url.pathname)) return url.origin + id;
    url.hash = '';
    return url.href;
  }

  function shareId(u) {
    const b64 = btoa(unescape(encodeURIComponent(u)));
    return 'u!' + b64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
  }

  async function resolveRoot() {
    if (root) return root;
    const raw = String(cfg.sharepointFolderUrl).trim();
    let item = null;
    // 1) Vínculo para compartir o URL directa de la carpeta.
    for (const candidate of [...new Set([raw, normalizeFolderUrl(raw)])]) {
      try {
        item = await graph(`/shares/${shareId(candidate)}/driveItem?$select=id,name,webUrl,folder,parentReference`);
        break;
      } catch (e) { if (e.status === 401) throw e; }
    }
    // 2) Ruta del sitio: https://empresa.sharepoint.com/sites/Sitio/Biblioteca/Carpeta
    if (!item) {
      const url = new URL(normalizeFolderUrl(raw));
      const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
      const sitePath = /^(sites|teams)$/i.test(parts[0] || '') ? `/${parts[0]}/${parts[1]}` : '';
      const site = await graph(`/sites/${url.hostname}:${sitePath || '/'}?$select=id`);
      const drives = (await graph(`/sites/${site.id}/drives?$select=id,webUrl`)).value || [];
      const full = decodeURIComponent(url.pathname).replace(/\/+$/, '');
      const drive = drives
        .map((d) => ({ d, p: decodeURIComponent(new URL(d.webUrl).pathname).replace(/\/+$/, '') }))
        .filter(({ p }) => full === p || full.startsWith(p + '/'))
        .sort((a, b) => b.p.length - a.p.length)[0];
      if (!drive) throw new SPError(404, 'folder_not_found', 'No se encontró la carpeta de SharePoint configurada.');
      const rel = full.slice(drive.p.length).replace(/^\//, '');
      item = await graph(`/drives/${drive.d.id}/${rel ? `root:/${encPath(rel)}` : 'root'}?$select=id,name,webUrl,folder,parentReference`);
    }
    if (!item.folder) throw new SPError(400, 'not_a_folder', 'La URL configurada no es una carpeta.');
    root = { driveId: item.parentReference.driveId, itemId: item.id, webUrl: item.webUrl, name: item.name };
    return root;
  }

  /* ---------- Rutas dentro de la carpeta ---------- */
  function encPath(p) { return String(p).split('/').map(encodeURIComponent).join('/'); }

  async function itemPath(rel, suffix = '') {
    const r = await resolveRoot();
    return `/drives/${r.driveId}/items/${r.itemId}:/${encPath(rel)}:${suffix}`;
  }

  // Nombre válido para SharePoint (sin " * : < > ? / \ | ni espacios/puntos al final).
  function safeName(s) {
    let n = String(s).normalize('NFC').replace(/["*:<>?/\\|#%\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').trim();
    n = n.replace(/^[~.\s]+/, '').replace(/[.\s]+$/, '');
    if (/^(con|prn|aux|nul|com\d|lpt\d|desktop\.ini|_vti_)$/i.test(n) || !n) n = '_' + n;
    return n.slice(0, 120);
  }

  async function downloadUrl(rel) {
    try {
      const it = await graph(await itemPath(rel, '?$select=id,@microsoft.graph.downloadUrl'));
      return it['@microsoft.graph.downloadUrl'] || null;
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async function readJson() {
    const url = await downloadUrl(DATA_FILE);
    if (!url) return null;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new SPError(r.status, 'download_failed', 'No se pudo leer tablero.json.');
    return r.json();
  }

  // Lista una carpeta: Map nombre -> { id, downloadUrl, isFolder }
  async function list(rel) {
    const out = new Map();
    let next;
    try {
      next = rel
        ? await itemPath(rel, '/children?$select=id,name,folder,file,@microsoft.graph.downloadUrl&$top=999')
        : `/drives/${(await resolveRoot()).driveId}/items/${root.itemId}/children?$select=id,name,folder,file,@microsoft.graph.downloadUrl&$top=999`;
    } catch (e) { throw e; }
    while (next) {
      let page;
      try { page = await graph(next); } catch (e) { if (e.status === 404) return out; throw e; }
      for (const it of page.value || []) out.set(it.name, { id: it.id, downloadUrl: it['@microsoft.graph.downloadUrl'] || null, isFolder: !!it.folder });
      next = page['@odata.nextLink'] || null;
    }
    return out;
  }

  const knownFolders = new Set();
  async function ensureFolder(rel) {
    const r = await resolveRoot();
    const parts = String(rel).split('/').filter(Boolean);
    let parentPath = '';
    for (const name of parts) {
      const path = parentPath ? `${parentPath}/${name}` : name;
      if (!knownFolders.has(path)) {
        const parent = parentPath ? await itemPath(parentPath, '/children') : `/drives/${r.driveId}/items/${r.itemId}/children`;
        try {
          await graph(parent, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' }),
          });
        } catch (e) {
          if (e.status !== 409) throw e; // ya existe
        }
        knownFolders.add(path);
      }
      parentPath = path;
    }
  }

  async function upload(rel, blob, contentType) {
    const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    if (dir) await ensureFolder(dir);
    return graph(await itemPath(rel, '/content'), {
      method: 'PUT',
      headers: { 'Content-Type': contentType || blob.type || 'application/octet-stream' },
      body: blob,
    });
  }

  async function remove(rel) {
    try {
      await graph(await itemPath(rel), { method: 'DELETE', json: false });
      knownFolders.delete(rel);
      return true;
    } catch (e) {
      if (e.status === 404) return false;
      throw e;
    }
  }

  function errorText(e) {
    if (e && /popup_window_error|empty_window_error/i.test(e.errorCode || e.message || '')) return 'El navegador bloqueó la ventana para iniciar sesión. Permite ventanas emergentes para esta página.';
    if (e && /user_cancelled/i.test(e.errorCode || '')) return 'Se canceló el inicio de sesión.';
    if (e && /consent|AADSTS65001/i.test(e.message || '')) return 'Falta que TI apruebe los permisos de la app (consentimiento de administrador).';
    if (!(e instanceof SPError)) return 'No se pudo conectar con SharePoint. Revisa tu conexión a internet.';
    if (e.status === 401) return 'Tu sesión venció. Vuelve a iniciar sesión.';
    if (e.status === 403) return 'Tu cuenta no tiene permiso en la carpeta de SharePoint.';
    if (e.status === 404) return 'No se encontró la carpeta de SharePoint configurada en config.js.';
    return `SharePoint respondió con un error (${e.status}): ${e.message}`;
  }

  return {
    config: cfg, DATA_FILE, missingConfig, init, currentAccount, silentToken, signIn, signOut,
    resolveRoot, readJson, list, upload, remove, ensureFolder, safeName, errorText, SPError,
  };
})();
