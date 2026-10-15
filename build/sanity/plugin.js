import { createClient } from '@sanity/client';
import { loadEnv } from 'vite';
import { landingQuery } from './query.js';
import { renderLanding } from './render.js';

export function sanityContent() {
  let config;
  let client;
  let pending;
  let fetchedAt = 0;
  let enabled = true;
  let imageConfig;

  return {
    name: 'sanity-landing-content',
    configResolved(resolved) {
      config = resolved;
      const env = loadEnv(config.mode, config.envDir, 'SANITY_');
      enabled = env.SANITY_ENABLED !== 'false';
      if (!enabled) return;
      imageConfig = {
        projectId: env.SANITY_PROJECT_ID || 'n9ojwqp4',
        dataset: env.SANITY_DATASET || 'production',
      };
      client = createClient({
        ...imageConfig,
        apiVersion: '2026-10-15',
        useCdn: false,
        perspective: 'published',
        timeout: 10000,
        maxRetries: 2,
      });
    },
    transformIndexHtml: {
      // Render before Vite scans image paths and bundles the page assets.
      order: 'pre',
      async handler(html) {
        if (!enabled) return html;
        if (!pending || (config.command === 'serve' && Date.now() - fetchedAt > 5000)) {
          fetchedAt = Date.now();
          pending = client.fetch(landingQuery).catch((error) => {
            pending = undefined;
            throw new Error(`Could not load published Sanity content: ${error.message}`, { cause: error });
          });
        }
        return renderLanding(html, await pending, imageConfig);
      },
    },
  };
}
