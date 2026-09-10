(() => {
  'use strict';

  // DOM REFERENCES
  const enterButton = document.querySelector('#enterButton');
  const opening = document.querySelector('#opening');
  const progressText = document.querySelector('#progressText');
  const revealSections = [...document.querySelectorAll('.reveal-section')];
  const finalArchive = document.querySelector('#finalArchive');
  const celebration = document.querySelector('#celebration');
  const privateButton = document.querySelector('#privateButton');
  const privateMessage = document.querySelector('#privateMessage');
  const endButton = document.querySelector('#endButton');
  const endScreen = document.querySelector('#endScreen');
  const replayButton = document.querySelector('#replayButton');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // INTRO
  enterButton.addEventListener('click', () => {
    opening.classList.add('has-entered');
    document.querySelector('#prologue').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // IMAGE ERROR HANDLING
  document.querySelectorAll('.archive__media img').forEach((image) => {
    image.addEventListener('error', () => image.classList.add('is-missing'), { once: true });
  });

  // ARCHIVE OBSERVER + PROGRESS
  const archiveObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      const index = entry.target.dataset.index;
      if (index) progressText.textContent = `${String(index).padStart(2, '0')} / 10`;
      if (entry.target === finalArchive) createCelebration();
    });
  }, { threshold: 0.35 });
  revealSections.forEach((section) => archiveObserver.observe(section));

  // INTERACTIVE ATMOSPHERE: pointer light and click evidence marks
  if (!reducedMotion && finePointer) {
    let frame = 0;
    window.addEventListener('pointermove', (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
        frame = 0;
      });
    }, { passive: true });
  }

  document.addEventListener('pointerdown', (event) => {
    if (reducedMotion || event.target.closest('button')) return;
    const mark = document.createElement('span');
    mark.className = 'click-evidence';
    mark.style.left = `${event.clientX}px`;
    mark.style.top = `${event.clientY}px`;
    document.body.appendChild(mark);
    window.setTimeout(() => mark.remove(), 750);
  }, { passive: true });

  // DESKTOP-ONLY ARCHIVE PHOTO TILT
  if (!reducedMotion && finePointer) {
    document.querySelectorAll('.archive__media').forEach((frame) => {
      const image = frame.querySelector('img');
      if (!image) return;
      frame.addEventListener('pointermove', (event) => {
        const bounds = frame.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        image.style.transform = `perspective(900px) rotateX(${y * -3}deg) rotateY(${x * 3}deg) scale(1.025)`;
      });
      frame.addEventListener('pointerleave', () => { image.style.transform = ''; });
    });
  }

  // PRIVATE MESSAGE
  privateButton.addEventListener('click', () => {
    privateMessage.hidden = false;
    privateMessage.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  endButton.addEventListener('click', () => {
    endScreen.hidden = false;
    endScreen.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // CINEMATIC CELEBRATION
  function createCelebration() {
    if (celebration.dataset.created || reducedMotion) return;
    celebration.dataset.created = 'true';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 28; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 180}px`);
      piece.style.animationDuration = `${5 + Math.random() * 5}s`;
      piece.style.animationDelay = `${Math.random() * 4}s`;
      fragment.appendChild(piece);
    }
    for (let i = 0; i < 13; i += 1) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.style.left = `${8 + Math.random() * 84}%`;
      spark.style.top = `${10 + Math.random() * 75}%`;
      spark.style.animationDelay = `${Math.random() * 2}s`;
      fragment.appendChild(spark);
    }
    celebration.appendChild(fragment);
  }

  // REPLAY
  replayButton.addEventListener('click', () => {
    privateMessage.hidden = true;
    endScreen.hidden = true;
    progressText.textContent = '00 / 10';
    revealSections.forEach((section) => section.classList.remove('is-visible'));
    if (celebration) {
      celebration.replaceChildren();
      delete celebration.dataset.created;
    }
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    window.setTimeout(() => revealSections.forEach((section) => archiveObserver.observe(section)), 250);
  });
})();
