import { defineQuery } from 'groq';

const image = `alt, crop, hotspot, asset->{_id, metadata{dimensions{width, height}}}`;
const link = '_key, label, href';

export const landingQuery = defineQuery(`{
  "settings": *[_id == "siteSettings"][0]{
    title, description, navigation[]{${link}}, headerAction{${link}}, portfolioLink{${link}},
    footerCaption, address, phone, phoneLink, mapLocation, socialLinks[]{${link}}
  },
  "page": *[_id == "landingPage"][0]{
    heroTitle, heroDescription, heroImage{${image}}, heroMobileImage{${image}},
    heroActions[]{${link}}, featuresTitle,
    features[]{_key, title, description, icon, action{${link}}},
    contentSections[]{
      _key, anchor, title, mobileTitle, description, mobileDescription,
      image{${image}}, mobileImage{${image}}, actions[]{${link}}
    },
    pricingTitle, pricingDescription,
    pricingPlans[]->{
      _id, title, description, amount, currency, period, image{${image}},
      features[]{_key, label, included}, action{${link}}
    },
    subscribeTitle, subscribeDescription, subscribePlaceholder, subscribeButtonLabel
  }
}`);
