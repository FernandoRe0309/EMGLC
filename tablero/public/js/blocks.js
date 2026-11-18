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
// opts.considerLabel: si se da, las notas rojas "Importante" llevan el botón que abre
// la tarjeta de Consideraciones Importantes (el clic lo atiende la página, por data-consider).
function blockHtml(raw, opts = {}) {
  const b = normalizeBlock(raw);
  const consider = opts && opts.considerLabel
    ? `<button type="button" class="blk-consider" data-consider>${blkEsc(opts.considerLabel)}</button>` : '';
  const list = (cls = '') => (b.items.length ? `<ul class="${cls}">${b.items.map((x) => `<li>${blkEsc(x)}</li>`).join('')}</ul>` : '');
  switch (b.type) {
    case 'importante-rojo':
    case 'importante-amarillo':
      return `<div class="blk blk-${b.type}">
        ${b.title ? `<h4 class="blk-title">${BLK_ICONS.warn}<span>${blkEsc(b.title)}</span></h4>` : ''}
        ${b.text ? `<p>${blkEsc(b.text)}</p>` : ''}
        ${list()}
        ${b.type === 'importante-rojo' ? consider : ''}
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
