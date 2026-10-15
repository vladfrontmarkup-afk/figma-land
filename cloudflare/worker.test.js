import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from './worker.js';

function environment() {
  const values = new Map();
  return {
    PUBLISH_TOKEN: 'test-token-only', SANITY_PROJECT_ID: 'n9ojwqp4', SANITY_DATASET: 'production',
    SITE_HTML: { get: async key => values.has(key) ? JSON.parse(values.get(key)) : null,
      put: async (key, value) => values.set(key, value) },
    ASSETS: { fetch: async () => new Response('static asset') },
  };
}
const publishRequest = (token = 'test-token-only') => new Request('https://test.workers.dev/__sanity/publish', {
  method: 'POST', headers: { 'x-publish-token': token },
});
const content = { settings: { title: 'Published Cloudflare title', navigation: [] },
  page: { heroTitle: 'Published Cloudflare heading', features: [], contentSections: [], pricingPlans: [] } };

test('serves a complete initial HTML page without querying Sanity', async () => {
  const response = await handleRequest(new Request('https://test.workers.dev/'), environment(), () => { throw Error('Unexpected CMS query'); });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<h1/);
});
test('rejects unauthorized publishing before reading CMS or replacing the page', async () => {
  const response = await handleRequest(publishRequest('wrong'), environment(), () => { throw Error('Unexpected CMS query'); });
  assert.equal(response.status, 401);
});
test('publishes complete HTML and retains it when Sanity later fails', async () => {
  const env = environment();
  const publish = await handleRequest(publishRequest(), env, async () => Response.json({ result: content }));
  assert.equal(publish.status, 200);
  let page = await handleRequest(new Request('https://test.workers.dev/'), env, () => { throw Error('Unexpected CMS query'); });
  assert.match(await page.text(), /Published Cloudflare heading/);
  const failed = await handleRequest(publishRequest(), env, async () => new Response('Unavailable', { status: 503 }));
  assert.equal(failed.status, 503);
  page = await handleRequest(new Request('https://test.workers.dev/'), env);
  assert.match(await page.text(), /Published Cloudflare heading/);
});
test('serves assets and handles HEAD without querying Sanity', async () => {
  const env = environment();
  assert.equal(await (await handleRequest(new Request('https://test.workers.dev/assets/main.css'), env)).text(), 'static asset');
  assert.equal(await (await handleRequest(new Request('https://test.workers.dev/', { method: 'HEAD' }), env)).text(), '');
});
