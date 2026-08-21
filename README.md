# eyes

Personal portfolio site for [agron.design](https://agron.design) (Next.js).

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Media / images

Layout density and breakpoints live as CSS tokens in `app/Styles.css` (`--bp-mobile`, `--bp-narrow`, `--media-col-min`, `--stage-height`, `--measure`, …).

**Use the helpers, not one-offs.** On pages, pass:

- `src={mediaSrc(url, role)}`
- `sizes={mediaSizes(role)}`
- `quality={mediaQuality}`

Roles: `thumb` / `cover`, `experiment`, `case-pair`, and default `stage` (full-width).

**Vercel Image Optimization is off** (`images.unoptimized` in `next.config.mjs`). We do not use `/_next/image` transforms (avoids free-tier 402s). Files are served from `/content/media/`.

**Self-hosted sizes** via `npm run sync-media`:

- **Master** (`Foo.webp`) — high-res for stage, case studies, experiment expand
- **Small** (`Foo-sm.webp`) — ~800px long-edge WebP for archive thumbs, project thumbs, experiment grid

Workflow: drop/replace a master → run `npm run sync-media` → commit masters + new/updated `*-sm.webp` (and any JSON dimension updates).

Raw `/content/media` responses use `must-revalidate` so same-name swaps aren’t stuck behind an immutable browser cache.

When you change breakpoints or grid density, update CSS tokens and `bpMobile` / `bpNarrow` in helpers.

## Analytics

Google Analytics 4 uses `NEXT_PUBLIC_GA_MEASUREMENT_ID` (your `G-…` Measurement ID).

- Local: put it in `.env.local` (gitignored).
- Production: set the same variable in Vercel → Project → Settings → Environment Variables, then redeploy.

## Deploy

Push to `main`; Vercel deploys from there.
