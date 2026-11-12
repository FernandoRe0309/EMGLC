<%@ Page Language="C#" %>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin de Señalización</title>
<meta name="description" content="Tablero para acomodar las imágenes del catálogo de señalización por área de tienda, arrastrando y soltando.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect x=%223%22 y=%223%22 width=%2211%22 height=%2211%22 rx=%222%22 fill=%22%232563eb%22/><rect x=%2218%22 y=%223%22 width=%2211%22 height=%2211%22 rx=%222%22 fill=%22%2393c5fd%22/><rect x=%223%22 y=%2218%22 width=%2211%22 height=%2211%22 rx=%222%22 fill=%22%2393c5fd%22/><rect x=%2218%22 y=%2218%22 width=%2211%22 height=%2211%22 rx=%222%22 fill=%22%232563eb%22/></svg>">
<meta name="robots" content="noindex">
<style>
:root {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --surface-2: #eef1f5;
  --border: #d8dde5;
  --text: #1b2330;
  --muted: #5d6878;
  --accent: #1f4fd6;
  --accent-soft: #dbe7ff;
  --accent-text: #ffffff;
  --danger: #c62828;
  --drop: #e6f0ff;
  --shadow: 0 1px 2px rgba(16, 24, 40, .06), 0 2px 6px rgba(16, 24, 40, .06);
  --shadow-lg: 0 12px 32px rgba(16, 24, 40, .22);
  --radius: 10px;
  --header-h: 64px;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #11151c;
    --surface: #1a2029;
    --surface-2: #232a35;
    --border: #2f3846;
    --text: #e6eaf0;
    --muted: #9aa5b5;
    --accent: #5b8dff;
    --accent-soft: #23345a;
    --accent-text: #0b1020;
    --danger: #ff6b6b;
    --drop: #1d2c4a;
    --shadow: 0 1px 2px rgba(0, 0, 0, .4);
    --shadow-lg: 0 12px 32px rgba(0, 0, 0, .6);
    color-scheme: dark;
  }
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

html, body { margin: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font: 14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

button, input, select { font: inherit; color: inherit; }

.muted { color: var(--muted); }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; word-break: break-all; }

/* ---------- Top bar ---------- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-height: var(--header-h);
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.brand h1 { margin: 0; font-size: 18px; letter-spacing: -.01em; }
.stats { margin: 0; color: var(--muted); font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  list-style: none;
}
.btn:hover { background: var(--surface-2); }
.btn:focus-visible, .lib-item:focus-visible, .chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
.btn-primary:hover { background: var(--accent); filter: brightness(1.08); }
.btn.danger, .menu-panel .danger { color: var(--danger); }

.menu { position: relative; }
.menu summary::-webkit-details-marker { display: none; }
.menu-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 260px;
  padding: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}
.menu-panel button {
  text-align: left;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;
}
.menu-panel button:hover { background: var(--surface-2); }
.menu-panel hr { border: 0; border-top: 1px solid var(--border); margin: 4px 0; width: 100%; }

/* ---------- Layout ---------- */
.layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  align-items: start;
}

/* ---------- Library ---------- */
.library {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
  transition: background .15s;
}
.library.drop-remove { background: color-mix(in srgb, var(--danger) 12%, var(--surface)); }
.library.drop-files { background: var(--drop); }
.library-head { padding: 12px 14px 8px; border-bottom: 1px solid var(--border); display: grid; gap: 8px; }
.library-head h2 { margin: 0; font-size: 15px; }
.library-head input[type="search"] {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}
.check { display: flex; gap: 6px; align-items: center; color: var(--muted); font-size: 13px; }
.library-list { flex: 1; overflow-y: auto; padding: 6px 8px 12px; }
.library-foot { margin: 0; padding: 8px 14px; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; }

.empty-lib { padding: 24px 12px; color: var(--muted); text-align: center; }
.empty-lib strong { display: block; color: var(--text); margin-bottom: 4px; }

.folder { margin-top: 6px; }
.folder-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 6px;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  font-weight: 600;
  text-align: left;
}
.folder-head:hover { background: var(--surface-2); }
.folder-head .caret { width: 12px; color: var(--muted); transition: transform .15s; }
.folder.collapsed .caret { transform: rotate(-90deg); }
.folder.collapsed .folder-items { display: none; }
.folder-head .count { margin-left: auto; color: var(--muted); font-weight: 400; font-size: 12px; }

.folder-items { display: grid; gap: 4px; padding: 2px 0 4px 8px; }

