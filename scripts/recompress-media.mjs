/**
 * Recompress large PNGs → same-dimension WebP, rewrite content JSON, remove PNGs.
 * Usage: npm run recompress-media
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mediaDir = path.join(root, 'public/content/media');
const jsonPaths = [
  path.join(root, 'public/content/profileData.json'),
  path.join(root, 'public/content/experiments.json'),
];

const MIN_BYTES = 200 * 1024;
const WEBP_QUALITY = 88;

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

async function main() {
  const pngs = fs
    .readdirSync(mediaDir)
    .filter((name) => name.toLowerCase().endsWith('.png'))
    .map((name) => path.join(mediaDir, name));

  let beforeTotal = 0;
  let afterTotal = 0;
  let converted = 0;
  let skipped = 0;
  const renames = new Map(); // /content/media/foo.png → /content/media/foo.webp

  for (const pngPath of pngs) {
    const stat = fs.statSync(pngPath);
    beforeTotal += stat.size;

    if (stat.size <= MIN_BYTES) {
      skipped += 1;
      afterTotal += stat.size;
      continue;
    }

    const base = path.basename(pngPath, path.extname(pngPath));
    const webpPath = path.join(mediaDir, `${base}.webp`);
    const image = sharp(pngPath);
    const meta = await image.metadata();

    await image
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(webpPath);

    const webpStat = fs.statSync(webpPath);

    // Keep PNG if WebP somehow larger
    if (webpStat.size >= stat.size) {
      fs.unlinkSync(webpPath);
      skipped += 1;
      afterTotal += stat.size;
      console.log(
        `skip (webp larger) ${base}.png ${formatMb(stat.size)} → would be ${formatMb(webpStat.size)}`
      );
      continue;
    }

    fs.unlinkSync(pngPath);
    converted += 1;
    afterTotal += webpStat.size;
    renames.set(`/content/media/${base}.png`, `/content/media/${base}.webp`);
    console.log(
      `ok ${base}.png ${meta.width}x${meta.height} ${formatMb(stat.size)} → ${formatMb(webpStat.size)}`
    );
  }

  // Also count non-converted remaining weight already in afterTotal for skipped;
  // for PNGs we didn't touch under threshold, included. Converted: png removed, webp added.

  let jsonUpdates = 0;
  for (const jsonPath of jsonPaths) {
    let text = fs.readFileSync(jsonPath, 'utf8');
    let next = text;
    for (const [from, to] of renames) {
      const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const count = (next.match(re) || []).length;
      if (count) {
        next = next.replace(re, to);
        jsonUpdates += count;
      }
    }
    if (next !== text) {
      fs.writeFileSync(jsonPath, next);
      console.log(`updated ${path.relative(root, jsonPath)}`);
    }
  }

  console.log('\n--- summary ---');
  console.log(`converted: ${converted}`);
  console.log(`skipped:   ${skipped}`);
  console.log(`json url replacements: ${jsonUpdates}`);
  console.log(
    `png cohort before (all pngs scanned): ${formatMb(beforeTotal)}`
  );
  console.log(
    `after (kept pngs + new webps from this run): ${formatMb(afterTotal)}`
  );
  console.log(`saved (approx): ${formatMb(Math.max(0, beforeTotal - afterTotal))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
