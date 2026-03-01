const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const escapeHtml = (value = '') => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const parseInlineMarkdown = (value = '') => {
  const safe = escapeHtml(value);
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
};

const parseTSV = (text) => {
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split('\t').map((h) => h.trim());

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const cols = line.split('\t');
      return headers.reduce((acc, key, index) => {
        acc[key] = (cols[index] || '').trim();
        return acc;
      }, {});
    });
};

const loadTSV = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return parseTSV(await response.text());
};

const setHTML = (selector, html) => {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
};

const hydrateProfile = (rows) => {
  const profile = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const heroName = document.getElementById('hero-name');
  const heroTitle = document.getElementById('hero-title');
  const heroSummary = document.getElementById('hero-summary');
  const footerName = document.getElementById('footer-name');
  const profileImage = document.querySelector('.profile-pic');

  heroName.innerHTML = `${escapeHtml(profile.name)} <span>(${escapeHtml(profile.name_native)})</span>`;
  heroTitle.textContent = profile.title;
  heroSummary.innerHTML = parseInlineMarkdown(profile.summary);
  if (profileImage && profile.profile_image) profileImage.src = profile.profile_image;
  footerName.textContent = profile.name;

  const heroLinks = document.getElementById('hero-links');
  const links = [
    { label: 'Email', href: `mailto:${profile.email}` },
    { label: 'GitHub', href: profile.github },
    { label: 'LinkedIn', href: profile.linkedin },
    { label: 'Portfolio', href: profile.portfolio }
  ];

  heroLinks.innerHTML = links
    .map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join('');

  setHTML('#contact-list', `
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a></p>
    <p><strong>Location:</strong> ${escapeHtml(profile.location)}</p>
    <p><strong>Availability:</strong> ${parseInlineMarkdown(profile.availability)}</p>
  `);
};

const renderList = (selector, items) => {
  setHTML(selector, items.map((text) => `<li>${parseInlineMarkdown(text)}</li>`).join(''));
};

const initReveal = () => {
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

const initNavState = () => {
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

const initScrollProgress = () => {
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

const initCardTilt = () => {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 5;
      const rotateX = (0.5 - (y / rect.height)) * 5;
      card.style.setProperty('--tiltX', `${rotateX}deg`);
      card.style.setProperty('--tiltY', `${rotateY}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tiltX', '0deg');
      card.style.setProperty('--tiltY', '0deg');
    });
  });
};

const initCursorGlow = () => {
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

const boot = async () => {
  try {
    const [profile, interests, education, experience, projects, publications, awards, contacts] = await Promise.all([
      loadTSV('data/profile.tsv'),
      loadTSV('data/interests.tsv'),
      loadTSV('data/education.tsv'),
      loadTSV('data/experience.tsv'),
      loadTSV('data/projects.tsv'),
      loadTSV('data/publications.tsv'),
      loadTSV('data/awards.tsv'),
      loadTSV('data/contact.tsv')
    ]);

    hydrateProfile(profile);
    renderList('#interests-list', interests.map((row) => row.text));

    setHTML('#education-list', education.map((row) => `
      <li>
        <strong>${escapeHtml(row.school)}</strong>
        <p>${parseInlineMarkdown(row.degree)} (${escapeHtml(row.period)})</p>
        <p>${parseInlineMarkdown(row.note)}</p>
      </li>
    `).join(''));

    setHTML('#experience-list', experience.map((row) => `
      <li>
        <h3>${escapeHtml(row.role)} · ${escapeHtml(row.org)}</h3>
        <p class="meta">${escapeHtml(row.period)}</p>
        <p>${parseInlineMarkdown(row.summary)}</p>
      </li>
    `).join(''));

    setHTML('#projects-list', projects.map((row) => `
      <article class="card project reveal">
        <img src="${escapeHtml(row.image || 'image7.png')}" alt="${escapeHtml(row.title)} thumbnail" />
        <div>
          <h3>${escapeHtml(row.title)}</h3>
          <p class="meta">${escapeHtml(row.role)} · ${escapeHtml(row.period)}</p>
          <p>${parseInlineMarkdown(row.summary)}</p>
          <div class="tags">${row.tags.split(',').map((tag) => `<span>${escapeHtml(tag.trim())}</span>`).join('')}</div>
        </div>
      </article>
    `).join(''));

    setHTML('#publications-list', publications.map((row) => `
      <li><strong>${escapeHtml(row.title)}</strong> — ${escapeHtml(row.venue)} (${escapeHtml(row.year)}), <a href="${escapeHtml(row.link)}" target="_blank" rel="noreferrer">link</a></li>
    `).join(''));

    setHTML('#awards-list', awards.map((row) => `
      <li><strong>${escapeHtml(row.award)}</strong> · ${escapeHtml(row.org)} · ${escapeHtml(row.year)}</li>
    `).join(''));

    setHTML('#contact-list', `${document.getElementById('contact-list').innerHTML}${contacts.map((row) => {
      const linked = row.link ? `<a href="${escapeHtml(row.link)}" target="_blank" rel="noreferrer">${escapeHtml(row.value)}</a>` : escapeHtml(row.value);
      return `<p><strong>${escapeHtml(row.label)}:</strong> ${linked}</p>`;
    }).join('')}`);

    initReveal();
    initNavState();
    initScrollProgress();
    initCardTilt();
    initCursorGlow();
  } catch (error) {
    console.error(error);
  }
};

boot();