.lib-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.lib-item:hover { background: var(--surface-2); border-color: var(--border); }
.lib-item img {
  width: 44px;
  height: 44px;
  flex: none;
  object-fit: cover;
  border-radius: 6px;
  background: var(--surface-2);
  pointer-events: none;
}
.lib-item .name { flex: 1; min-width: 0; font-size: 13px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.lib-item .badge {
  flex: none;
  min-width: 22px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}
.lib-item.placed .name { color: var(--muted); }

/* ---------- Board ---------- */
.board-wrap { padding: 0 20px 40px; min-width: 0; }

.section-nav {
  position: sticky;
  top: var(--header-h);
  z-index: 10;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 10px 0;
  background: var(--bg);
  scrollbar-width: thin;
}
.chip {
  flex: none;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.chip .n { color: var(--muted); margin-left: 4px; }
.chip.empty { color: var(--muted); }
.chip.drop-hover { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
.chip.drop-hover .n { color: inherit; }

.board { display: grid; gap: 16px; }

.sec {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  scroll-margin-top: calc(var(--header-h) + 56px);
}
.sec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  border-radius: var(--radius) var(--radius) 0 0;
}
.sec.collapsed .sec-head { border-bottom: 0; }
.sec-head.drop-hover { background: var(--drop); }
.sec-title {
  margin: 0;
  font-size: 16px;
  padding: 2px 6px;
  border-radius: 6px;
  outline: none;
  min-width: 40px;
}
.sec-title:hover { background: var(--surface-2); }
.sec-title:focus { background: var(--surface-2); box-shadow: 0 0 0 2px var(--accent); }
.sec-count { color: var(--muted); font-size: 12px; white-space: nowrap; }
.sec-tools { margin-left: auto; display: flex; gap: 2px; }
.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 15px;
}
.icon-btn:hover { background: var(--surface-2); color: var(--text); }
.icon-btn.danger:hover { color: var(--danger); }

.dropzone {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  min-height: 120px;
  padding: 12px;
  border-radius: 0 0 var(--radius) var(--radius);
  transition: background .12s;
}
.sec.collapsed .dropzone { display: none; }
.dropzone.drop-hover { background: var(--drop); }
.dropzone .hint {
  grid-column: 1 / -1;
  align-self: center;
  justify-self: center;
  color: var(--muted);
  font-size: 13px;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  width: 100%;
  text-align: center;
}
.dropzone.drop-hover .hint { display: none; }

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  overflow: hidden;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.card:hover { box-shadow: var(--shadow); }
.card .thumb {
  aspect-ratio: 3 / 4;
  background: var(--surface-2);
  display: grid;
  place-items: center;
}
.card .thumb img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
.card .missing { padding: 10px; color: var(--danger); font-size: 11px; text-align: center; word-break: break-word; }
.card-title {
  padding: 6px 8px 8px;
  font-size: 12px;
  line-height: 1.3;
  outline: none;
  cursor: text;
  user-select: text;
  -webkit-user-select: text;
  border-top: 1px solid var(--border);
}
.card-title:focus { background: var(--surface-2); box-shadow: inset 0 0 0 2px var(--accent); }
.card .remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, .55);
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  opacity: 0;
  transition: opacity .12s;
}
.card:hover .remove, .card:focus-within .remove { opacity: 1; }
@media (hover: none) { .card .remove { opacity: 1; } }
.card.drag-source { display: none; }

.placeholder {
  border: 2px dashed var(--accent);
  border-radius: 8px;
  background: var(--accent-soft);
  min-height: 180px;
}

.add-section { margin-top: 16px; }

/* ---------- Drag ghost ---------- */
body.dragging, body.dragging * { cursor: grabbing !important; }
body.dragging { user-select: none; -webkit-user-select: none; }
.ghost {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 120px;
  pointer-events: none;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  transform: translate(-50%, -50%) rotate(-2deg);
  opacity: .95;
}
.ghost img { display: block; width: 100%; height: 120px; object-fit: cover; }
.ghost span { display: block; padding: 4px 6px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ---------- Viewer ---------- */
.viewer {
  width: min(960px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lg);
}
.viewer::backdrop { background: rgba(10, 14, 20, .6); }
.viewer-inner { position: relative; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); }
.viewer-img { background: var(--surface-2); display: grid; place-items: center; min-height: 300px; }
.viewer-img img { max-width: 100%; max-height: calc(100vh - 40px); object-fit: contain; }
.viewer-info { padding: 20px; display: flex; flex-direction: column; gap: 8px; }
.viewer-info h3 { margin: 0 32px 0 0; font-size: 17px; }
.viewer-actions { margin-top: auto; display: grid; gap: 8px; }
.viewer-actions select { padding: 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); }
.viewer-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: var(--surface-2);
  cursor: pointer;
  font-size: 18px;
  z-index: 1;
}

/* ---------- Toast ---------- */
.toast {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 200;
  transform: translate(-50%, 20px);
  max-width: calc(100vw - 32px);
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--text);
  color: var(--bg);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s, transform .2s;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }

