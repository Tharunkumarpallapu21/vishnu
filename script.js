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
  const timelineLinks = [...document.querySelectorAll('[data-timeline]')];
  const menuToggle = document.querySelector('#menuToggle');
  const archiveMenu = document.querySelector('#archiveMenu');
  const menuClose = document.querySelector('#menuClose');
  const menuLinks = [...document.querySelectorAll('.archive-menu__links a')];
  const cinematicReveal = document.querySelector('#cinematicReveal');
  const revealFrame = cinematicReveal.querySelector('.cinematic-reveal__frame');
  const revealPhoto = document.querySelector('#revealPhoto');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // AUTOMATIC ORIGINALITY REVEAL: preload the real project photos once, then play them in order.
  const playOriginalityReveal = () => {
    const photoPaths = Array.from({ length: 7 }, (_, index) => `./photo${index + 1}.jpeg`);
    const loaded = photoPaths.map((path) => new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = path;
    }));
    document.body.classList.add('reveal-lock');
    Promise.all(loaded).then(() => {
      const introHold = reducedMotion ? 500 : 2500;
      window.setTimeout(() => {
        cinematicReveal.classList.add('is-photos');
        const timings = [550, 450, 400, 500, 400, 450, 1800];
        let index = 0;
        const showNext = () => {
          revealPhoto.src = photoPaths[index];
          revealFrame.classList.toggle('is-final', index === photoPaths.length - 1);
          if (!reducedMotion && index > 0 && index < 6) {
            cinematicReveal.classList.add('flash');
            window.setTimeout(() => cinematicReveal.classList.remove('flash'), 110);
          }
          window.setTimeout(() => {
            index += 1;
            if (index < photoPaths.length) showNext();
            else finishReveal();
          }, reducedMotion ? 250 : timings[index]);
        };
        const finishReveal = () => {
          cinematicReveal.classList.add('is-outro');
          window.setTimeout(() => {
            cinematicReveal.classList.add('is-done');
            document.body.classList.remove('reveal-lock');
          }, reducedMotion ? 900 : 2100);
        };
        showNext();
      }, introHold);
    });
  };
  playOriginalityReveal();

  // ARCHIVE INDEX MENU
  const setMenu = (isOpen) => {
    archiveMenu.hidden = !isOpen;
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
    if (isOpen) menuClose.focus();
  };
  menuToggle.addEventListener('click', () => setMenu(archiveMenu.hidden));
  menuClose.addEventListener('click', () => setMenu(false));
  menuLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !archiveMenu.hidden) setMenu(false); });

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

  // TIMELINE ACTIVE STATE
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      timelineLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.timeline === entry.target.dataset.index));
    });
  }, { threshold: 0.52 });
  revealSections.forEach((section) => timelineObserver.observe(section));

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
