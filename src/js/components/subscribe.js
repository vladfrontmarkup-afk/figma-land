export function initSubscribe() {
  const form = document.querySelector('.js--subscribe-form');
  if (!form) return;

  const status = form.querySelector('.js--subscribe-status');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Keep the form local until a subscription service is connected.
    status.textContent = 'Subscriptions are not available yet. Please try again later.';
    status.hidden = false;
  });

  form.addEventListener('input', () => {
    status.hidden = true;
    status.textContent = '';
  });
}
