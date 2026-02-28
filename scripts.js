const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const navLinks = document.querySelectorAll('nav a');
const updateActiveNav = () => {
  const fromTop = window.scrollY + 110;

  navLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;

    const inSection = section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop;
    link.classList.toggle('active', inSection);
  });
};

window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);
