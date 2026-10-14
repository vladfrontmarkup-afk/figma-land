export function initHero() {
  const hero = document.querySelector('.js--hero');
  if (!hero) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let inView = false;

  const updateMotion = () => {
    const enabled = inView && !document.hidden && !reducedMotion.matches && !connection?.saveData;
    hero.classList.toggle('s-hero--animated', enabled);
  };

  // Without IntersectionObserver the static first frame remains visible.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateMotion();
    });
    observer.observe(hero);
  }

  document.addEventListener('visibilitychange', updateMotion);
  reducedMotion.addEventListener('change', updateMotion);
  connection?.addEventListener('change', updateMotion);
}
