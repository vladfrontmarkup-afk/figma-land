import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-10-15'}).withConfig({useCdn: false})
const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
const text = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim()
const byClass = (source, className) => text(source.match(
  new RegExp(`<[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`),
)?.[1])
const section = (id) => html.match(new RegExp(`<section[^>]+id="${id}"[\\s\\S]*?<\\/section>`))?.[0] ?? ''
const link = (label, href, key) => ({_type: 'link', ...(key ? {_key: key} : {}), label, href})
const actions = (source) => [...source.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
  .map((match, index) => link(text(match[2]), match[1].replace(/&amp;/g, '&'), `action-${index}`))
const image = async (source, alt = '') => {
  const asset = await client.assets.upload('image', await readFile(new URL(`../../${source}`, import.meta.url)),
    {filename: source.split('/').pop()})
  return {_type: 'contentImage', alt, asset: {_type: 'reference', _ref: asset._id}}
}
const existing = (type) => client.fetch('*[_type == $type]{_id, title}', {type})

// Source content is public landing-page copy. Existing documents are never replaced.
const plans = await existing('pricingPlan')
const pricingPlans = []
const pricing = section('pricing')
const cards = [...pricing.matchAll(/<article\b[\s\S]*?<\/article>/g)]
for (const [index, match] of cards.entries()) {
  const card = match[0]
  const title = byClass(card, 'c-pricing-card__title')
  let plan = plans.find((item) => item.title === title)
  if (!plan) {
    const imagePath = card.match(/<img src="\/([^"]+)"/)?.[1]
    plan = await client.create({
      _type: 'pricingPlan', title,
      description: byClass(card, 'c-pricing-card__description'),
      image: await image(imagePath),
      amount: Number(byClass(card, 'c-pricing-card__amount')),
      currency: byClass(card, 'c-pricing-card__currency'),
      period: byClass(card, 'c-pricing-card__period'),
      features: [...card.matchAll(/<li([^>]*)>([\s\S]*?)<\/li>/g)].map((item, featureIndex) => ({
        _type: 'planFeature', _key: `feature-${featureIndex}`,
        label: text(item[2]).replace(/^Not included: /, ''),
        included: !item[1].includes('unavailable'),
      })),
      action: actions(card)[0],
    })
  }
  pricingPlans.push({_type: 'reference', _key: `plan-${index}`, _ref: plan._id.replace(/^drafts\./, '')})
}

if (!await client.getDocument('siteSettings') && !await client.getDocument('drafts.siteSettings')) {
  const navigation = html.match(/<nav class="o-header__nav[\s\S]*?<\/nav>/)?.[0] ?? ''
  await client.createIfNotExists({
    _id: 'siteSettings', _type: 'siteSettings', title: 'Figma Land',
    description: html.match(/<meta name="description" content="([^"]+)"/)?.[1],
    navigation: actions(navigation), headerAction: link('Subscribe', '#subscribe'),
    portfolioLink: link('Upwork profile', html.match(/class="c-button c-button__portfolio" href="([^"]+)"/)?.[1]),
    footerCaption: byClass(html, 'o-footer__caption'),
    address: 'San Francisco, CA', mapLocation: 'San Francisco, CA',
    phone: '(239) 555-0108', phoneLink: '+12395550108',
    socialLinks: ['Twitter', 'Facebook', 'LinkedIn'].map((label) => link(label, '#', label.toLowerCase())),
  })
}

if (!await client.getDocument('landingPage') && !await client.getDocument('drafts.landingPage')) {
  const hero = section('hero')
  const contentSections = []
  for (const anchor of ['workflow', 'operations', 'business']) {
    const source = section(anchor)
    const imagePath = source.match(/<img src="\/([^"]+)"/)?.[1]
    const mobilePath = source.match(/<source[^>]*srcset="\/([^"]+)"/)?.[1]
    const heading = source.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? ''
    const description = source.match(/<div class="s-content__description">([\s\S]*?)<\/div>/)?.[1] ?? ''
    contentSections.push({
      _key: anchor, _type: 'contentSection', anchor,
      title: byClass(heading, 's-content__desktop') || text(heading),
      ...(heading.includes('s-content__mobile') ? {mobileTitle: byClass(heading, 's-content__mobile')} : {}),
      description: byClass(description, 's-content__desktop') || text(description),
      ...(description.includes('s-content__mobile') ? {mobileDescription: byClass(description, 's-content__mobile')} : {}),
      image: await image(imagePath, source.match(/<img[^>]*alt="([^"]*)"/)?.[1]),
      ...(mobilePath ? {mobileImage: await image(mobilePath)} : {}),
      actions: actions(source),
    })
  }
  const features = [...section('features').matchAll(/<article\b[\s\S]*?<\/article>/g)].map((match, index) => ({
    _key: `feature-${index}`, _type: 'feature',
    title: byClass(match[0], 'c-feature-card__title'),
    description: byClass(match[0], 'c-feature-card__description'),
    icon: match[0].match(/features\.svg#([^"]+)/)?.[1], action: actions(match[0])[0],
  }))
  await client.createIfNotExists({
    _id: 'landingPage', _type: 'landingPage',
    heroTitle: byClass(hero, 's-hero__title'), heroDescription: byClass(hero, 's-hero__description'),
    heroImage: await image('src/images/hero/dashboard.webp', hero.match(/<img[^>]*alt="([^"]*)"/)?.[1]),
    heroMobileImage: await image('src/images/hero/dashboard-mobile.webp'), heroActions: actions(hero),
    featuresTitle: byClass(html, 's-features__title'), features, contentSections,
    pricingTitle: byClass(pricing, 's-pricing__title'),
    pricingDescription: byClass(pricing, 's-pricing__description'), pricingPlans,
    subscribeTitle: byClass(html, 's-subscribe__title'),
    subscribeDescription: byClass(html, 's-subscribe__description'),
    subscribePlaceholder: html.match(/name="email"[^>]*placeholder="([^"]+)"/)?.[1],
    subscribeButtonLabel: 'Subscribe',
  })
}
console.log('Starter content is ready: site settings, landing page, and three pricing plans.')
