export function initExampleSection() {
  document.querySelectorAll('[data-example-section]').forEach((section) => {
    const button = section.querySelector('[data-example-button]');
    if (!button) return;

    button.addEventListener('click', () => {
      console.log('Example section: button clicked!', section);
    });
  });

  console.log($('[data-example-section]'));
  
}
