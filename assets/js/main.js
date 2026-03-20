/* ── Theme ── */
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeLabel  = document.getElementById('themeLabel');
const themeIcon   = document.getElementById('themeIcon');

const ICONS = {
  dark:  `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`,
  light: `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`
};

function applyTheme(t) {
  html.setAttribute('data-theme', t);
  localStorage.setItem('ptp-theme', t);
  if (t === 'dark') {
    themeLabel.textContent = 'Light mode';
    themeIcon.innerHTML = ICONS.dark;
  } else {
    themeLabel.textContent = 'Dark mode';
    themeIcon.innerHTML = ICONS.light;
  }
}

applyTheme(localStorage.getItem('ptp-theme') || 'dark');
themeToggle.addEventListener('click', () => {
  applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

/* ── Smooth Scroll ── */
function goTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  closeMobileMenu();
}

/* ── Hamburger Menu ── */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const headerNav = document.getElementById('headerNav');

function closeMobileMenu() {
  if (!hamburgerBtn || !headerNav) return;
  hamburgerBtn.classList.remove('active');
  headerNav.classList.remove('open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

if (hamburgerBtn && headerNav) {
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = hamburgerBtn.classList.toggle('active');
    headerNav.classList.toggle('open');
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburgerBtn.contains(e.target) && !headerNav.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // Close on window resize past mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMobileMenu();
  });
}

/* ── Scroll Spy ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link[data-section]');

const spy = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
    }
  });
}, { rootMargin: '-25% 0px -65% 0px' });

sections.forEach(s => spy.observe(s));

/* ── Fade-up on Scroll ── */
const fadeEls = document.querySelectorAll('.fade-up');
const reducer = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reducer) {
  fadeEls.forEach(el => el.classList.add('visible'));
} else {
  const fader = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        fader.unobserve(e.target);
      }
    });
  }, { threshold: 0.07 });
  fadeEls.forEach(el => fader.observe(el));
}
