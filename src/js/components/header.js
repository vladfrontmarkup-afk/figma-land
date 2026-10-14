export function initHeader() {
  const header = document.querySelector('.js--header');
  const toggle = header?.querySelector('.js--menu-toggle');
  const nav = header?.querySelector('.js--primary-nav');
  const content = document.querySelector('.js--main');
  if (!header || !toggle || !nav) return;

  const desktop = window.matchMedia('(min-width: 992px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const inner = header.querySelector('.o-header__inner');
  let open = false;
  let closing = false;
  let closeTimer;
  let scrollPending = false;
  header.classList.add('o-header--enhanced');
  nav.querySelectorAll('.o-header__link').forEach((link, index) => {
    link.style.setProperty('--menu-order', index);
  });

  const measureHeader = () => {
    const height = inner.getBoundingClientRect().height;
    if (!header.classList.contains('o-header--scrolled')) {
      document.documentElement.style.setProperty('--header-offset', `${height}px`);
    }
  };
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(inner);
  else window.addEventListener('resize', measureHeader);

  const updateScroll = () => {
    if (!open && !closing) header.classList.toggle('o-header--scrolled', window.scrollY > 48);
    scrollPending = false;
  };
  window.addEventListener('scroll', () => {
    if (scrollPending) return;
    scrollPending = true;
    window.requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();
  measureHeader();

  const finishClose = () => {
    closing = false;
    header.classList.remove('o-header--closing');
    document.body.classList.remove('is-menu-open');
    if (content) content.inert = false;
    updateScroll();
  };

  const setOpen = (value, restoreFocus = false, immediate = false) => {
    window.clearTimeout(closeTimer);
    const wasActive = open || closing;
    open = value && !desktop.matches;
    closing = !open && wasActive && !immediate && !desktop.matches && !reducedMotion.matches;
    header.classList.toggle('o-header--open', open);
    header.classList.toggle('o-header--closing', closing);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.inert = !desktop.matches && !open;

    if (open) {
      document.body.classList.add('is-menu-open');
      if (content) content.inert = true;
      window.requestAnimationFrame(() => {
        if (open) nav.querySelector('a')?.focus({ preventScroll: true });
      });
    } else if (closing) {
      // Keep scroll and header geometry stable until the exit animation finishes.
      closeTimer = window.setTimeout(finishClose, 300);
    } else {
      finishClose();
    }
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => setOpen(!open, open));
  header.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false, open);
  });

  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false, true);
      return;
    }
    if (event.key !== 'Tab') return;
    const links = [...header.querySelectorAll('a[href], button:not(:disabled)')];
    const first = links[0];
    const last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });

  desktop.addEventListener('change', () => {
    const focusedInNav = nav.contains(document.activeElement);
    const focusedToggle = document.activeElement === toggle;
    setOpen(false, false, true);
    if (!desktop.matches && focusedInNav) toggle.focus({ preventScroll: true });
    if (desktop.matches && focusedToggle) nav.querySelector('a')?.focus({ preventScroll: true });
  });
  reducedMotion.addEventListener('change', () => {
    if (closing && reducedMotion.matches) setOpen(false, false, true);
  });
  setOpen(false);
}
