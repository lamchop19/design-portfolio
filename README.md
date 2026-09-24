# marcalam.com

Design portfolio for Marc Alam. Next.js App Router, statically exported and served
from GitHub Pages. Replaces the previous Framer site.

## Running it

```sh
npm install
npm run dev          # generates images, then starts the dev server
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Image pipeline, then dev server |
| `npm run build` | Images, OG cards, then static export to `out/` |
| `npm start` | Serves `out/` — what GitHub Pages actually does |
| `npm run new-project -- "Name"` | Scaffolds and registers a case study |
| `npm run images` | Regenerates image derivatives |
| `npm run og` | Regenerates Open Graph cards |
| `npm run typecheck` / `npm run lint` | |

## Adding work

See [`content/README.md`](content/README.md). In short: `npm run new-project`,
fill in `meta.ts`, write `body.mdx`, drop images in `assets/`.

## How it's put together

**Content** lives in `content/`, entirely separate from `src/`. Project metadata
sits in `meta.ts` files validated by a zod schema, so a malformed case study
fails the build rather than rendering blank. Prose is MDX.

**Images** are optimized at build time by `scripts/optimize-images.mjs`, which
emits one AVIF per configured width plus a blur placeholder. A custom `next/image`
loader (`src/lib/image-loader.ts`) points at those files, so we keep srcset, lazy
loading and blur-up without an optimization server. The widths in that script must
stay in sync with `images.deviceSizes`/`imageSizes` in `next.config.ts`.

**Color** derives from the footer grid artwork. White is the primary surface; blue,
pink and green are accents on it. They are not interchangeable — contrast on white
decides what each may do:

| | on white | allowed |
| --- | --- | --- |
| blue `#0059FF` | 5.42:1 | text, links, any interactive accent |
| pink `#F551AB` | 3.16:1 | large text only, or a fill with dark ink on it |
| green `#81DB89` | 1.69:1 | decorative fills only — never text on white |

So `--accent` (links, hovers, focus rings) is always blue. Pink and green appear in
the grid band and as block fills. Dark mode lifts blue to `#4D8CFF`, since the
original only reaches 3.58:1 on the dark surface; pink and green pass unchanged.

The grid band itself is `PixelGrid` — the 8-cell unit `B.P..GB.` over `.B.PG..B`,
drawn as one repeating gradient per row. It heads the footer, and a single-row
variant rules off the hero.

**Motion** uses no animation library. Word reveals, figure rise-ins and the
reading-progress bar are CSS — the hero is the LCP element, and gating it on a JS
library delayed the largest paint until hydration. Page transitions and the
cover→hero morph use the native View Transitions API via React's `<ViewTransition>`.
The one exception is the cursor-tracked preview on the work index, which runs a
small hand-rolled spring in `work-index.tsx`.

Everything positional degrades under `prefers-reduced-motion`, and the
scroll-driven effects are wrapped in `@supports` so unsupported browsers get
static content rather than nothing.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages.

The base path is env-driven (`NEXT_PUBLIC_BASE_PATH`), resolved by
`actions/configure-pages`. While this is a project site it builds under
`/design-portfolio`; once marcalam.com is attached as a custom domain it becomes
root automatically. Use `asset()` from `src/lib/paths.ts` for any plain `<a href>`
pointing at a file in `public/` — `next/link` and `next/image` handle it themselves.

### Before the first deploy

1. **Enable Pages**: repo Settings → Pages → Source: **GitHub Actions**.
2. **Repo visibility**: Pages on a private repo requires a paid GitHub plan. Make
   the repo public, or upgrade.

### Cutting the domain over

Do this last, once the site is ready — marcalam.com keeps pointing at Framer
until then.

1. Add `marcalam.com` in Settings → Pages → Custom domain (this commits a `CNAME`
   file for you).
2. Point DNS at GitHub: `A` records to `185.199.108–111.153`, and a `CNAME` on
   `www` to `lamchop19.github.io`.
3. Wait for the check to pass, then tick **Enforce HTTPS**.

## Known gaps

- Case study covers: only tech@nyu has one, and it's a generated placeholder.
- Copy is migrated from Framer and needs Marc's pass; the bio is out of date.
- The resume link is commented out in `content/site.ts` until `public/resume.pdf`
  exists.
- Scraps is built but empty.
