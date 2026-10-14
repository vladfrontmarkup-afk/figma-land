import $ from '../lib/jquery.js';

export function initCounter() {
  $('[data-counter]').each(function () {
    const $counter = $(this);
    const $button = $counter.find('[data-counter-button]');
    const $value = $counter.find('[data-counter-value]');
    let count = Number($value.text()) || 0;

    $button.off('click.exampleCounter').on('click.exampleCounter', () => {
      count += 1;
      $value.text(count);
      console.log('jQuery counter:', count);
    });
  });
}
