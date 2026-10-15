import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sanityContent } from './build/sanity/plugin.js';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const assetTypes = {
  images: /\.(avif|gif|ico|jpe?g|png|svg|webp|bmp|tiff?)$/i,
  fonts: /\.(woff2?|ttf|otf|eot)$/i,
  media: /\.(mp4|webm|ogv|mov|mp3|wav|ogg|flac|aac|m4a)$/i,
};

function assetFileNames(asset) {
  const name = asset.names[0] ?? asset.originalFileNames[0] ?? '';
  if (/\.css$/i.test(name)) return 'assets/css/[name]-[hash][extname]';

  const type = Object.keys(assetTypes).find((key) => assetTypes[key].test(name)) ?? 'files';
  // Vite provides source paths for imported assets. Keep folders below src/images,
  // src/fonts, etc.; assets outside these roots go directly into their type folder.
  const sourcePaths = asset.originalFileNames.map((file) =>
    path.relative(projectRoot, path.resolve(projectRoot, file)).replaceAll('\\', '/'),
  ).sort();
  const source = sourcePaths.find((file) => file.startsWith(`src/${type}/`));
  const subdirectory = source ? path.posix.dirname(source.slice(`src/${type}/`.length)) : '.';
  const directory = subdirectory === '.' ? `assets/${type}` : `assets/${type}/${subdirectory}`;
  return `${directory}/[name]-[hash][extname]`;
}

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0,
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
      },
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames,
      },
    },
  },
  plugins: [sanityContent(), tailwindcss()],
  server: { host: '0.0.0.0', port: 8001, strictPort: true },
  preview: { host: '0.0.0.0', port: 8002, strictPort: true },
});


