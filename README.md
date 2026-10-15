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
| `npm test` | Test CMS rendering, safe text/links, responsive content, and image handling. |
| `npm run check` | Check JavaScript syntax, run CMS rendering tests and the production build. |

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
- `build/sanity/`: published content query, HTML renderer, Vite plugin and rendering tests.

## Sanity Studio

The content editor is a separate application in `studio/`, connected to project `n9ojwqp4`
and the public `production` dataset. A Vite plugin fetches published content and renders it
into the HTML before bundling. The browser receives complete HTML and makes no CMS API requests.
Existing CSS, animations, section IDs, and responsive layouts stay in the local template.

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

### Frontend content updates

Edit content in Studio and click **Publish**, then run `npm run build` (or `npm run check`).
Drafts are never included. In development, refresh the page after publishing; content is cached
for up to five seconds. Production pages change only after rebuilding and deploying `dist/`.
A Sanity webhook can trigger the GitHub Pages workflow described below.

The public project identifiers default to this project. Copy `.env.example` to `.env` to
override `SANITY_PROJECT_ID` or `SANITY_DATASET`. No read token is required for this public dataset.
Requests use the uncached API so builds include the latest published content.
A failed request or missing published singleton stops the build instead of deploying stale content.
For explicit offline work with the original local HTML, set `SANITY_ENABLED=false` in `.env`.

CMS text is escaped. Link destinations are checked, and page anchors retain smooth scrolling.
Images use Sanity's image CDN with responsive sizes, crop data, alternative text, and reserved
dimensions; optional images without a CMS asset use the local template fallback.
Hero line breaks from the original design remain while its text is unchanged; edited headings
wrap naturally and also support newline characters. Content section layout is selected by its
fixed anchor (`workflow`, `operations`, `business`). Removing a section removes links to it.
Social links match the existing icon labels: `Twitter`, `Facebook`, and `LinkedIn`.

The footer navigation shares labels with the header; its grouping stays in the template.
The logo, favicon, icon sprites, button styles, and map embed behavior remain code-owned.
The subscription form still validates locally and requires a separate subscription service.

## Behavior

- The fixed header shrinks on scroll. Its mobile menu supports Escape, keyboard focus management, scroll locking and an inert page background.
- Anchor links account for the header height and scroll without adding a hash to the URL.
- The hero and highlighted feature card share an animated gradient. Animation pauses outside the viewport or while the page is inactive, resumes without catching up, and respects reduced-motion and data-saving preferences.
- Buttons and links have visible keyboard focus states and smooth hover transitions.
- The footer embeds an interactive Google Map of San Francisco with lazy loading.
- The subscription form validates email addresses locally. A subscription service is not connected; submitting a valid address displays an unavailable message and does not send the address.
- Pricing order buttons and social profile links remain placeholders. Contact details should be replaced with the site's final details before publishing.

## Production

### GitHub Pages

Public site: https://vladfrontmarkup-afk.github.io/figma-land/
Hosted editor: https://vladfrontmarkup-figma-land.sanity.studio/

`deployment/github-pages.yml` is installed as `.github/workflows/deploy-site.yml` in the
separate `vladfrontmarkup-afk.github.io` repository. It checks out that complete website,
builds this public source repository with published Sanity data, replaces only the staged
`figma-land/` directory, and deploys the whole website artifact. Other projects remain included.
The workflow does not commit generated output; the local/committed `figma-land/` folder is
no longer the source of truth for the deployed Figma Land pages.

One-time activation:

1. Commit and push the workflow to `main` in `vladfrontmarkup-afk.github.io`.
2. In that repository's **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Run **Actions → Publish website with Figma Land → Run workflow** on `main` and confirm success.
4. Create a fine-grained GitHub personal access token scoped only to `vladfrontmarkup-afk.github.io`,
   with repository **Actions: Read and write**. Set an expiry and renew it before it expires.
5. Open Sanity Manage → project `n9ojwqp4` → API → Webhooks → **Publish Figma Land on GitHub Pages**.
   Add the header `Authorization: Bearer YOUR_TOKEN`, save, and enable the webhook.
   Enter the token directly in Sanity Manage; never put it in source files, URLs, or chat.
6. Publish a content update in Studio, check the GitHub Actions run, then verify the public page.

The webhook is initially disabled. Its tracked configuration is `studio/github-webhook.json`;
it sends `{"ref":"main"}` to the workflow-dispatch endpoint, only for published website documents.
Provision it after Sanity CLI login with `npm --prefix studio run webhook:setup`.
Repeated provisioning preserves the existing hook and its private headers.

The source defaults to `feature/sanity-integration`, because `main` does not yet contain the CMS
integration. To switch after merging, set the website repository variable `FIGMA_LAND_SOURCE_REF`
to `main` in Settings → Secrets and variables → Actions → Variables.
Content publishing, a push to the website repository's `main`, or a manual workflow run rebuilds
the website. A push only to the Figma Land source repository requires a subsequent manual run
or content publication. Updates appear after Actions deployment completes, not instantly.

To redeploy the editor after schema changes, run `npm --prefix studio run deploy`.
Sanity account permissions protect editor access; published website content remains public.

### Local production preview

```sh
npm run check
npm run preview
```

Deploy the complete contents of `dist/` to a static web server. Node.js is not needed on the hosting server. Serve the build over HTTP or HTTPS rather than opening HTML through `file://`.

Vite bundles CSS and JavaScript and rewrites referenced asset URLs. Output is grouped under `assets/css`, `assets/js`, `assets/images` and `assets/fonts`; image and font subfolders are preserved. Filenames include content hashes for cache invalidation. Relative asset paths support deployment in subdirectories.

There is one HTML entry point. Dependencies are pinned in `package-lock.json`; use `npm ci` for reproducible installations. Keep the font license files when distributing the site.
