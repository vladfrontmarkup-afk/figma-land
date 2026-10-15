import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { renderLanding } from './render.js';

const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const imageConfig = { projectId: 'n9ojwqp4', dataset: 'production' };
const action = (label, href) => ({ label, href });
function content() {
  return {
    settings: {
      title: 'Updated site', description: 'Published description',
      navigation: [action('Benefits', '#features')], headerAction: action('Join', '#subscribe'),
      portfolioLink: action('Portfolio', 'https://www.upwork.com/'),
      address: 'San Francisco, CA', mapLocation: 'San Francisco, CA',
      phone: '123', phoneLink: '+123', socialLinks: [action('Twitter', 'https://example.com/profile')],
    },
    page: {
      heroTitle: 'A new headline', heroActions: [action('Start', '#pricing'), action('Learn', '#features')],
      features: [{ title: 'New feature', icon: 'support', action: action('Explore', 'https://example.com/') }],
      contentSections: [{ anchor: 'operations', title: 'Desktop title', mobileTitle: 'Mobile title',
        description: 'Desktop description', mobileDescription: 'Mobile description', actions: [] }],
      pricingPlans: [{ title: 'Custom', amount: 0, currency: '€', period: 'per year',
        features: [{ label: 'Included', included: true }, { label: 'Excluded', included: false }],
        action: action('Buy', 'https://example.com/order') }],
      subscribeTitle: 'Join us', subscribePlaceholder: 'Your email', subscribeButtonLabel: 'Join',
    },
  };
}
const render = (data) => load(renderLanding(html, data, imageConfig));

test('renders edited text, zero prices, responsive wording and accessible plan IDs', () => {
  const $ = render(content());
  assert.equal($('title').text(), 'Updated site');
  assert.equal($('.s-hero__title').text(), 'A new headline');
  assert.equal($('.o-header__nav a').text(), 'Benefits');
  assert.equal($('.c-feature-card').length, 1);
  assert.equal($('#operations h2 .s-content__mobile').text(), 'Mobile title');
  assert.equal($('#operations .s-content__desktop').last().text(), 'Desktop description');
  assert.equal($('.c-pricing-card__amount').text(), '0');
  assert.equal($('.c-pricing-card__feature--unavailable').text(), 'Not included: Excluded');
  assert.equal($(`#${$('.c-pricing-card').attr('aria-labelledby')}`).text(), 'Custom');
  assert.equal($('#subscribe-email').attr('placeholder'), 'Your email');
});

test('escapes CMS HTML and rejects unsafe link destinations', () => {
  const data = content();
  data.page.heroTitle = '<img src=x onerror=alert(1)>';
  data.page.heroActions = [action('<script>alert(1)</script>', 'javascript:alert(1)')];
  const $ = render(data);
  assert.equal($('.s-hero__title img').length, 0);
  assert.equal($('.s-hero__title').text(), data.page.heroTitle);
  assert.equal($('.s-hero__actions script').length, 0);
  assert.equal($('.s-hero__actions a').attr('href'), '#');
  assert.equal($('.s-hero__actions .js--placeholder').length, 1);
});

test('real links lose placeholder handlers and removed sections leave no dead anchors', () => {
  const $ = render(content());
  assert.equal($('.c-feature-card a').hasClass('js--placeholder'), false);
  assert.equal($('.c-pricing-card a').hasClass('js--placeholder'), false);
  assert.equal($('.o-footer__social').first().hasClass('js--placeholder'), false);
  assert.equal($('#workflow').length, 0);
  assert.equal($('a[href="#workflow"]').length, 0);
  assert.equal($('.s-hero__actions a[href="#features"]').hasClass('js--scroll-link'), true);
});

test('keeps original responsive hero breaks and emits safe breaks for edited multiline text', () => {
  const data = content();
  data.page.heroTitle = 'Find the Best Solution in Seconds';
  assert.equal(render(data)('.s-hero__title br').length, 2);
  data.page.heroTitle = 'First line\nSecond line';
  const $ = render(data);
  assert.equal($('.s-hero__title br').length, 1);
  assert.equal($('.s-hero__title span').length, 0);
});

test('optimizes CMS images with dimensions and removes stale mobile template sources', () => {
  const data = content();
  data.page.heroImage = {
    alt: 'CMS dashboard',
    asset: { _id: 'image-0123456789abcdef0123456789abcdef01234567-1100x645-webp',
      metadata: { dimensions: { width: 1100, height: 645 } } },
  };
  let $ = render(data);
  assert.match($('.s-hero__screen img').attr('src'), /^https:\/\/cdn\.sanity\.io\/images\/n9ojwqp4\/production\//);
  assert.equal($('.s-hero__screen img').attr('alt'), 'CMS dashboard');
  assert.equal($('.s-hero__screen img').attr('width'), '1100');
  assert.equal($('.s-hero__screen source').length, 0);
  data.page.heroMobileImage = data.page.heroImage;
  $ = render(data);
  assert.match($('.s-hero__screen source').attr('srcset'), /960w/);
  assert.equal($('.s-hero__screen source').attr('media'), '(max-width: 991px)');
});

test('requires published singleton documents', () => {
  assert.throws(() => renderLanding(html, { settings: null, page: null }, imageConfig), /Publish Site settings/);
});
