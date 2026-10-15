import { renderLanding } from '../build/sanity/render.js';

export function renderCloudflare(template, content, imageConfig) {
  // Vite has already fingerprinted the sprite; preserve that path on CMS updates.
  const sprite = template.match(/href="([^"]*features[^"#]*\.svg)#/)?.[1];
  const html = renderLanding(template, content, imageConfig);
  return sprite ? html.replaceAll('/src/images/icons/features.svg#', `${sprite}#`) : html;
}