/* ---------- Responsive ---------- */
@media (max-width: 860px) {
  :root { --header-h: 0px; }
  .topbar { position: static; }
  .layout { grid-template-columns: 1fr; }
  .library {
    position: static;
    height: auto;
    max-height: 45vh;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
  .board-wrap { padding: 0 16px 32px; }
  .section-nav { top: 0; }
  .dropzone { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; padding: 8px; }
  .viewer-inner { grid-template-columns: 1fr; }
  .viewer-img img { max-height: 50vh; }
}

/* ---------- Admin: publicación ---------- */
.tag {
  display: inline-block;
  vertical-align: middle;
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .02em;
}
a.btn { text-decoration: none; color: inherit; }
.btn[disabled] { opacity: .6; cursor: progress; }
.publish-state { font-size: 12px; color: var(--muted); max-width: 260px; }
.publish-state.dirty { color: #b45309; font-weight: 600; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .publish-state.dirty { color: #fbbf24; } }
.publish-state.busy { color: var(--accent); font-weight: 600; }

.settings {
  width: min(620px, calc(100vw - 32px));
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lg);
}
.settings::backdrop { background: rgba(10, 14, 20, .6); }
.settings-inner { padding: 20px; display: grid; gap: 12px; }
.settings h3 { margin: 0; font-size: 17px; }
.settings p { margin: 0; }
.settings label { display: grid; gap: 4px; font-size: 13px; font-weight: 600; }
.settings input {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  font-weight: 400;
}
.field-row { display: grid; grid-template-columns: 1fr 1fr 110px; gap: 10px; }
.help { font-size: 13px; color: var(--muted); }
.help summary { cursor: pointer; color: var(--accent); }
.help ol { padding-left: 20px; margin: 8px 0; }
.cfg-result { font-size: 13px; min-height: 1em; }
.cfg-result.ok { color: #15803d; }
.cfg-result.err { color: var(--danger); }
.settings-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.settings-actions .spacer { flex: 1; }
@media (max-width: 560px) { .field-row { grid-template-columns: 1fr; } }

/* ---------- Tema corporativo: barra azul con borde amarillo ---------- */
:root {
  --brand: #1f4fd6;
  --brand-yellow: #ffc220;
  --on-brand: #ffffff;
}
.topbar {
  background: var(--brand);
  color: var(--on-brand);
  border-bottom: 4px solid var(--brand-yellow);
  box-shadow: 0 2px 8px rgba(16, 24, 40, .15);
}
.topbar .stats { color: rgba(255, 255, 255, .82); }
.topbar .btn {
  background: rgba(255, 255, 255, .12);
  border-color: rgba(255, 255, 255, .35);
  color: var(--on-brand);
}
.topbar .btn:hover { background: rgba(255, 255, 255, .22); }
.topbar .btn-primary {
  background: var(--brand-yellow);
  border-color: var(--brand-yellow);
  color: #1b2330;
  font-weight: 700;
}
.topbar .btn-primary:hover { background: var(--brand-yellow); filter: brightness(1.05); }
.topbar .btn:focus-visible { outline-color: var(--brand-yellow); }
.topbar .tag { background: var(--brand-yellow); color: #1b2330; }
.topbar .publish-state { color: rgba(255, 255, 255, .85); }
.topbar .publish-state.dirty, .topbar .publish-state.busy { color: var(--brand-yellow); }
.topbar .menu-panel { color: var(--text); }
.topbar .menu-panel .danger { color: var(--danger); }

/* ---------- Pestañas de formato ---------- */
.format-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
  padding: 14px 0 4px;
}
.ftab {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
  padding: 8px 14px 8px 8px;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  text-align: left;
}
.ftab:hover { border-color: var(--fc); }
.ftab.active { border-color: var(--fc); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fc) 22%, transparent); }
.ftab-mark {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--fc);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
}
.ftab-mark img { width: 30px; height: 30px; object-fit: contain; }
.ftab-text { display: grid; line-height: 1.2; }
.ftab-text strong { font-size: 15px; }
.ftab-text small { color: var(--muted); font-size: 12px; }
.ftab-tool {
  padding: 8px 12px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: none;
  color: var(--muted);
  cursor: pointer;
}
.ftab-tool:hover { color: var(--text); border-color: var(--accent); background: var(--surface); }

/* ---------- Diálogos de formato y portada ---------- */
.settings textarea, .settings select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  font: inherit;
  font-weight: 400;
  resize: vertical;
}
.settings input[type="color"] { height: 40px; padding: 3px; cursor: pointer; }
.small { font-size: 12px; }
.fmt-grid { display: grid; grid-template-columns: 1fr 220px; gap: 18px; }
.fmt-fields { display: grid; gap: 10px; }
.fmt-preview {
  margin-top: 6px;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 20px 12px;
  border-radius: 16px;
  background: var(--fc, var(--brand));
  color: #fff;
  text-align: center;
  box-shadow: 0 6px 16px rgba(16, 24, 40, .18);
}
.fmt-preview .fp-logo { height: 64px; display: grid; place-items: center; margin-bottom: 8px; }
.fmt-preview .fp-logo img { max-height: 64px; max-width: 120px; object-fit: contain; }
.fmt-preview strong { font-size: 20px; }
.fmt-preview small { font-size: 12px; opacity: .9; }
@media (max-width: 560px) { .fmt-grid { grid-template-columns: 1fr; } }

