/**
 * Keep media and its content JSON in sync:
 *   1. Recompress large PNGs → same-dimension WebP, rewrite URLs, remove PNGs.
 *   2. Backfill width/height on every media item, so pages reserve the right
 *      box before a byte arrives.
 *   3. For experiment videos: a first-frame poster and a small silent preview
 *      for the grid. The original stays for the expand view (with audio).
 * Usage: npm run sync-media
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mediaDir = path.join(root, 'public/content/media');
const experimentsPath = path.join(root, 'public/content/experiments.json');
const jsonPaths = [
  path.join(root, 'public/content/profileData.json'),
  experimentsPath,
];

const MIN_BYTES = 200 * 1024;
const WEBP_QUALITY = 88;
const POSTER_QUALITY = 80;
/** Long edge of the silent grid preview — enough for a 150px tile on 2x. */
const PREVIEW_EDGE = 360;

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/** Walk an MP4's box tree at one level. */
function* boxes(buf, start, end) {
  let offset = start;
  while (offset + 8 <= end) {
    let size = buf.readUInt32BE(offset);
    const type = buf.toString('latin1', offset + 4, offset + 8);
    if (size === 1) size = Number(buf.readBigUInt64BE(offset + 8));
    if (size < 8) return;
    yield { type, body: offset + 8, end: offset + size };
    offset += size;
  }
}

/** A track header always ends with 16.16 fixed width and height; audio reads 0. */
function readVideoDimensions(file) {
  const buf = fs.readFileSync(file);
  for (const moov of boxes(buf, 0, buf.length)) {
    if (moov.type !== 'moov') continue;
    for (const trak of boxes(buf, moov.body, moov.end)) {
      if (trak.type !== 'trak') continue;
      for (const tkhd of boxes(buf, trak.body, trak.end)) {
        if (tkhd.type !== 'tkhd') continue;
        const width = buf.readUInt32BE(tkhd.end - 8) >> 16;
        const height = buf.readUInt32BE(tkhd.end - 4) >> 16;
        if (width && height) return { width, height };
      }
    }
  }
  return null;
}

async function readDimensions(url) {
  const file = path.join(root, 'public', url);
  if (!fs.existsSync(file)) return null;
  if (/\.(mp4|m4v|mov)$/i.test(file)) return readVideoDimensions(file);
  const { width, height } = await sharp(file).metadata();
  return width && height ? { width, height } : null;
}

/** Every object carrying a media URL, whatever shape the JSON happens to be. */
function collectMediaItems(node, found = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectMediaItems(child, found));
    return found;
  }
  if (!node || typeof node !== 'object') return found;
  if (typeof node.url === 'string' && node.url.startsWith('/content/media/')) {
    found.push(node);
  }
  Object.values(node).forEach((child) => collectMediaItems(child, found));
  return found;
}

async function backfillDimensions() {
  let total = 0;

  for (const jsonPath of jsonPaths) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let added = 0;

    for (const item of collectMediaItems(data)) {
      if (item.width && item.height) continue;

      const dims = await readDimensions(item.url);
      if (!dims) {
        console.log(`no dimensions for ${item.url}`);
        continue;
      }

      item.width = dims.width;
      item.height = dims.height;
      added += 1;
      console.log(`dims ${item.url} ${dims.width}x${dims.height}`);
    }

    // Only rewrite files we actually changed, to keep diffs honest
    if (added) {
      fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
      console.log(`updated ${path.relative(root, jsonPath)} (${added} items)`);
    }
    total += added;
  }

  return total;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (chunk) => {
      err += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim().split('\n').slice(-4).join('\n') || `ffmpeg exit ${code}`));
    });
  });
}

function publicUrl(file) {
  return `/content/media/${path.basename(file)}`;
}

/** Silent 360px preview + first-frame poster for each experiment video. */
async function syncExperimentVideos() {
  if (!ffmpegPath) throw new Error('ffmpeg-static binary missing');

  const data = JSON.parse(fs.readFileSync(experimentsPath, 'utf8'));
  let updated = 0;

  for (const item of data) {
    if (item.type !== 'video' || !item.url) continue;

    const source = path.join(root, 'public', item.url);
    if (!fs.existsSync(source)) {
      console.log(`missing ${item.url}`);
      continue;
    }

    const base = path.basename(item.url, path.extname(item.url));
    const posterFile = path.join(mediaDir, `${base}-poster.webp`);
    const previewFile = path.join(mediaDir, `${base}-preview.mp4`);
    const posterUrl = publicUrl(posterFile);
    const previewUrl = publicUrl(previewFile);

    const needsPoster = !fs.existsSync(posterFile) || fs.statSync(posterFile).size < 64;
    if (needsPoster) {
      const tmpPng = path.join(mediaDir, `${base}-poster-tmp.png`);
      await runFfmpeg([
        '-y',
        '-i',
        source,
        '-frames:v',
        '1',
        '-q:v',
        '2',
        tmpPng,
      ]);
      await sharp(tmpPng)
        .resize({
          width: PREVIEW_EDGE,
          height: PREVIEW_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: POSTER_QUALITY, effort: 4 })
        .toFile(posterFile);
      fs.unlinkSync(tmpPng);
      console.log(`poster ${posterUrl} ${formatMb(fs.statSync(posterFile).size)}`);
    }

    const needsPreview = !fs.existsSync(previewFile) || fs.statSync(previewFile).size < 1024;
    if (needsPreview) {
      // Width capped; -2 keeps height even for yuv420p. Portrait clips get a
      // smaller width via the second pass when height would exceed the edge.
      const dims = readVideoDimensions(source) || { width: PREVIEW_EDGE, height: PREVIEW_EDGE };
      const scale =
        dims.height > dims.width
          ? `-2:${PREVIEW_EDGE}`
          : `${PREVIEW_EDGE}:-2`;
      await runFfmpeg([
        '-y',
        '-i',
        source,
        '-an',
        '-vf',
        `scale=${scale}`,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '28',
        '-preset',
        'medium',
        '-movflags',
        '+faststart',
        previewFile,
      ]);
      console.log(
        `preview ${previewUrl} ${formatMb(fs.statSync(source).size)} → ${formatMb(fs.statSync(previewFile).size)}`
      );
    }

    if (item.poster !== posterUrl || item.preview !== previewUrl) {
      item.poster = posterUrl;
      item.preview = previewUrl;
      updated += 1;
    }
  }

  if (updated) {
    fs.writeFileSync(experimentsPath, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`updated experiments.json (${updated} video derivatives)`);
  }

  return updated;
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

  const videoDerivatives = await syncExperimentVideos();

  // Runs last so freshly renamed URLs are measured from their new files
  const dimsAdded = await backfillDimensions();

  console.log('\n--- summary ---');
  console.log(`converted: ${converted}`);
  console.log(`skipped:   ${skipped}`);
  console.log(`json url replacements: ${jsonUpdates}`);
  console.log(`video derivatives: ${videoDerivatives}`);
  console.log(`dimensions added: ${dimsAdded}`);
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
