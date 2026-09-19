(function () {
  'use strict';

  const formStep = document.getElementById('formStep');
  const loadingStep = document.getElementById('loadingStep');
  const resultStep = document.getElementById('resultStep');

  const name1Input = document.getElementById('name1');
  const name2Input = document.getElementById('name2');
  const calcBtn = document.getElementById('calcBtn');
  const loadingText = document.getElementById('loadingText');

  const fillRect = document.getElementById('fillRect');
  const percentText = document.getElementById('percentText');
  const coupleNames = document.getElementById('coupleNames');
  const resultMessage = document.getElementById('resultMessage');

  const retryBtn = document.getElementById('retryBtn');
  const resetBtn = document.getElementById('resetBtn');
  const shareBtn = document.getElementById('shareBtn');

  const bgHearts = document.getElementById('bgHearts');
  const confettiLayer = document.getElementById('confettiLayer');

  const LOADING_MESSAGES = [
    'Consultando las estrellas... ✨',
    'Preguntando a Cupido... 🏹',
    'Analizando las vibras... 🔮',
    'Revisando el horóscopo... ♥️',
    'Calculando compatibilidad cuántica... ⚛️',
    'Batiendo la poción de amor... 🧪'
  ];

  const RESULT_RANGES = [
    { max: 10, message: 'Ni con un telescopio se ve algo ahí... 🔭😂' },
    { max: 25, message: 'Hay más química en un laboratorio que aquí. ⚗️' },
    { max: 40, message: 'Amistad del bueno, nada más. Pero oye, la amistad también vale. 🤝' },
    { max: 55, message: 'Mmm, algo se está cocinando por ahí... 👀🍳' },
    { max: 70, message: '¡Cupido ya está afilando sus flechas! 🏹💘' },
    { max: 85, message: '¡Esto está que arde! 🔥❤️' },
    { max: 95, message: '¡Alerta de boda! Alguien avise al DJ. 💍🎉' },
    { max: 100, message: 'Almas gemelas certificadas ✨💞 (o el algoritmo hoy está de buen humor)' }
  ];

  let lastNames = { n1: '', n2: '' };
  let bgHeartsTimer = null;

  function startBackgroundHearts() {
    const emojis = ['❤️', '💕', '💖', '💘', '💗'];
    bgHeartsTimer = setInterval(() => {
      const heart = document.createElement('span');
      heart.className = 'floating-heart';
      heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      heart.style.fontSize = 14 + Math.random() * 18 + 'px';
      const duration = 6 + Math.random() * 5;
      heart.style.animationDuration = duration + 's';
      bgHearts.appendChild(heart);
      setTimeout(() => heart.remove(), duration * 1000);
    }, 500);
  }

  function shakeElement(el) {
    el.classList.remove('shake');
    // force reflow so the animation can restart
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function getMessageForPercent(pct) {
    for (const range of RESULT_RANGES) {
      if (pct <= range.max) return range.message;
    }
    return RESULT_RANGES[RESULT_RANGES.length - 1].message;
  }

  function computeLovePercent(n1, n2) {
    const a = n1.trim().toLowerCase();
    const b = n2.trim().toLowerCase();

    if (a && a === b) {
      return { pct: 100, override: 'Te amas a ti mismo/a. Autoestima nivel: leyenda. 💅✨' };
    }

    // A little bell-curve so results feel less "flat random"
    const r = (Math.random() + Math.random() + Math.random()) / 3;
    const pct = Math.round(r * 100);
    return { pct: Math.min(100, Math.max(0, pct)), override: null };
  }

  function spawnConfetti() {
    const colors = ['#ff2e63', '#ff6a88', '#ffb347', '#ffd166', '#ff9ff3'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.width = 6 + Math.random() * 6 + 'px';
      piece.style.height = 10 + Math.random() * 8 + 'px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      const duration = 2.5 + Math.random() * 2;
      piece.style.animationDuration = duration + 's';
      piece.style.animationDelay = Math.random() * 0.4 + 's';
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + 0.5) * 1000);
    }
  }

  function animateHeartFill(targetPct) {
    const duration = 1400;
    const start = performance.now();
    const viewBoxSize = 512;

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const currentPct = eased * targetPct;

      const fillHeight = (currentPct / 100) * viewBoxSize;
      fillRect.setAttribute('y', viewBoxSize - fillHeight);
      fillRect.setAttribute('height', fillHeight);
      percentText.textContent = Math.round(currentPct) + '%';

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        percentText.textContent = targetPct + '%';
        if (targetPct >= 85) {
          spawnConfetti();
        } else if (targetPct <= 10) {
          shakeElement(document.querySelector('.heart-meter'));
        }
      }
    }

    requestAnimationFrame(frame);
  }

  function showStep(step) {
    [formStep, loadingStep, resultStep].forEach((s) => s.classList.add('hidden'));
    step.classList.remove('hidden');
  }

  function runLoadingSequence(onDone) {
    showStep(loadingStep);
    let index = 0;
    loadingText.textContent = LOADING_MESSAGES[0];
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      loadingText.textContent = LOADING_MESSAGES[index];
    }, 450);

    setTimeout(() => {
      clearInterval(interval);
      onDone();
    }, 2200);
  }

  function reveal(n1, n2) {
    const { pct, override } = computeLovePercent(n1, n2);
    coupleNames.textContent = `${n1 || '???'} 💞 ${n2 || '???'}`;
    resultMessage.textContent = override || getMessageForPercent(pct);
    fillRect.setAttribute('y', 512);
    fillRect.setAttribute('height', 0);
    percentText.textContent = '0%';
    showStep(resultStep);
    animateHeartFill(pct);
  }

  function handleCalculate() {
    const n1 = name1Input.value.trim();
    const n2 = name2Input.value.trim();

    if (!n1 || !n2) {
      shakeElement(document.getElementById('formStep'));
      const missing = !n1 ? name1Input : name2Input;
      missing.focus();
      missing.placeholder = '¡Escribe un nombre, no seas tímido/a! 😅';
      return;
    }

    lastNames = { n1, n2 };
    runLoadingSequence(() => reveal(n1, n2));
  }

  calcBtn.addEventListener('click', handleCalculate);

  [name1Input, name2Input].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCalculate();
    });
  });

  retryBtn.addEventListener('click', () => {
    runLoadingSequence(() => reveal(lastNames.n1, lastNames.n2));
  });

  resetBtn.addEventListener('click', () => {
    name1Input.value = '';
    name2Input.value = '';
    showStep(formStep);
    name1Input.focus();
  });

  shareBtn.addEventListener('click', async () => {
    const text = `${coupleNames.textContent} → ${percentText.textContent} de amor según el Medidor de Enamoramiento 💘`;
    try {
      await navigator.clipboard.writeText(text);
      const original = shareBtn.textContent;
      shareBtn.textContent = '¡Copiado! ✅';
      setTimeout(() => (shareBtn.textContent = original), 1500);
    } catch (err) {
      const original = shareBtn.textContent;
      shareBtn.textContent = 'No se pudo copiar 😬';
      setTimeout(() => (shareBtn.textContent = original), 1500);
    }
  });

  startBackgroundHearts();
})();
