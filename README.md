# Figma Land

A responsive, single-page landing page built with HTML, Tailwind CSS 4 and vanilla JavaScript, bundled with Vite. The design source is the local Figma export in `figma/`.

## Requirements

- Node.js 22.12+ within the 22.x release line, or Node.js 24+.
- npm.

## Development

Install the locked dependencies and start Vite:

```sh
npm ci
npm run dev
```

Open [http://localhost:8001](http://localhost:8001). Vite updates the page when source files change; no initial build is required. The Network URL printed in the terminal can be used from another device on the same network.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run watch` | Alias for the development server. |
| `npm run build` | Build the landing page into `dist/`. |
| `npm run build:watch` | Rebuild production output when source files change. |
| `npm run preview` | Serve the production build at [http://localhost:8002](http://localhost:8002). |
| `npm run check` | Check entry/config JavaScript syntax and run the production build. |

## Structure

- `index.html`: the only page, containing the header, hero, features, content sections, pricing, subscription form and footer.
- `src/css/style.css`: the page stylesheet and component imports.
- `src/css/common.css`: Tailwind, theme, fonts, base elements and utilities.
- `src/css/1-Settings/`: theme and local font declarations.
- `src/css/2-Elements/`: base element styles.
- `src/css/3-Components/`: shared buttons, links, input, cards and animated gradient.
- `src/css/4-Sections/`: section layouts.
- `src/css/5-Organisms/`: header and footer styles.
- `src/css/6-Utilities/`: container and numeric text-size utilities.
- `src/js/app.js`: page initialization and anchor navigation.
- `src/js/components/`: mobile header, gradient animation and subscription form behavior.
- `src/images/`: WebP assets and SVG icon sprites.
- `src/fonts/`: local Poppins and Roboto WOFF2 files and their licenses.
- `vite.config.js`: development ports, the HTML entry point and production asset paths.

## Sanity Studio

The content editor is a separate application in `studio/`, connected to project `n9ojwqp4`
and the public `production` dataset. The existing landing page still uses its local HTML;
connecting frontend rendering and deployment webhooks is a separate integration step.

```sh
npm --prefix studio ci
npm run studio:dev
```

Open [http://localhost:3333](http://localhost:3333) and sign in with your Sanity account.
Edit global navigation and contacts in **Site settings**, section content in **Landing page**,
and individual plans in **Pricing plans**. Images support alternative text and hotspot selection.
The subscription form still needs a separate subscription service.

After changing schemas, validate the Studio and deploy the schema manifest:

```sh
npm --prefix studio run check
npm --prefix studio run schema:deploy
```

Initial content can be imported from the current `index.html` and local images after CLI login:

```sh
cd studio
npx sanity login
npm run seed
```

The seed command creates missing starter documents and preserves existing content.
Studio dependencies and build output are separate from the landing page. Commit both lockfiles.
Never store authentication tokens in tracked files or browser code. The public dataset is for
website content, not subscription addresses or private information.

## Behavior

- The fixed header shrinks on scroll. Its mobile menu supports Escape, keyboard focus management, scroll locking and an inert page background.
- Anchor links account for the header height and scroll without adding a hash to the URL.
- The hero and highlighted feature card share an animated gradient. Animation pauses outside the viewport or while the page is inactive, resumes without catching up, and respects reduced-motion and data-saving preferences.
- Buttons and links have visible keyboard focus states and smooth hover transitions.
- The footer embeds an interactive Google Map of San Francisco with lazy loading.
- The subscription form validates email addresses locally. A subscription service is not connected; submitting a valid address displays an unavailable message and does not send the address.
- Pricing order buttons and social profile links remain placeholders. Contact details should be replaced with the site's final details before publishing.

## Production

```sh
npm run check
npm run preview
```

Deploy the complete contents of `dist/` to a static web server. Node.js is not needed on the hosting server. Serve the build over HTTP or HTTPS rather than opening HTML through `file://`.

Vite bundles CSS and JavaScript and rewrites referenced asset URLs. Output is grouped under `assets/css`, `assets/js`, `assets/images` and `assets/fonts`; image and font subfolders are preserved. Filenames include content hashes for cache invalidation. Relative asset paths support deployment in subdirectories.

There is one HTML entry point. Dependencies are pinned in `package-lock.json`; use `npm ci` for reproducible installations. Keep the font license files when distributing the site.
