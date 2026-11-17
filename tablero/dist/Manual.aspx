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
/* ---------- Notas (bloques de contenido) ---------- */
.blocks { display: grid; gap: 16px; margin: 16px 0; }
.blk { border-radius: 14px; padding: 20px 24px; font-size: 15px; line-height: 1.5; color: #2b3445; }
.blk p { margin: 0; }
.blk p + ul, .blk p + p { margin-top: 10px; }
.blk ul { margin: 10px 0 0; padding-left: 22px; }
.blk li + li { margin-top: 4px; }
.blk-title { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; font-size: 17px; font-weight: 700; }
.blk-ico { width: 22px; height: 22px; flex: none; }

.blk-importante-rojo { background: #fdf0f0; border-left: 5px solid #e5484d; box-shadow: 0 1px 3px rgba(16, 24, 40, .05); }
.blk-importante-rojo .blk-title { color: #2b3445; }

.blk-importante-amarillo { background: #fffaeb; border: 2.5px solid #f5c542; }
.blk-importante-amarillo .blk-title { color: #7a3d00; }

.blk-retira { background: #1f4fd6; color: #fff; border: 2px solid #183ea8; box-shadow: 0 6px 16px rgba(31, 79, 214, .25); }
.blk-retira .blk-title { font-size: 19px; }
.blk-retira .blk-grid { border: 1.5px solid rgba(255, 255, 255, .35); border-radius: 12px; padding: 16px 20px; background: rgba(0, 0, 0, .06); }
.blk-retira .blk-cols { margin: 0; padding-left: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px 28px; font-weight: 600; }
.blk-retira .blk-cols li { position: relative; padding-left: 16px; margin: 0; }
.blk-retira .blk-cols li::before { content: "•"; position: absolute; left: 0; }
.blk-retira hr { border: 0; border-top: 2px solid rgba(255, 255, 255, .45); margin: 18px 0 14px; }
.blk-retira .blk-footer { font-weight: 700; }

.blk-info { background: #eef3ff; color: #1e3a9a; font-weight: 700; padding: 16px 22px; }

.blk-nota { display: flex; gap: 12px; align-items: flex-start; background: #f2f4f7; border: 1px solid #dde2ea; color: #3b4555; font-size: 14px; }
.blk-nota .blk-ico { color: #5d6878; margin-top: 1px; }

.blk-enlace { background: #f0f5ff; border: 1.5px solid #c9dafb; }
.blk-enlace .blk-btn { margin-top: 14px; }

.blk-boton { padding: 0; }
.blk-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;
  cursor: pointer;
}
.blk-btn .blk-ico { width: 20px; height: 20px; }
.blk-btn-solid, .blk-btn-outline { background: #1f4fd6; color: #fff; }
.blk-btn-outline { box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #1f4fd6; }
.blk-btn:hover { filter: brightness(1.08); }
.blk-btn.disabled { opacity: .5; cursor: not-allowed; }

@media (max-width: 640px) {
  .blk { padding: 16px; font-size: 14px; }
  .blk-retira .blk-cols { grid-template-columns: 1fr; }
}

</style>
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
.home-banner {
  display: block;
  width: 100%;
  max-width: 1040px;
  height: auto;           /* la portada se ajusta a la proporción de la imagen, sin recortes */
  margin: 0 auto;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
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
  min-height: 170px;
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
.format-logo { height: 72px; display: grid; place-items: center; margin-bottom: 12px; }
.format-logo img { max-height: 72px; max-width: 160px; object-fit: contain; }
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

/* ---------- Vista de formato: zonas, áreas y espacios ---------- */
.catalog { max-width: 1400px; margin: 0 auto; padding: 14px 20px 30px; }
.cat-toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.tb-group { display: flex; flex-wrap: wrap; gap: 8px; }
.tb-group.right { justify-content: flex-end; }
a.pill { text-decoration: none; }
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1.5px solid #9dbbf3;
  border-radius: 8px;
  background: var(--surface);
  color: var(--brand);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.pill:hover { background: #eef3ff; border-color: var(--brand); }
.pill:focus-visible, .zone:focus-visible, .area:focus-visible, .frame-btn:focus-visible { outline: 3px solid var(--brand-yellow); outline-offset: 2px; }
.banner {
  display: block;
  width: 100%;
  height: auto;           /* sin recortes */
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.format-notes .blocks { margin: 16px 0 0; }
#formatNotesBottom .blocks { margin: 18px 0 0; }
.zones { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin: 14px 0 18px; }
.zone {
  display: grid;
  place-items: center;
  min-height: 52px;
  padding: 10px;
  border: 1.5px solid var(--brand);
  border-radius: 10px;
  background: var(--surface);
  color: var(--brand);
  font-weight: 700;
  text-decoration: none;
  text-align: center;
  transition: background .12s, color .12s;
}
.zone:hover { background: #eef3ff; }
.zone.active { background: var(--brand); color: #fff; box-shadow: 0 4px 12px rgba(31, 79, 214, .3); }

.zone-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px 26px 28px;
}
.zone-title, .area-title { margin: 0; color: #1e3a9a; font-size: 22px; font-weight: 800; }
.area-title { font-size: 20px; }
.zone-sub { margin: 4px 0 0; color: var(--muted); }
.areas { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 18px; }
.area {
  display: flex;
  align-items: center;
  min-height: 64px;
  padding: 12px 22px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05);
  transition: border-color .12s, box-shadow .12s;
}
.area:hover { border-color: #9dbbf3; }
.area.active { border-color: var(--brand); box-shadow: 0 0 0 2px rgba(31, 79, 214, .25); }
.area-detail { scroll-margin-top: 12px; }
.area-detail hr { border: 0; border-top: 1px solid var(--border); margin: 26px 0 22px; }
.area-note {
  margin: 14px 0 22px;
  padding: 14px 18px;
  border-radius: 10px;
  background: #eef3ff;
  color: #1e3a9a;
  font-weight: 600;
}
.spaces { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
.space {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(16, 24, 40, .05);
}
.space h4 { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; }
.frame {
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  padding: 12px;
  border: 2px dashed #cfd6e2;
  border-radius: 8px;
  overflow: hidden;
}
.frame-btn { all: unset; display: grid; place-items: center; width: 100%; height: 100%; cursor: zoom-in; border-radius: 6px; }
.frame-btn img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform .15s; }
.frame-btn:hover img { transform: scale(1.03); }
.pending { color: #8a94a6; font-size: 14px; text-align: center; }
.group-title {
  grid-column: 1 / -1;
  margin: 10px 0 -4px;
  padding: 0 0 8px;
  border-bottom: 3px solid var(--brand-yellow);
  color: #1e3a9a;
  font-size: 19px;
  font-weight: 800;
}
.spaces > .group-title:first-child { margin-top: 0; }
.space-text {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f5f7fb;
  border: 1px solid var(--border);
  color: #3b4555;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-line;
}

/* ---------- Consideraciones Importantes ---------- */
.consider-btn {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 4px auto 0;
  padding: 14px 26px;
  border: 2px solid #f2c94c;
  border-radius: 14px;
  background: linear-gradient(135deg, #fffdf2, #fff3c4);
  color: #7a3d00;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(245, 180, 0, .25);
  transition: transform .12s, box-shadow .12s;
}
.consider-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245, 180, 0, .32); }
.consider-btn:focus-visible { outline: 3px solid var(--brand); outline-offset: 3px; }
.consider-btn .star { font-size: 20px; }

.consider-dlg {
  width: min(720px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  padding: 0;
  border: 0;
  border-radius: 18px;
  background: transparent;
  overflow: visible;
}
.consider-dlg::backdrop { background: rgba(10, 18, 40, .62); backdrop-filter: blur(2px); }
.cn-card {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 24px);
  border-radius: 18px;
  background: var(--surface);
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, .35);
}
.cn-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 22px;
  background: var(--brand);
  color: #fff;
  border-bottom: 4px solid var(--brand-yellow);
}
.cn-head h2 { flex: 1; margin: 0; font-size: 22px; font-weight: 800; }
.cn-head .star { font-size: 24px; }
.cn-close {
  width: 34px; height: 34px; border: 0; border-radius: 50%;
  background: rgba(255, 255, 255, .16); color: #fff; font-size: 20px; cursor: pointer;
}
.cn-close:hover { background: rgba(255, 255, 255, .3); }
.cn-body { overflow-y: auto; padding: 20px 24px 8px; color: #2b3445; font-size: 15.5px; line-height: 1.55; }
.cn-intro { margin: 0 0 16px; }
.cn-items { counter-reset: cn; list-style: none; margin: 0 0 16px; padding: 0; display: grid; gap: 10px; }
.cn-items li {
  counter-increment: cn;
  position: relative;
  padding: 10px 14px 10px 52px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f8faff;
}
.cn-items li::before {
  content: counter(cn);
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
}
.cn-confirm { margin: 0 0 16px; font-weight: 700; color: #1e3a9a; }
.cn-notes { display: grid; gap: 10px; margin-bottom: 8px; }
.cn-notes p {
  margin: 0;
  padding: 12px 14px;
  border-left: 4px solid #f2c94c;
  border-radius: 8px;
  background: #fffaeb;
  font-size: 14px;
  color: #4a3b12;
}
.cn-foot { padding: 14px 24px 20px; border-top: 1px solid var(--border); background: var(--surface); }
.cn-accept {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 15px 18px;
  border: 0;
  border-radius: 12px;
  background: #15803d;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: .02em;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(21, 128, 61, .3);
}
.cn-accept:hover { filter: brightness(1.08); }
.cn-accept:focus-visible { outline: 3px solid var(--brand-yellow); outline-offset: 3px; }
@media (max-width: 640px) {
  .cn-head { padding: 14px 16px; }
  .cn-head h2 { font-size: 19px; }
  .cn-body { padding: 16px 16px 6px; font-size: 15px; }
  .cn-foot { padding: 12px 16px 16px; }
  .cn-accept { font-size: 15px; }
  .consider-btn { width: 100%; justify-content: center; }
}

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
  .catalog { padding: 10px 12px 24px; }
  .zones { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .zone-box { padding: 16px 14px 20px; }
  .areas { grid-template-columns: 1fr 1fr; gap: 8px; }
  .area { min-height: 52px; padding: 10px 12px; font-size: 14px; }
  .spaces { grid-template-columns: 1fr 1fr; gap: 10px; }
  .space { padding: 10px; }
  .space h4 { font-size: 13px; }
  .hero h1 { font-size: 20px; }
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
    <div class="hero-text">
      <h1 id="heroTitle">Señalización en tu tienda</h1>
      <p id="heroSub"></p>
    </div>
  </div>
</header>

<main id="home" class="home" hidden>
  <img id="homeBanner" class="home-banner" alt="" hidden>
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

  <button type="button" id="considerBtn" class="consider-btn" hidden>
    <span id="considerBtnLabel">Consideraciones Importantes</span>
  </button>

  <div id="formats" class="formats"></div>
  <p id="updatedHome" class="updated"></p>
</main>

<div id="catalog" class="catalog" hidden>
  <div id="toolbar" class="cat-toolbar"></div>
  <img id="banner" class="banner" alt="" hidden>
  <div id="formatNotesTop" class="format-notes"></div>
  <nav id="zones" class="zones" aria-label="Zonas de la tienda"></nav>
  <section id="zoneBox" class="zone-box" aria-live="polite"></section>
  <div id="formatNotesBottom" class="format-notes"></div>
</div>

<div id="status" class="status" hidden></div>

<footer class="foot"><span id="account" hidden><span id="accountName"></span><span id="signOutWrap"> · <button type="button" id="signOut" class="link-btn">Cerrar sesión</button></span></span></footer>

<dialog id="considerDlg" class="consider-dlg" aria-labelledby="cnTitle">
  <div class="cn-card">
    <header class="cn-head">
      <h2 id="cnTitle">Consideraciones Importantes</h2>
      <button type="button" id="cnClose" class="cn-close" aria-label="Cerrar">×</button>
    </header>
    <div class="cn-body">
      <p id="cnIntro" class="cn-intro"></p>
      <ol id="cnItems" class="cn-items"></ol>
      <p id="cnConfirm" class="cn-confirm"></p>
      <div id="cnNotes" class="cn-notes"></div>
    </div>
    <footer class="cn-foot">
      <button type="button" id="cnAccept" class="cn-accept"><span id="cnButtonLabel">CONFIRMO DE LEÍDO Y ENTERADO</span></button>
    </footer>
  </div>
</dialog>

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

// Versión de estas páginas. Cambia en cada entrega; si el archivo en SharePoint es más nuevo
// que el que está abierto en el navegador, se avisa para recargar.
const APP_VERSION = '2026.11.17-2';

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
      const m = (await r.text()).match(/const APP_VERSION = '([^']+)'/);
      if (m && m[1] !== APP_VERSION) { updateAvailable = true; showUpdateBanner(); }
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
  };
})();

</script>
<script>
'use strict';

/* =====================================================================
   Notas (bloques de contenido) que se agregan a zonas y áreas.
   Lo usan el panel de lectura y el de administrador, para que se vean igual.
   ===================================================================== */

const BLOCK_TYPES = {
  'importante-rojo': {
    label: 'Importante (rojo)',
    fields: ['title', 'text', 'items'],
    defaults: {
      title: 'Importante',
      items: [
        'Retira cualquier señalización que no esté indicada en este manual.',
        'Mantén únicamente la señalización autorizada en tienda.',
        'Coloca máximo una señalización por departamento.',
      ],
    },
  },
  'importante-amarillo': {
    label: 'Importante (amarillo)',
    fields: ['title', 'text', 'items'],
    defaults: {
      title: 'Importante',
      text: 'Esta señalización debe permanecer en la ubicación definida de acuerdo con el layout de cada tienda.',
      items: [
        'No la retires ni la cambies de lugar.',
        'Mantenla intacta, limpia y en buen estado.',
        'Si requiere renovación, consulta en este archivo los códigos correspondientes para solicitarla.',
      ],
    },
  },
  retira: {
    label: 'Recuadro azul con lista',
    fields: ['title', 'items', 'footer'],
    defaults: {
      title: 'Retira toda señalización que no esté incluida en este manual, por ejemplo:',
      items: ['Letrero de Wi-Fi Gratis', 'Pizarrón Vecino Valioso', 'Prohibido sacar los carritos', 'Teléfono de emergencia 911 & CAE', 'Certificación COVID', 'Cualquier otra señalización adicional'],
      footer: 'Recuerda: Si la señalización no aparece en este manual, debe retirarse de tienda.',
    },
  },
  info: {
    label: 'Aviso azul claro',
    fields: ['text'],
    defaults: { text: 'Consulta aquí la señalización relacionada con esta sección.' },
  },
  nota: {
    label: 'Nota gris',
    fields: ['text'],
    defaults: {
      text: 'La imagen mostrada puede variar respecto a la señalización de tu tienda. Guíate por el contenido de la señalización, no por su diseño. Los equipos correspondientes informarán posteriormente sobre reemplazos o fechas de llegada.',
    },
  },
  enlace: {
    label: 'Texto con botón',
    fields: ['text', 'button'],
    defaults: { text: 'Consulta las licencias y permisos de tu unidad en la siguiente liga:', buttonLabel: 'Consultar licencias y permisos' },
  },
  boton: {
    label: 'Solo botón',
    fields: ['button'],
    defaults: { buttonLabel: 'Descargar texto' },
  },
};

const blkEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Solo enlaces web o rutas relativas (nunca javascript:, data:, etc.).
function blkSafeUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || /^(\/|\.\/|\.\.\/|#)/.test(s)) return s;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;
  return '';
}

// Limpia una nota guardada o publicada.
function normalizeBlock(b) {
  const type = BLOCK_TYPES[b && b.type] ? b.type : 'info';
  return {
    id: (b && b.id) || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
    type,
    pos: b && b.pos === 'bottom' ? 'bottom' : 'top',
    title: String((b && b.title) || ''),
    text: String((b && b.text) || ''),
    items: Array.isArray(b && b.items) ? b.items.map((x) => String(x)).filter((x) => x.trim()) : [],
    footer: String((b && b.footer) || ''),
    buttonLabel: String((b && b.buttonLabel) || ''),
    buttonUrl: String((b && b.buttonUrl) || ''),
  };
}

function newBlock(type, pos = 'top') {
  const t = BLOCK_TYPES[type] || BLOCK_TYPES.info;
  return normalizeBlock({ type, pos, ...structuredClone(t.defaults) });
}

const BLK_ICONS = {
  warn: '<svg class="blk-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z" fill="#f5b400" stroke="#9a6b00" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 10v5" stroke="#3d2b00" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1.2" fill="#3d2b00"/></svg>',
  trash: '<svg class="blk-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  info: '<svg class="blk-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.3" fill="currentColor"/></svg>',
  down: '<svg class="blk-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function blkButton(b, cls) {
  const url = blkSafeUrl(b.buttonUrl);
  const label = blkEsc(b.buttonLabel || 'Abrir');
  const icon = cls.includes('blk-btn-solid') ? BLK_ICONS.down : '';
  return url
    ? `<a class="${cls}" href="${blkEsc(url)}" target="_blank" rel="noopener">${icon}${label}</a>`
    : `<span class="${cls} disabled" title="Falta el enlace">${icon}${label}</span>`;
}

// HTML de una nota. Todo el texto se escapa.
function blockHtml(raw) {
  const b = normalizeBlock(raw);
  const list = (cls = '') => (b.items.length ? `<ul class="${cls}">${b.items.map((x) => `<li>${blkEsc(x)}</li>`).join('')}</ul>` : '');
  switch (b.type) {
    case 'importante-rojo':
    case 'importante-amarillo':
      return `<div class="blk blk-${b.type}">
        ${b.title ? `<h4 class="blk-title">${BLK_ICONS.warn}<span>${blkEsc(b.title)}</span></h4>` : ''}
        ${b.text ? `<p>${blkEsc(b.text)}</p>` : ''}
        ${list()}
      </div>`;
    case 'retira':
      return `<div class="blk blk-retira">
        ${b.title ? `<h4 class="blk-title">${BLK_ICONS.trash}<span>${blkEsc(b.title)}</span></h4>` : ''}
        ${b.items.length ? `<div class="blk-grid">${list('blk-cols')}</div>` : ''}
        ${b.footer ? `<hr><p class="blk-footer">${blkEsc(b.footer)}</p>` : ''}
      </div>`;
    case 'nota':
      return `<div class="blk blk-nota">${BLK_ICONS.info}<p>${blkEsc(b.text)}</p></div>`;
    case 'enlace':
      return `<div class="blk blk-enlace">${b.text ? `<p>${blkEsc(b.text)}</p>` : ''}${blkButton(b, 'blk-btn blk-btn-outline')}</div>`;
    case 'boton':
      return `<div class="blk blk-boton">${blkButton(b, 'blk-btn blk-btn-solid')}</div>`;
    default:
      return `<div class="blk blk-info"><p>${blkEsc(b.text)}</p></div>`;
  }
}

</script>
<script>
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

</script>
</body>
</html>
