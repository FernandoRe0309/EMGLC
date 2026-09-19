(function () {
  'use strict';

  const introStep = document.getElementById('introStep');
  const quizStep = document.getElementById('quizStep');
  const wordStep = document.getElementById('wordStep');
  const loadingStep = document.getElementById('loadingStep');
  const resultStep = document.getElementById('resultStep');

  const startBtn = document.getElementById('startBtn');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');

  const wordInput = document.getElementById('wordInput');
  const wordBtn = document.getElementById('wordBtn');
  const loadingText = document.getElementById('loadingText');

  const fillRect = document.getElementById('fillRect');
  const percentText = document.getElementById('percentText');
  const resultMessage = document.getElementById('resultMessage');
  const wordEcho = document.getElementById('wordEcho');

  const retryBtn = document.getElementById('retryBtn');
  const shareBtn = document.getElementById('shareBtn');

  const bgHearts = document.getElementById('bgHearts');
  const confettiLayer = document.getElementById('confettiLayer');

  const QUESTIONS = [
    {
      text: 'Cuando ves un mensaje suyo en tu teléfono, ¿qué haces?',
      options: [
        { label: 'Lo abro después, sin prisa', score: 0 },
        { label: 'Sonrío antes de abrirlo', score: 1 },
        { label: 'Se me acelera el corazón', score: 2 },
        { label: 'Grito internamente y lo leo cinco veces', score: 3 }
      ]
    },
    {
      text: '¿Qué tan seguido piensas en esa persona durante el día?',
      options: [
        { label: 'Casi nunca', score: 0 },
        { label: 'De vez en cuando', score: 1 },
        { label: 'Bastante seguido', score: 2 },
        { label: 'Todo el tiempo, no puedo parar', score: 3 }
      ]
    },
    {
      text: 'Si no te responde en un par de horas...',
      options: [
        { label: 'Ni lo noto', score: 0 },
        { label: 'Reviso el teléfono un par de veces', score: 1 },
        { label: 'Empiezo a inventar excusas de por qué no contesta', score: 2 },
        { label: 'Reviso cada cinco minutos como detective', score: 3 }
      ]
    },
    {
      text: 'Cuando estás con esa persona, el tiempo...',
      options: [
        { label: 'Pasa normal', score: 0 },
        { label: 'Se siente más ligero', score: 1 },
        { label: 'Vuela sin que me dé cuenta', score: 2 },
        { label: 'Desearía que se detuviera para siempre', score: 3 }
      ]
    },
    {
      text: '¿Te imaginas planes futuros con esa persona?',
      options: [
        { label: 'No, para nada', score: 0 },
        { label: 'A veces, sin pensarlo mucho', score: 1 },
        { label: 'Sí, bastante seguido', score: 2 },
        { label: 'Constantemente... y ya hasta tengo nombres pensados 👀', score: 3 }
      ]
    },
    {
      text: 'Cuando alguien más menciona su nombre...',
      options: [
        { label: 'No pasa nada', score: 0 },
        { label: 'Presto un poco más de atención', score: 1 },
        { label: 'Se me ilumina la cara', score: 2 },
        { label: 'Se me escapa una sonrisa que no puedo controlar', score: 3 }
      ]
    }
  ];

  const MAX_SCORE = QUESTIONS.reduce((sum, q) => sum + q.options[q.options.length - 1].score, 0);

  const LOADING_MESSAGES = [
    'Analizando tus respuestas... 🔍',
    'Consultando las estrellas... ✨',
    'Preguntando a Cupido... 🏹',
    'Midiendo tus mariposas en el estómago... 🦋',
    'Calculando compatibilidad cuántica... ⚛️',
    'Batiendo la poción de amor... 🧪'
  ];

  const RESULT_RANGES = [
    { max: 15, message: 'Mmm, parece que tu corazón anda tranquilo... o disimulas muy bien. 😏' },
    { max: 30, message: 'Hay un cosquilleo ahí, aunque tú digas que no. 👀' },
    { max: 45, message: 'Algo se está encendiendo poco a poco... 🔥' },
    { max: 60, message: 'Ok, esto ya es oficial: te está gustando bastante. 😳' },
    { max: 75, message: 'Mariposas en el estómago nivel: colonia completa. 🦋' },
    { max: 90, message: 'Elvira... estás enamorada y lo sabes. 💘' },
    { max: 100, message: 'ALERTA ROJA: Cupido ya ganó esta batalla. Estás perdidamente enamorada. 😍💍' }
  ];

  let currentQuestionIndex = 0;
  let totalScore = 0;
  let lastWord = '';

  function startBackgroundHearts() {
    const emojis = ['❤️', '💕', '💖', '💘', '💗'];
    setInterval(() => {
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
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function getMessageForPercent(pct) {
    for (const range of RESULT_RANGES) {
      if (pct <= range.max) return range.message;
    }
    return RESULT_RANGES[RESULT_RANGES.length - 1].message;
  }

  function showStep(step) {
    [introStep, quizStep, wordStep, loadingStep, resultStep].forEach((s) => s.classList.add('hidden'));
    step.classList.remove('hidden');
  }

  function renderQuestion() {
    const q = QUESTIONS[currentQuestionIndex];
    questionText.textContent = q.text;
    progressLabel.textContent = `Pregunta ${currentQuestionIndex + 1} de ${QUESTIONS.length}`;
    progressFill.style.width = (currentQuestionIndex / QUESTIONS.length) * 100 + '%';

    optionsContainer.innerHTML = '';
    q.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = option.label;
      btn.addEventListener('click', () => selectOption(option.score));
      optionsContainer.appendChild(btn);
    });
  }

  function selectOption(score) {
    totalScore += score;
    currentQuestionIndex++;

    if (currentQuestionIndex < QUESTIONS.length) {
      renderQuestion();
    } else {
      progressFill.style.width = '100%';
      showStep(wordStep);
      wordInput.focus();
    }
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

  function reveal() {
    const pct = Math.round((totalScore / MAX_SCORE) * 100);
    resultMessage.textContent = getMessageForPercent(pct);
    wordEcho.textContent = lastWord ? `Tú misma dijiste que te sientes "${lastWord}"... coincide, ¿no? 😏` : '';
    fillRect.setAttribute('y', 512);
    fillRect.setAttribute('height', 0);
    percentText.textContent = '0%';
    showStep(resultStep);
    animateHeartFill(pct);
  }

  function resetQuiz() {
    currentQuestionIndex = 0;
    totalScore = 0;
    lastWord = '';
    wordInput.value = '';
    renderQuestion();
    showStep(quizStep);
  }

  startBtn.addEventListener('click', () => {
    currentQuestionIndex = 0;
    totalScore = 0;
    renderQuestion();
    showStep(quizStep);
  });

  wordBtn.addEventListener('click', () => {
    lastWord = wordInput.value.trim();
    runLoadingSequence(reveal);
  });

  wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') wordBtn.click();
  });

  retryBtn.addEventListener('click', resetQuiz);

  shareBtn.addEventListener('click', async () => {
    const text = `Elvira está ${percentText.textContent} enamorada según el Medidor de Enamoramiento 💘`;
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
