// Theme toggle (light / dark), remembered per visitor
const root = document.documentElement;
document.getElementById('theme-toggle').addEventListener('click', () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = isDark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});

// Mobile menu
const menuBtn = document.getElementById('menu-toggle');
const links = document.getElementById('nav-links');
menuBtn.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', open);
});
links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    links.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

// Nav border once the page scrolls
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Fade sections in as they scroll into view
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  root.classList.add('no-js');
}

// Highlight the nav link for the section in view
const navLinks = [...links.querySelectorAll('a')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => spy.observe(s));

document.getElementById('year').textContent = new Date().getFullYear();

// Build the email link in the browser so spam bots can't read it from the page source
document.querySelectorAll('.js-email').forEach((link) => {
  const address = `${link.dataset.user}@${link.dataset.domain}`;
  link.href = `mailto:${address}`;
  link.textContent = address;
});

// Lightbox: click a photo to view it full screen
// Website screenshots and creative photos browse as separate sets
const photoSets = [
  [...document.querySelectorAll('.browser img')],
  [...document.querySelectorAll('.creative__card > img, .gallery img')],
];
let photos = [];
const box = document.createElement('div');
box.className = 'lightbox';
box.hidden = true;
box.setAttribute('role', 'dialog');
box.setAttribute('aria-modal', 'true');
box.setAttribute('aria-label', 'Photo viewer');
box.innerHTML = `
  <button class="lightbox__btn lightbox__close" aria-label="Close">&times;</button>
  <button class="lightbox__btn lightbox__prev" aria-label="Previous photo">&#8249;</button>
  <figure class="lightbox__figure">
    <img class="lightbox__img" alt="">
    <figcaption class="lightbox__caption"></figcaption>
  </figure>
  <button class="lightbox__btn lightbox__next" aria-label="Next photo">&#8250;</button>
  <span class="lightbox__count"></span>`;
document.body.appendChild(box);

const boxImg = box.querySelector('.lightbox__img');
const boxCaption = box.querySelector('.lightbox__caption');
const boxCount = box.querySelector('.lightbox__count');
let current = 0;
let lastFocus = null;

function showPhoto(i) {
  current = (i + photos.length) % photos.length;
  const p = photos[current];
  boxImg.src = p.currentSrc || p.src;
  boxImg.alt = p.alt;
  boxCaption.textContent = p.alt;
  boxCount.textContent = `${current + 1} / ${photos.length}`;
}
function openBox(set, i) {
  lastFocus = set[i];
  photos = set;
  box.classList.toggle('is-single', set.length < 2);
  showPhoto(i);
  box.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => box.classList.add('is-open'));
  box.querySelector('.lightbox__close').focus();
}
function closeBox() {
  box.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => { box.hidden = true; }, 200);
  if (lastFocus) lastFocus.focus();
}

photoSets.forEach((set) => set.forEach((img, i) => {
  img.classList.add('zoomable');
  img.tabIndex = 0;
  img.setAttribute('role', 'button');
  img.setAttribute('aria-label', `View larger: ${img.alt}`);
  img.addEventListener('click', () => openBox(set, i));
  img.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBox(set, i); }
  });
}));

box.querySelector('.lightbox__close').addEventListener('click', closeBox);
box.querySelector('.lightbox__prev').addEventListener('click', () => showPhoto(current - 1));
box.querySelector('.lightbox__next').addEventListener('click', () => showPhoto(current + 1));
box.addEventListener('click', (e) => { if (e.target === box) closeBox(); });
document.addEventListener('keydown', (e) => {
  if (box.hidden) return;
  if (e.key === 'Escape') closeBox();
  if (e.key === 'ArrowLeft') showPhoto(current - 1);
  if (e.key === 'ArrowRight') showPhoto(current + 1);
  if (e.key === 'Tab') {
    // Keep keyboard focus inside the viewer
    const btns = [...box.querySelectorAll('button')];
    const idx = btns.indexOf(document.activeElement);
    e.preventDefault();
    btns[(idx + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
  }
});

// Swipe left/right on phones
let touchX = null;
box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
box.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
  touchX = null;
});
