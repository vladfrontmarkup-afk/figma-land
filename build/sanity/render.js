import { load } from 'cheerio';
import { createImageUrlBuilder } from '@sanity/image-url';

const anchors = new Set(['hero', 'features', 'workflow', 'operations', 'business', 'pricing', 'subscribe', 'contact']);
const iconNames = new Set(['management', 'support', 'collaborative']);

function destination(value) {
  if (typeof value !== 'string') return '#';
  if (value === '#' || (value.startsWith('#') && anchors.has(value.slice(1)))) return value;
  if (/^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d()-]+)$/.test(value)) return value;
  return '#';
}

export function renderLanding(html, content, imageConfig) {
  const { settings, page } = content || {};
  if (!settings || !page || !page.heroTitle || !settings.title) {
    throw new Error('Publish Site settings and Landing page in Sanity before building the site.');
  }
  const $ = load(html);
  const imageBuilder = createImageUrlBuilder(imageConfig);
  const setText = (element, value) => element.text(value ?? '');
  const paragraph = (element, value) => element.empty().append($('<p>').text(value ?? ''));
  const applyLink = (element, value, { label = true } = {}) => {
    const href = destination(value?.href);
    element.attr('href', href).removeClass('js--placeholder js--scroll-link');
    if (href === '#') element.addClass('js--placeholder');
    else if (href.startsWith('#')) element.addClass('js--scroll-link');
    if (label) setText(element, value?.label);
    // Existing external-only targets must not survive a change to an anchor.
    if (!/^https?:/.test(href)) element.removeAttr('target rel');
    if (element.attr('aria-label')) element.attr('aria-label', value?.label ?? '');
    return element;
  };
  const applyActions = (container, values) => {
    const templates = container.find('a').toArray().map((item) => $(item).clone());
    container.empty();
    (values || []).slice(0, 2).forEach((value, index) => {
      const template = templates[index] || templates[0];
      if (template) container.append(applyLink(template.clone(), value));
    });
  };
  const imageData = (value, maxWidth) => {
    if (!value?.asset?._id) return null;
    const dimensions = value.asset.metadata?.dimensions;
    if (!dimensions?.width || !dimensions?.height) throw new Error('Sanity image dimensions are missing.');
    const crop = value.crop || {};
    const width = Math.round(dimensions.width * (1 - (crop.left || 0) - (crop.right || 0)));
    const height = Math.round(dimensions.height * (1 - (crop.top || 0) - (crop.bottom || 0)));
    const cap = Math.min(maxWidth, width);
    const url = (size) => imageBuilder.image(value).width(size).fit('max').auto('format').url();
    const sizes = [...new Set([320, 640, 960, cap].filter((size) => size <= cap))].sort((a, b) => a - b);
    return {src: url(cap), srcset: sizes.map((size) => `${url(size)} ${size}w`).join(', '), width, height};
  };
  const applyImage = (container, value, mobileValue, maxWidth) => {
    const data = imageData(value, maxWidth);
    if (!data) return; // Local template images are the explicit fallback for optional CMS images.
    const img = container.find('img').attr({
      src: data.src, srcset: data.srcset, sizes: `(max-width: 991px) calc(100vw - 40px), ${maxWidth}px`,
      width: data.width, height: data.height, alt: value.alt ?? '',
    });
    const mobile = imageData(mobileValue, 960);
    if (mobile) {
      if (!img.parent().is('picture')) img.wrap('<picture></picture>');
      const picture = img.parent();
      picture.find('source').remove();
      picture.prepend($('<source>').attr({media: '(max-width: 991px)', srcset: mobile.srcset,
        sizes: 'calc(100vw - 40px)', width: mobile.width, height: mobile.height}));
    } else container.find('source').remove();
  };

  setText($('title'), settings.title);
  $('meta[name="description"]').attr('content', settings.description ?? '');
  $('.o-header__logo img').attr('alt', settings.title);
  const navTemplate = $('.o-header__nav a').first().clone();
  $('.o-header__nav').empty();
  (settings.navigation || []).forEach((value) => $('.o-header__nav').append(applyLink(navTemplate.clone(), value)));
  applyLink($('.o-header__actions > a'), settings.headerAction);
  const portfolio = $('.c-button__portfolio');
  const arrow = portfolio.find('svg').clone();
  applyLink(portfolio, settings.portfolioLink).append(arrow);

  const heroTitle = $('.s-hero__title');
  // Keep the design's responsive breaks while the original heading is unchanged.
  if (heroTitle.text().replace(/\s+/g, ' ').trim() !== page.heroTitle.trim()) {
    heroTitle.empty();
    page.heroTitle.split('\n').forEach((line, index) => {
      if (index) heroTitle.append('<br>');
      const span = $('<span>').text(line);
      heroTitle.append(span.contents());
    });
  }
  paragraph($('.s-hero__description'), page.heroDescription);
  applyActions($('.s-hero__actions'), page.heroActions);
  applyImage($('.s-hero__screen'), page.heroImage, page.heroMobileImage, 1100);
  setText($('.s-features__title'), page.featuresTitle);
  const featureTemplates = $('.c-feature-card').toArray().map((item) => $(item).clone());
  $('.s-features__cards').empty();
  (page.features || []).forEach((feature, index) => {
    const card = featureTemplates[index === 1 ? 1 : 0].clone();
    setText(card.find('h3'), feature.title);
    paragraph(card.find('.c-feature-card__description'), feature.description);
    const icon = iconNames.has(feature.icon) ? feature.icon : 'management';
    card.find('use').attr('href', `/src/images/icons/features.svg#${icon}`);
    card.find('svg').attr('height', icon === 'collaborative' ? '50.7273' : '62');
    card.find('.c-feature-card__icon').removeClass('c-feature-card__icon-support c-feature-card__icon-collaborative')
      .addClass(icon === 'support' ? 'c-feature-card__icon-support' : icon === 'collaborative' ? 'c-feature-card__icon-collaborative' : '');
    applyLink(card.find('a'), feature.action);
    $('.s-features__cards').append(card);
  });

  const sections = new Map((page.contentSections || []).map((section) => [section.anchor, section]));
  for (const anchor of ['workflow', 'operations', 'business']) {
    const section = sections.get(anchor);
    const container = $(`#${anchor}`);
    if (!section) { container.remove(); continue; }
    const heading = container.find('h2').empty();
    if (section.mobileTitle) heading.append($('<span class="s-content__mobile">').text(section.mobileTitle));
    heading.append(section.mobileTitle ? $('<span class="s-content__desktop">').text(section.title) : $('<span>').text(section.title).contents());
    const description = container.find('.s-content__description').empty();
    if (section.mobileDescription) description.append($('<p class="s-content__mobile">').text(section.mobileDescription));
    description.append($('<p>').toggleClass('s-content__desktop', Boolean(section.mobileDescription)).text(section.description ?? ''));
    applyActions(container.find('.s-content__actions'), section.actions);
    applyImage(container.find('.s-content__image'), section.image, section.mobileImage, anchor === 'business' ? 1200 : 720);
  }

  setText($('.s-pricing__title'), page.pricingTitle);
  paragraph($('.s-pricing__description'), page.pricingDescription);
  const planTemplate = $('.c-pricing-card').first().clone();
  $('.s-pricing__cards').empty();
  (page.pricingPlans || []).filter(Boolean).forEach((plan, index) => {
    const card = planTemplate.clone();
    const titleId = `pricing-plan-${index}-title`;
    card.attr('aria-labelledby', titleId);
    setText(card.find('h3').attr('id', titleId), plan.title);
    paragraph(card.find('.c-pricing-card__description'), plan.description);
    applyImage(card.find('.c-pricing-card__image'), plan.image, null, 524);
    setText(card.find('.c-pricing-card__amount'), plan.amount);
    setText(card.find('.c-pricing-card__currency'), plan.currency);
    setText(card.find('.c-pricing-card__period'), plan.period);
    card.find('.c-pricing-card__price').attr('aria-label', `${plan.currency ?? ''}${plan.amount ?? ''} ${plan.period ?? ''}`);
    const features = card.find('ul').empty().attr('aria-label', `${plan.title} plan features`);
    (plan.features || []).forEach((feature) => {
      const li = $('<li>').text(feature.label ?? '');
      if (feature.included === false) li.addClass('c-pricing-card__feature--unavailable')
        .prepend($('<span class="sr-only">').text('Not included: '));
      features.append(li);
    });
    applyLink(card.find('a'), plan.action).attr('aria-label', `${plan.action?.label ?? 'Order'}: ${plan.title}`);
    $('.s-pricing__cards').append(card);
  });

  setText($('.s-subscribe__title'), page.subscribeTitle);
  paragraph($('.s-subscribe__description'), page.subscribeDescription);
  $('#subscribe-email').attr('placeholder', page.subscribePlaceholder ?? '');
  setText($('.s-subscribe__form button'), page.subscribeButtonLabel);
  const labels = new Map([...(settings.navigation || []), settings.headerAction].filter(Boolean).map((link) => [link.href, link.label]));
  $('.o-footer__link[href^="#"]').each((_, item) => {
    const label = labels.get($(item).attr('href'));
    if (label) setText($(item), label);
  });
  paragraph($('.o-footer__caption'), settings.footerCaption);
  const location = settings.mapLocation || settings.address || '';
  $('.o-footer__map iframe').attr({
    src: `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=14&output=embed`,
    title: `Interactive Google Map of ${location}`,
  });
  const contacts = $('.o-footer__contact a');
  contacts.eq(0).text(settings.address ?? '').attr('href', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`);
  contacts.eq(1).text(settings.phone ?? '').attr('href', destination(`tel:${settings.phoneLink ?? ''}`));
  $('.o-footer__social').each((_, item) => {
    const element = $(item);
    const value = (settings.socialLinks || []).find((link) => link.label === element.attr('aria-label'));
    applyLink(element, value || {label: element.attr('aria-label'), href: '#'}, {label: false});
  });
  // An editor can remove a section without leaving unusable anchor links behind.
  $('a.js--scroll-link').each((_, item) => {
    if (!$(destination($(item).attr('href'))).length) $(item).remove();
  });
  return $.html();
}
