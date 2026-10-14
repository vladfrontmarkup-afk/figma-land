export function initHero() {
  const hero = document.querySelector('.js--hero');
  if (!hero) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const savedTimes = new Map();
  let animations = [];
  let inView = false;
  let windowActive = true;
  let pageActive = true;
  let running = false;
  let frame;
  let lastFrame = null;
  let gradientSize = 0;

  const measureGradient = (entries) => {
    const box = entries?.[0]?.contentRect ?? hero.getBoundingClientRect();
    const size = Math.ceil(Math.hypot(box.width, box.height) * 1.2);
    if (size === gradientSize) return;
    gradientSize = size;
    hero.style.setProperty('--hero-gradient-size', `${size}px`);
  };
  measureGradient();
  if ('ResizeObserver' in window) new ResizeObserver(measureGradient).observe(hero);
  else window.addEventListener('resize', measureGradient);

  const canAnimate = () => inView && windowActive && pageActive && !document.hidden
    && !reducedMotion.matches && !connection?.saveData;

  const restoreFrame = () => {
    animations.forEach((animation) => {
      if (animation.playState !== 'idle') {
        animation.currentTime = savedTimes.get(animation.animationName) ?? 0;
      }
    });
  };

  const pauseMotion = () => {
    window.cancelAnimationFrame(frame);
    animations.forEach((animation) => {
      if (animation.playState !== 'idle') animation.pause();
    });
    // Restore the last visible frame instead of sampling a throttled timeline.
    restoreFrame();
    running = false;
    lastFrame = null;
    hero.classList.remove('s-hero--animated');
  };

  const captureFrame = (timestamp) => {
    if (!canAnimate()) {
      pauseMotion();
      return;
    }
    // A suspended browser must not advance through the time it missed.
    if (lastFrame !== null && timestamp - lastFrame > 120) restoreFrame();
    lastFrame = timestamp;
    animations.forEach((animation) => {
      if (typeof animation.currentTime === 'number') {
        savedTimes.set(animation.animationName, animation.currentTime);
      }
    });
    frame = window.requestAnimationFrame(captureFrame);
  };

  const updateMotion = () => {
    if (!canAnimate()) {
      if (running) pauseMotion();
      return;
    }
    if (running || !hero.getAnimations) return;
    animations = hero.getAnimations({ subtree: true }).filter((animation) =>
      animation.animationName === 'hero-gradient' || animation.animationName === 'hero-gradient-rotation');
    if (!animations.length) return;
    restoreFrame();
    animations.forEach((animation) => animation.play());
    running = true;
    lastFrame = null;
    hero.classList.add('s-hero--animated');
    frame = window.requestAnimationFrame(captureFrame);
  };

  // Without these browser APIs, CSS keeps the first frame static.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateMotion();
    }).observe(hero);
  }

  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('blur', () => { windowActive = false; updateMotion(); });
  window.addEventListener('focus', () => { windowActive = true; updateMotion(); });
  window.addEventListener('pagehide', () => { pageActive = false; updateMotion(); });
  window.addEventListener('pageshow', () => { pageActive = true; updateMotion(); });
  reducedMotion.addEventListener('change', updateMotion);
  connection?.addEventListener('change', updateMotion);
}
