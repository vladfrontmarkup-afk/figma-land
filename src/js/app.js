import '../css/style.css';
import { initHeader } from './components/header.js';
import { initHero } from './components/hero.js';

initHeader();
initHero();

document.querySelectorAll('.js--placeholder').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});

document.querySelectorAll('.js--scroll-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.querySelector('.js--header');
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, top - headerHeight - 16),
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  });
});
