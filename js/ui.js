export const initReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll('.reveal').forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index * 40, 220)}ms`;
    observer.observe(el);
  });
};

export const initNavState = () => {
  const navLinks = document.querySelectorAll('nav a');

  const updateActiveNav = () => {
    const fromTop = window.scrollY + 120;
    navLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      if (!section) return;
      const inSection = section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop;
      link.classList.toggle('active', inSection);
    });
  };

  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();
};

export const initScrollProgress = () => {
  const progressEl = document.querySelector('.scroll-progress');

  const onScroll = () => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progressEl?.style.setProperty('--scroll', `${progress}%`);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

export const initCardTilt = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const cards = document.querySelectorAll('.project.card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 2.5;
      const rotateX = (0.5 - (y / rect.height)) * 2.5;
      card.style.setProperty('--tiltX', `${rotateX}deg`);
      card.style.setProperty('--tiltY', `${rotateY}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tiltX', '0deg');
      card.style.setProperty('--tiltY', '0deg');
    });
  });
};

export const initCursorGlow = () => {
  const glow = document.querySelector('.cursor-glow');
  if (!glow || window.matchMedia('(max-width: 640px)').matches) return;

  let x = -999;
  let y = -999;
  let targetX = x;
  let targetY = y;

  window.addEventListener('mousemove', (event) => {
    targetX = event.clientX - 140;
    targetY = event.clientY - 140;
  });

  const animate = () => {
    x += (targetX - x) * 0.12;
    y += (targetY - y) * 0.12;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(animate);
  };

  animate();
};
