<%@ Page Language="C#" %>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Señalización en tu tienda</title>
<meta name="description" content="Manual de señalización autorizada por formato y área de tienda (solo lectura).">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect width=%2232%22 height=%2232%22 rx=%227%22 fill=%22%231f4fd6%22/><rect x=%226%22 y=%2224%22 width=%2220%22 height=%223%22 rx=%221.5%22 fill=%22%23ffc220%22/><rect x=%228%22 y=%227%22 width=%2216%22 height=%2213%22 rx=%222%22 fill=%22%23fff%22/></svg>">
<meta name="app-version" content="2026.11.18-4">
<link rel="stylesheet" href="public/css/blocks.css?v=2026.11.18-4">
<link rel="stylesheet" href="public/css/manual.css?v=2026.11.18-4">
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

<script src="public/js/sharepoint.js?v=2026.11.18-4"></script>
<script src="public/js/blocks.js?v=2026.11.18-4"></script>
<script src="public/js/manual.js?v=2026.11.18-4"></script>
</body>
</html>