/* ---------- Cuenta y conexión ---------- */
.topbar .btn.account { max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.topbar .btn.account.signed::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #4ade80; flex: none; }
.conn-row { display: grid; grid-template-columns: 70px 1fr; gap: 10px; font-size: 13px; align-items: baseline; }
.settings code { font-size: 12px; background: var(--surface-2); padding: 1px 5px; border-radius: 4px; }

</style>
</head>
<body>

<header class="topbar">
  <div class="brand">
    <h1>Señalización en tu tienda <span class="tag">Administrador</span></h1>
    <p id="stats" class="stats">Sin imágenes cargadas</p>
  </div>
  <div class="actions">
    <span id="publishState" class="publish-state"></span>
    <button id="publishBtn" class="btn btn-primary" type="button" title="Guarda las fotos y la distribución en la carpeta de SharePoint para que se vean en el panel de lectura">Publicar</button>
    <button id="authBtn" class="btn account" type="button">Conectando…</button>
    <label class="btn" title="Elige la carpeta Señalización completa; se conservan las subcarpetas">
      Cargar carpeta
      <input id="folderInput" type="file" webkitdirectory directory multiple hidden>
    </label>
    <label class="btn" title="Elige una o varias imágenes sueltas">
      Cargar imágenes
      <input id="filesInput" type="file" accept="image/*" multiple hidden>
    </label>
    <button id="exportHtmlBtn" class="btn" type="button" title="Descarga un catálogo HTML con las imágenes incrustadas">Exportar catálogo</button>
    <button id="saveJsonBtn" class="btn" type="button" title="Guarda la distribución (sin imágenes) en un archivo .json">Guardar tablero</button>
    <label class="btn" title="Abre un tablero guardado (.json)">
      Abrir tablero
      <input id="openJsonInput" type="file" accept="application/json,.json" hidden>
    </label>
    <details class="menu">
      <summary class="btn" aria-label="Más opciones">Más ▾</summary>
      <div class="menu-panel">
        <button type="button" data-action="connection">Carpeta de SharePoint</button>
        <button type="button" data-action="load-published">Cargar lo publicado (descarta cambios locales)</button>
        <hr>
        <button type="button" data-action="auto-place">Colocar por carpeta (nombre exacto)</button>
        <button type="button" data-action="sections-from-folders">Crear secciones desde carpetas</button>
        <button type="button" data-action="add-section">Agregar sección</button>
        <hr>
        <button type="button" data-action="clear-board">Vaciar este formato</button>
        <button type="button" data-action="reset-sections">Restablecer secciones de este formato</button>
        <button type="button" data-action="clear-library" class="danger">Borrar biblioteca de imágenes</button>
      </div>
    </details>
  </div>
</header>

<div class="layout">
  <aside id="library" class="library" aria-label="Biblioteca de imágenes">
    <div class="library-head">
      <h2>Biblioteca</h2>
      <input id="searchInput" type="search" placeholder="Buscar imagen o carpeta…" autocomplete="off">
      <label class="check"><input id="onlyUnplaced" type="checkbox"> Solo sin colocar en este formato</label>
    </div>
    <div id="libraryList" class="library-list"></div>
    <p class="library-foot">Arrastra una imagen a una sección. Suelta una tarjeta aquí para quitarla del tablero.</p>
  </aside>

  <main class="board-wrap">
    <div id="formatTabs" class="format-tabs" role="tablist" aria-label="Formatos"></div>
    <nav id="sectionNav" class="section-nav" aria-label="Secciones"></nav>
    <div id="board" class="board"></div>
    <button id="addSectionBtn" class="btn add-section" type="button">+ Agregar sección</button>
  </main>
</div>

<dialog id="viewer" class="viewer">
  <form method="dialog" class="viewer-inner">
    <button class="viewer-close" value="close" aria-label="Cerrar">×</button>
    <div class="viewer-img"><img id="viewerImg" alt=""></div>
    <div class="viewer-info">
      <h3 id="viewerTitle"></h3>
      <p id="viewerPath" class="muted mono"></p>
      <div class="viewer-actions">
        <select id="viewerSection" aria-label="Sección"></select>
        <button id="viewerPrimary" class="btn btn-primary" type="button">Agregar</button>
        <button id="viewerRemove" class="btn danger" type="button">Quitar del tablero</button>
      </div>
    </div>
  </form>
</dialog>

<dialog id="connection" class="settings">
  <form method="dialog" class="settings-inner">
    <h3>Carpeta de SharePoint</h3>
    <p class="muted">Las fotos y la distribución se guardan en la misma carpeta de SharePoint donde está este archivo.</p>
    <div class="conn-row"><span class="muted">Carpeta</span><span id="connFolder" class="mono"></span></div>
    <div class="conn-row"><span class="muted">Cuenta</span><span id="connAccount"></span></div>
    <p class="muted small">Dentro de la carpeta se crean solas las subcarpetas <em>Formato/Área</em> según dónde coloques cada foto, y el archivo <em>tablero.json</em>. </p>
    <p id="connResult" class="cfg-result" role="status"></p>
    <div class="settings-actions">
      <button type="button" id="connSignOut" class="btn danger">Cerrar sesión</button>
      <span class="spacer"></span>
      <button type="button" id="connTest" class="btn">Probar conexión</button>
      <button value="close" class="btn btn-primary">Cerrar</button>
    </div>
  </form>
</dialog>

<dialog id="formatDlg" class="settings">
  <form method="dialog" class="settings-inner" id="formatForm">
    <h3 id="formatDlgTitle">Editar formato</h3>
    <div class="fmt-grid">
      <div class="fmt-fields">
        <label>Nombre<input id="fmtName" required maxlength="40" autocomplete="off" placeholder="W2"></label>
        <label>Subtítulo<input id="fmtSubtitle" maxlength="80" autocomplete="off" placeholder="Señalización Walmart"></label>
        <label>Color de la tarjeta<input id="fmtColor" type="color" value="#1f4fd6"></label>
      </div>
      <div>
        <p class="muted small">Así se verá en la portada:</p>
        <div id="fmtPreview" class="fmt-preview"></div>
      </div>
    </div>
    <div class="settings-actions">
      <button type="button" id="fmtDelete" class="btn danger">Eliminar formato</button>
      <span class="spacer"></span>
      <button value="cancel" class="btn" formnovalidate>Cancelar</button>
      <button type="submit" class="btn btn-primary" value="save">Guardar</button>
    </div>
  </form>
</dialog>

<dialog id="introDlg" class="settings">
  <form method="dialog" class="settings-inner" id="introForm">
    <h3>Textos de la portada</h3>
    <label>Título<input id="inTitle" maxlength="80" autocomplete="off"></label>
    <label>Subtítulo<input id="inSubtitle" maxlength="120" autocomplete="off"></label>
    <label>Título del aviso azul<input id="inGuideTitle" maxlength="80" autocomplete="off"></label>
    <label>Texto del aviso azul<textarea id="inGuide" rows="3"></textarea></label>
    <label>Título del aviso amarillo<input id="inImportantTitle" maxlength="80" autocomplete="off"></label>
    <label>Puntos del aviso amarillo <span class="muted">(uno por renglón)</span><textarea id="inImportant" rows="4"></textarea></label>
    <div class="settings-actions">
      <button type="button" id="introReset" class="btn">Restablecer textos</button>
      <span class="spacer"></span>
      <button value="cancel" class="btn" formnovalidate>Cancelar</button>
      <button type="submit" class="btn btn-primary" value="save">Guardar</button>
    </div>
  </form>
</dialog>

<div id="toast" class="toast" role="status" aria-live="polite"></div>

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

// Publicación en SharePoint: <carpeta>/<Formato>/<Área>/<foto>.jpg + tablero.json
const MAX_SIDE = 2000;      // px del lado mayor tras optimizar
const JPEG_QUALITY = 0.85;
const SCOPES = [];

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

// state: todo lo que se guarda y publica. board: el formato que se está editando.
let state = null;
let board = null;
const ui = {
  query: '',
  onlyUnplaced: false,
  collapsedFolders: new Set(),
};

function newSections() {
  return DEFAULT_SECTIONS.map((name) => ({ id: uid(), name, collapsed: false, cards: [] }));
}

function newFormat({ name = 'Nuevo formato', subtitle = '', color = '#1f4fd6', sections } = {}) {
  return { id: uid(), name, subtitle, color, sections: sections || newSections() };
}

function defaultState() {
  const formats = DEFAULT_FORMATS.map((f) => newFormat(f));
  return { dirty: false, publishedAt: null, intro: structuredClone(DEFAULT_INTRO), formats, activeId: formats[0].id };
}

// Acepta el estado guardado actual o el de versiones anteriores (un solo tablero).
function normalizeState(saved) {
  if (!saved) return null;
  if (Array.isArray(saved.formats) && saved.formats.length) {
    saved.intro = { ...structuredClone(DEFAULT_INTRO), ...(saved.intro || {}) };
    return saved;
  }
  if (Array.isArray(saved.sections)) {
    const st = defaultState();
    st.formats[0].sections = saved.sections;
    st.dirty = !!saved.dirty;
    st.publishedAt = saved.publishedAt || null;
    return st;
  }
  return null;
}

function setActiveFormat(id) {
  board = state.formats.find((f) => f.id === id) || state.formats[0];
  state.activeId = board.id;
}

function allCards() {
  return state.formats.flatMap((f) => f.sections.flatMap((s) => s.cards));
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
    ? `${board.name}: ${cards} tarjetas en ${board.sections.length} secciones · Biblioteca: ${total} imágenes, ${placed} colocadas en ${board.name}`
    : `${board.name}: ${board.sections.length} secciones · Sin imágenes cargadas`;
}

function renderFormatTabs() {
  const el = $('#formatTabs');
  el.innerHTML = state.formats.map((f) => {
    const n = f.sections.reduce((k, s) => k + s.cards.length, 0);
    return `<button type="button" class="ftab${f.id === board.id ? ' active' : ''}" data-format="${f.id}" style="--fc:${escapeHtml(f.color)}">
      <span class="ftab-mark">${escapeHtml(f.name.slice(0, 3))}</span>
      <span class="ftab-text"><strong>${escapeHtml(f.name)}</strong><small>${n} ${n === 1 ? 'tarjeta' : 'tarjetas'}</small></span>
    </button>`;
  }).join('') + `<button type="button" class="ftab-tool" data-format-action="edit" title="Editar nombre, subtítulo y color de ${escapeHtml(board.name)}">⚙ Editar formato</button>
    <button type="button" class="ftab-tool" data-format-action="add" title="Agregar un formato">+ Formato</button>
    <button type="button" class="ftab-tool" data-format-action="intro" title="Editar los textos de la portada">✎ Textos de portada</button>`;
}

function render() {
  const counts = placementCounts();
  renderFormatTabs();
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
<title>Catálogo de Señalización ${escapeHtml(board.name)}</title>
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
<header><h1>Catálogo de Señalización ${escapeHtml(board.name)}</h1><p>Generado el ${escapeHtml(date)}</p>
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

  download(`catalogo-senalizacion-${norm(board.name).replace(/[^a-z0-9]+/g, '-')}.html`, new Blob([html], { type: 'text/html' }));
  toast(missing ? `Catálogo exportado. ${missing} tarjetas sin imagen se omitieron.` : 'Catálogo exportado.', 4000);
}

function sectionsToJson(sections) {
  return sections.map((s) => ({ name: s.name, cards: s.cards.map((c) => ({ path: c.imageId, title: c.title })) }));
}

function sectionsFromJson(sections) {
  return (Array.isArray(sections) ? sections : []).map((s) => ({
    id: uid(),
    name: String(s.name || 'Sección'),
    collapsed: false,
    cards: (Array.isArray(s.cards) ? s.cards : []).filter((c) => c && c.path).map((c) => ({
      id: uid(), imageId: String(c.path), title: String(c.title ?? titleFromName(String(c.path).split('/').pop())),
    })),
  }));
}

function saveJson() {
  const data = {
    app: 'tablero-senalizacion',
    version: 2,
    savedAt: new Date().toISOString(),
    intro: state.intro,
    formats: state.formats.map((f) => ({ name: f.name, subtitle: f.subtitle, color: f.color, sections: sectionsToJson(f.sections) })),
  };
  const stamp = new Date().toISOString().slice(0, 10);
  download(`tablero-senalizacion-${stamp}.json`, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  toast('Tablero guardado. Las imágenes no van en el archivo: vuelve a cargar la carpeta para verlas.', 4500);
}

async function openJson(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('El archivo no es un JSON válido.'); return; }
  if (data && Array.isArray(data.formats)) {
    if (!confirm('Esto reemplaza todos los formatos y la portada por los del archivo. ¿Continuar?')) return;
    state.intro = { ...structuredClone(DEFAULT_INTRO), ...(data.intro || {}) };
    state.formats = data.formats.map((f) => newFormat({
      name: String(f.name || 'Formato'), subtitle: String(f.subtitle || ''), color: String(f.color || '#1f4fd6'),
      sections: sectionsFromJson(f.sections),
    }));
    if (!state.formats.length) state.formats = defaultState().formats;
    setActiveFormat(state.formats[0].id);
  } else if (data && Array.isArray(data.sections)) {
    if (!confirm(`Esto reemplaza las secciones del formato ${board.name} por las del archivo. ¿Continuar?`)) return;
    board.sections = sectionsFromJson(data.sections);
  } else {
    toast('El archivo no parece un tablero guardado.');
    return;
  }
  commit();
  const missing = allCards().filter((c) => !images.has(c.imageId)).length;
  toast(missing ? `Tablero abierto. ${missing} imágenes faltan en la biblioteca: carga la carpeta para verlas.` : 'Tablero abierto.', 4500);
}

/* ---------- Publicación en SharePoint ---------- */
let spReady = false;   // SP.init terminó
let publishing = false;

function configProblem() {
  const m = SP.missingConfig();
  return m.length ? `Falta configurar: ${m.join(', ')}.` : null;
}

function renderAccount() {
  const btn = $('#authBtn');
  const acc = spReady ? SP.currentAccount() : null;
  btn.textContent = acc ? (acc.name || acc.username) : 'Sin conexión';
  btn.title = acc ? `Conectado a SharePoint como ${acc.name || acc.username}. Clic para ver la carpeta.` : 'Conectar con SharePoint';
  btn.classList.toggle('signed', !!acc);
}

async function signInFromClick() {
  const problem = configProblem();
  if (problem) { openConnection(); return false; }
  if (!spReady) { toast('No hay conexión con SharePoint. Abre este archivo desde su carpeta en SharePoint.', 6000); return false; }
  if (SP.currentAccount()) return true;
  try {
    await SP.signIn();
    renderAccount();
    return true;
  } catch (e) {
    console.error(e);
    toast(SP.errorText(e), 7000);
    return false;
  }
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

function expectedExt(img) {
  if (img.published) return img.ext || 'jpg';
  return /svg/.test(img.blob.type || '') ? 'svg' : 'jpg';
}

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

// Arma la estructura de carpetas: <Formato>/<Área>/<foto>.<ext>, solo donde hay fotos colocadas.
async function buildPlan() {
  const files = new Map();   // ruta -> img
  const folders = new Set(); // rutas de carpeta de área usadas
  const fmtNames = new Set();
  const formats = [];
  for (const f of state.formats) {
    let fname = SP.safeName(f.name) || 'Formato';
    while (fmtNames.has(fname.toLowerCase())) fname += ' (2)';
    fmtNames.add(fname.toLowerCase());
    const secNames = new Set();
    const sections = [];
    for (const s of f.sections) {
      let sname = SP.safeName(s.name) || 'Área';
      while (secNames.has(sname.toLowerCase())) sname += ' (2)';
      secNames.add(sname.toLowerCase());
      const folder = `${fname}/${sname}`;
      const used = new Set();
      const cards = [];
      for (const c of s.cards) {
        const img = images.get(c.imageId);
        if (!img) continue;
        if (!img.hash) img.hash = await sha1(img.blob);
        const base = SP.safeName(titleFromName(img.name)) || 'foto';
        const ext = expectedExt(img);
        let name = `${base}.${ext}`;
        for (let k = 2; used.has(name.toLowerCase()); k++) name = `${base} (${k}).${ext}`;
        used.add(name.toLowerCase());
        const file = `${folder}/${name}`;
        files.set(file, img);
        cards.push({ title: c.title, path: c.imageId, hash: img.hash, file });
      }
      if (cards.length) folders.add(folder);
      sections.push({ name: s.name, folder: cards.length ? folder : null, cards });
    }
    formats.push({ name: f.name, subtitle: f.subtitle, color: f.color, folder: fname, sections });
  }
  return { files, folders, formats };
}

async function publish() {
  if (publishing) return;
  if (!(await signInFromClick())) return;

  const missing = allCards().filter((c) => !images.has(c.imageId)).length;
  if (missing && !confirm(`${missing} tarjetas no tienen su imagen en la biblioteca y no se publicarán. ¿Continuar?`)) return;
  if (!confirm(`Se publicarán los ${state.formats.length} formatos en la carpeta de SharePoint. Todos los que abran el panel de lectura verán estos cambios. ¿Publicar?`)) return;

  publishing = true;
  const btn = $('#publishBtn');
  btn.disabled = true;
  try {
    setPublishProgress('Conectando con SharePoint…');
    await SP.resolveRoot();
    const prev = await SP.readJson();
    const prevFiles = new Map();
    const prevFolders = new Set();
    const prevFormatFolders = new Set();
    for (const f of (prev && prev.formats) || []) {
      if (f.folder) prevFormatFolders.add(f.folder);
      for (const s of f.sections || []) {
        if (s.folder) prevFolders.add(s.folder);
        for (const c of s.cards || []) if (c.file) prevFiles.set(c.file, c.hash);
      }
    }

    setPublishProgress('Preparando…');
    const plan = await buildPlan();
    const uploads = [...plan.files].filter(([file, img]) => prevFiles.get(file) !== img.hash);

    // Subir fotos nuevas o cambiadas (3 a la vez).
    let done = 0;
    const queue = uploads.slice();
    const worker = async () => {
      while (queue.length) {
        const [file, img] = queue.shift();
        const { blob } = img.published ? { blob: img.blob } : await optimizeImage(img.blob);
        await SP.upload(file, blob, blob.type || 'image/jpeg');
        setPublishProgress(`Subiendo fotos ${++done} de ${uploads.length}…`);
      }
    };
    await Promise.all([worker(), worker(), worker()]);

    // Borrar fotos que ya no están en el tablero (solo las que publicó esta app).
    let removed = 0;
    const stale = [...prevFiles.keys()].filter((f) => !plan.files.has(f));
    for (const file of stale) {
      setPublishProgress(`Retirando fotos ${++removed} de ${stale.length}…`);
      await SP.remove(file);
    }

    // Guardar la distribución.
    const updatedAt = new Date().toISOString();
    const acc = SP.currentAccount();
    const data = {
      app: 'tablero-senalizacion',
      version: 3,
      updatedAt,
      updatedBy: acc ? (acc.name || acc.username) : null,
      intro: state.intro,
      formats: plan.formats,
    };
    setPublishProgress('Guardando tablero.json…');
    await SP.upload(SP.DATA_FILE, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'application/json');

    // Quitar carpetas que quedaron vacías.
    const usedFormatFolders = new Set(plan.formats.filter((f) => f.sections.some((s) => s.folder)).map((f) => f.folder));
    for (const folder of prevFolders) {
      if (plan.folders.has(folder)) continue;
      const children = await SP.list(folder);
      if (!children.size) await SP.remove(folder);
    }
    for (const folder of prevFormatFolders) {
      if (usedFormatFolders.has(folder)) continue;
      const children = await SP.list(folder);
      if (!children.size) await SP.remove(folder);
    }

    for (const [, img] of plan.files) {
      if (img.published) continue;
      img.publishedHash = img.hash;
    }
    state.dirty = false;
    state.publishedAt = updatedAt;
    publishing = false;
    saveBoard({ dirty: false });
    const fotos = (n) => `${n} ${n === 1 ? 'foto' : 'fotos'}`;
    toast(`Publicado: ${fotos(uploads.length)} ${uploads.length === 1 ? 'subida' : 'subidas'}${stale.length ? `, ${fotos(stale.length)} ${stale.length === 1 ? 'retirada' : 'retiradas'}` : ''}.`, 6000);
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
  const cards = data.formats.flatMap((f) => (f.sections || []).flatMap((s) => s.cards || [])).filter((c) => c && c.path && c.file);
  const need = cards.filter((c) => { const local = images.get(c.path); return !local || local.hash !== c.hash; });

  // Agrupar por carpeta para pedir los enlaces de descarga de una sola vez.
  const byFolder = new Map();
  for (const c of need) {
    const folder = c.file.slice(0, c.file.lastIndexOf('/'));
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(c);
  }
  let done = 0;
  const fetched = [];
  for (const [folder, list] of byFolder) {
    let entries;
    try { entries = await SP.list(folder); } catch (e) { console.warn(e); continue; }
    for (const c of list) {
      toast(`Descargando fotos publicadas… ${++done}/${need.length}`, 60000);
      const name = c.file.slice(c.file.lastIndexOf('/') + 1);
      const entry = entries.get(name);
      if (!entry || !entry.downloadUrl || images.get(c.path)?.hash === c.hash) continue;
      try {
        const r = await fetch(entry.downloadUrl);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const blob = await r.blob();
        const cut = c.path.lastIndexOf('/');
        const prevImg = images.get(c.path);
        if (prevImg?.url) URL.revokeObjectURL(prevImg.url);
        const rec = {
          id: c.path, path: c.path,
          folder: cut === -1 ? '' : c.path.slice(0, cut),
          name: cut === -1 ? c.path : c.path.slice(cut + 1),
          blob, hash: c.hash, published: true, ext: name.split('.').pop(),
        };
        images.set(c.path, { ...rec, url: null });
        fetched.push(rec);
      } catch (e) {
        console.warn('No se pudo descargar', c.file, e);
      }
    }
  }
  if (fetched.length) await idb('images', 'readwrite', (s) => { fetched.forEach((r) => s.put(r)); }).catch(console.error);

  const prevActive = board && board.name;
  state = {
    dirty: false,
    publishedAt: data.updatedAt || null,
    intro: { ...structuredClone(DEFAULT_INTRO), ...(data.intro || {}) },
    formats: data.formats.map((f) => newFormat({
      name: String(f.name || 'Formato'),
      subtitle: String(f.subtitle || ''),
      color: String(f.color || '#1f4fd6'),
      sections: sectionsFromJson(f.sections),
    })),
  };
  if (!state.formats.length) state.formats = defaultState().formats;
  setActiveFormat((state.formats.find((f) => f.name === prevActive) || state.formats[0]).id);
  saveBoard({ dirty: false });
  render();
  toast('Se cargó la versión publicada.');
}

async function loadPublishedAction() {
  if (!(await signInFromClick())) return;
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

// Al iniciar o al iniciar sesión: traer lo publicado si no hay cambios locales pendientes.
async function syncWithPublished() {
  let published = null;
  try { published = await fetchPublished(); } catch (e) { console.warn(e); toast(SP.errorText(e), 7000); return; }
  if (!published) return;
  if (!state.dirty && published.updatedAt !== state.publishedAt) { await loadPublished(published); return; }
  if (state.dirty && state.publishedAt && published.updatedAt > state.publishedAt) {
    toast('Hay una versión publicada más reciente que tus cambios locales. Usa Más → Cargar lo publicado si quieres verla.', 7000);
  }
}

/* ---------- Conexión ---------- */
function openConnection() {
  const problem = configProblem();
  $('#connFolder').textContent = (spReady && SP.folderPath()) || decodeURIComponent(location.pathname.slice(0, location.pathname.lastIndexOf('/'))) || '';
  const acc = spReady ? SP.currentAccount() : null;
  $('#connAccount').textContent = acc ? `${acc.name || ''} (${acc.username})` : 'Sin iniciar sesión';
  const res = $('#connResult');
  res.className = 'cfg-result' + (problem ? ' err' : '');
  res.textContent = problem || '';
  $('#connTest').disabled = !!problem;
  $('#connSignOut').hidden = !acc || !SP.canSignOut;
  $('#connection').showModal();
}

function setupConnection() {
  const dlg = $('#connection');
  const res = $('#connResult');
  $('#connTest').addEventListener('click', async () => {
    if (!(await signInFromClick())) return;
    res.className = 'cfg-result'; res.textContent = 'Probando…';
    try {
      const r = await SP.resolveRoot();
      res.className = 'cfg-result ok';
      res.textContent = `Conexión correcta con la carpeta "${r.name}".`;
      const acc = SP.currentAccount();
      $('#connAccount').textContent = acc ? `${acc.name || ''} (${acc.username})` : '';
      $('#connSignOut').hidden = !acc || !SP.canSignOut;
    } catch (e) {
      console.error(e);
      res.className = 'cfg-result err';
      res.textContent = SP.errorText(e);
    }
  });
  $('#connSignOut').addEventListener('click', async () => {
    await SP.signOut();
    renderAccount();
    dlg.close();
    toast('Sesión cerrada.');
  });
  $('#authBtn').addEventListener('click', async () => {
    if (spReady && SP.currentAccount()) { openConnection(); return; }
    if (await signInFromClick()) await syncWithPublished();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Formatos y portada ---------- */
let editingFormatId = null; // id del formato en edición, o null si es nuevo

function renderFormatPreview() {
  const name = $('#fmtName').value.trim() || 'Formato';
  const prev = $('#fmtPreview');
  prev.style.setProperty('--fc', $('#fmtColor').value);
  prev.innerHTML = `<strong>${escapeHtml(name)}</strong><small>${escapeHtml($('#fmtSubtitle').value.trim())}</small>`;
}

function openFormatDialog(formatId) {
  const f = formatId ? state.formats.find((x) => x.id === formatId) : null;
  editingFormatId = f ? f.id : null;
  $('#formatDlgTitle').textContent = f ? `Editar formato ${f.name}` : 'Nuevo formato';
  $('#fmtName').value = f ? f.name : '';
  $('#fmtSubtitle').value = f ? f.subtitle : '';
  $('#fmtColor').value = /^#[0-9a-f]{6}$/i.test(f?.color || '') ? f.color : '#1f4fd6';
  $('#fmtDelete').hidden = !f || state.formats.length < 2;
  renderFormatPreview();
  $('#formatDlg').showModal();
  $('#fmtName').focus();
}

function openIntroDialog() {
  const t = state.intro;
  $('#inTitle').value = t.title;
  $('#inSubtitle').value = t.subtitle;
  $('#inGuideTitle').value = t.guideTitle;
  $('#inGuide').value = t.guide;
  $('#inImportantTitle').value = t.importantTitle;
  $('#inImportant').value = (t.important || []).join('\n');
  $('#introDlg').showModal();
}

function setupFormatUI() {
  $('#formatTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-format]');
    if (tab) {
      setActiveFormat(tab.dataset.format);
      saveBoard({ dirty: false });
      render();
      return;
    }
    const act = e.target.closest('[data-format-action]');
    if (!act) return;
    if (act.dataset.formatAction === 'edit') openFormatDialog(board.id);
    else if (act.dataset.formatAction === 'add') openFormatDialog(null);
    else if (act.dataset.formatAction === 'intro') openIntroDialog();
  });

  ['#fmtName', '#fmtSubtitle', '#fmtColor'].forEach((sel) => $(sel).addEventListener('input', renderFormatPreview));

  $('#formatForm').addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    const values = {
      name: $('#fmtName').value.trim() || 'Formato',
      subtitle: $('#fmtSubtitle').value.trim(),
      color: $('#fmtColor').value,
    };
    if (editingFormatId) {
      Object.assign(state.formats.find((f) => f.id === editingFormatId), values);
    } else {
      const f = newFormat(values);
      state.formats.push(f);
      setActiveFormat(f.id);
    }
    commit();
  });

  $('#fmtDelete').addEventListener('click', () => {
    const f = state.formats.find((x) => x.id === editingFormatId);
    if (!f || state.formats.length < 2) return;
    const n = f.sections.reduce((k, s) => k + s.cards.length, 0);
    if (!confirm(`¿Eliminar el formato ${f.name}${n ? ` y sus ${n} tarjetas` : ''}? Esto no se puede deshacer.`)) return;
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
    };
    commit();
    toast('Textos de portada actualizados. Publica para que se vean.');
  });
  $('#introReset').addEventListener('click', () => {
    state.intro = structuredClone(DEFAULT_INTRO);
    $('#introDlg').close();
    commit();
  });

  ['#formatDlg', '#introDlg'].forEach((sel) => {
    const dlg = $(sel);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });
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
    case 'connection': return openConnection();
    case 'load-published': return loadPublishedAction();
    case 'auto-place': return autoPlace();
    case 'sections-from-folders': return sectionsFromFolders();
    case 'add-section': return addSection();
    case 'clear-board':
      if (confirm(`Se quitarán todas las imágenes del formato ${board.name} (las secciones se conservan). ¿Continuar?`)) {
        board.sections.forEach((s) => { s.cards = []; });
        commit();
      }
      return;
    case 'reset-sections':
      if (confirm(`Se reemplazarán las secciones del formato ${board.name} por las originales y se vaciará. ¿Continuar?`)) {
        board.sections = newSections();
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
  setupConnection();
  setupFormatUI();
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

  const problem = configProblem();
  if (problem) {
    renderAccount();
    toast(problem, 9000);
    return;
  }
  try {
    await SP.init(SCOPES);
    spReady = true;
  } catch (e) {
    console.error(e);
    toast(SP.errorText(e) + ' Puedes acomodar el tablero, pero no publicar.', 9000);
  }
  renderAccount();
  if (spReady && SP.currentAccount()) {
    try { await SP.silentToken(); await syncWithPublished(); } catch { /* hará falta iniciar sesión con clic */ }
  }
}

init();

</script>
</body>
</html>
