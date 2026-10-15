import { build } from 'vite';
import { createClient } from '@sanity/client';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { landingQuery } from '../build/sanity/query.js';
import { renderCloudflare } from './render.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const imageConfig = { projectId: 'n9ojwqp4', dataset: 'production' };
// Preserve all local component templates; the independent Worker renders CMS content.
process.env.SANITY_ENABLED = 'false';
await build({ root, build: { outDir: 'cloudflare/public' } });
const template = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');
const client = createClient({ ...imageConfig, apiVersion: '2026-10-15', useCdn: false, perspective: 'published' });
const content = await client.fetch(landingQuery);
const initialHtml = renderCloudflare(template, content, imageConfig);
const version = createHash('sha256').update(template).digest('hex').slice(0, 20);
await writeFile(new URL('./generated.json', import.meta.url), JSON.stringify({ template, initialHtml, version }));
console.log('Cloudflare files are ready. GitHub configuration and root dist were not changed.');
