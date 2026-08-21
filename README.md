# eyes

Personal portfolio site for [agron.design](https://agron.design) (Next.js).

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Media / images

Layout density and breakpoints live as CSS tokens in `app/Styles.css` (`--bp-mobile`, `--bp-narrow`, `--media-col-min`, `--stage-height`, `--measure`, …).

**Use the helpers, not one-offs.** On pages, pass `sizes={mediaSizes(role)}` and `quality={mediaQuality}` from `app/helpers.js`. Roles: `thumb` / `cover`, `experiment`, `case-pair`, and default `stage` (full-width).

**Next Image Optimization** (Vercel transform quota) is configured in `next.config.mjs`:

- WebP only (no AVIF) to cut transform variants
- `qualities: [85]` matching `mediaQuality`
- Small `deviceSizes` / `imageSizes` allowlists sized to those roles
- `minimumCacheTTL` of 31 days for optimized `/_next/image` variants

**Two caches, two jobs:**

- Raw files under `/content/media` use `must-revalidate` so same-name swaps aren’t stuck behind an immutable browser cache.
- Optimized variants use the longer Image Optimization TTL. If you replace a file and need a fresh optimized version immediately, rename the file (or change the path) and update JSON.

When media dimensions change, run `npm run sync-media` so `profileData.json` / experiments stay in sync with the files on disk.

When you change breakpoints or grid density, update CSS tokens, `bpMobile` / `bpNarrow` in helpers, and re-check `deviceSizes` / `imageSizes` in `next.config.mjs`.

## Deploy

Push to `main`; Vercel deploys from there.
