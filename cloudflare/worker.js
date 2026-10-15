import generated from './generated.json' with { type: 'json' };
import { landingQuery } from '../build/sanity/query.js';
import { renderCloudflare } from './render.js';

const snapshotKey = `page:${generated.version}`;

async function authorized(request, expected) {
  const actual = request.headers.get('x-publish-token');
  if (!expected || !actual || actual.length > 1024) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([actual, expected].map(value =>
    crypto.subtle.digest('SHA-256', encoder.encode(value)).then(hash => new Uint8Array(hash))));
  return left.reduce((difference, byte, index) => difference | (byte ^ right[index]), 0) === 0;
}

export async function handleRequest(request, env, fetchContent = fetch) {
  const url = new URL(request.url);
  if (url.pathname === '/__sanity/publish') {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    if (!await authorized(request, env.PUBLISH_TOKEN)) return new Response('Unauthorized', { status: 401 });
    try {
      const api = new URL(`https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2026-10-15/data/query/${env.SANITY_DATASET}`);
      api.searchParams.set('perspective', 'published');
      api.searchParams.set('query', landingQuery);
      const response = await fetchContent(api, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Sanity returned HTTP ${response.status}`);
      const { result } = await response.json();
      const html = renderCloudflare(generated.template, result, {
        projectId: env.SANITY_PROJECT_ID, dataset: env.SANITY_DATASET,
      });
      const updatedAt = new Date().toISOString();
      // Replace the last successful snapshot only after the complete HTML is ready.
      await env.SITE_HTML.put(snapshotKey, JSON.stringify({ html, updatedAt }));
      return Response.json({ ok: true, updatedAt }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error('Cloudflare publish failed:', error.message);
      return Response.json({ ok: false, error: 'Publication failed; the previous page is preserved.' }, { status: 503 });
    }
  }
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
  if (url.pathname === '/index.html') return Response.redirect(new URL('/', url).href, 301);
  if (url.pathname !== '/') return env.ASSETS.fetch(request);
  try {
    const snapshot = await env.SITE_HTML.get(snapshotKey, 'json');
    return new Response(request.method === 'HEAD' ? null : snapshot?.html || generated.initialHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Updated': snapshot?.updatedAt || 'initial-deployment',
      },
    });
  } catch {
    return new Response(request.method === 'HEAD' ? null : generated.initialHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}

export default { fetch: (request, env) => handleRequest(request, env) };
