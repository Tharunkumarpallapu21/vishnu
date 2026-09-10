(() => {
  'use strict';

  // DOM REFERENCES
  const enterButton = document.querySelector('#enterButton');
  const opening = document.querySelector('#opening');
  const progressText = document.querySelector('#progressText');
  const archives = [...document.querySelectorAll('.archive')];
  const revealSections = [...document.querySelectorAll('.reveal-section')];
  const finalArchive = document.querySelector('#finalArchive');
  const celebration = document.querySelector('#celebration');
  const privateButton = document.querySelector('#privateButton');
  const privateMessage = document.querySelector('#privateMessage');
  const endButton = document.querySelector('#endButton');
  const endScreen = document.querySelector('#endScreen');
  const replayButton = document.querySelector('#replayButton');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // INTRO
  enterButton.addEventListener('click', () => {
    opening.classList.add('has-entered');
    document.querySelector('#prologue').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // IMAGE ERROR HANDLING
  document.querySelectorAll('.archive__media img').forEach((image) => {
    image.addEventListener('error', () => image.classList.add('is-missing'), { once: true });
  });

  // ARCHIVE OBSERVER
  const archiveObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        const index = entry.target.dataset.index;
        if (index) progressText.textContent = `${String(index).padStart(2, '0')} / 10`;
        if (entry.target === finalArchive) createCelebration();
      }
    });
  }, { threshold: 0.35 });
  revealSections.forEach((section) => archiveObserver.observe(section));

  // PRIVATE MESSAGE
  privateButton.addEventListener('click', () => {
    privateMessage.hidden = false;
    privateMessage.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    window.setTimeout(() => privateMessage.querySelector('.letter').focus?.(), 700);
  });

  endButton.addEventListener('click', () => {
    endScreen.hidden = false;
    endScreen.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // CONFETTI
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
