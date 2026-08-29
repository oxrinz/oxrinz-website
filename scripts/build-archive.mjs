#!/usr/bin/env node
// Builds the archive: scans each collection listed in archive.config.json, generates
// WebP thumbnails with cwebp, and writes the manifests consumed by /archive.
//
//   node scripts/build-archive.mjs             # every collection
//   node scripts/build-archive.mjs muramasa    # just these ones
//
// Thumbnails live in ~/.cache/oxrinz-archive/<id> and are reused across runs, so
// re-running after adding a collection only does the new work.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const VALUE_FLAGS = new Set(['cache', 'width', 'quality', 'jobs']);
const argv = process.argv.slice(2);
const flags = {};
const wanted = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg.startsWith('--')) {
    const name = arg.slice(2);
    flags[name] = VALUE_FLAGS.has(name) ? argv[++i] : true;
  } else {
    wanted.push(arg);
  }
}
const flag = (name, fallback) => flags[name] ?? fallback;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const CONFIG = path.join(ROOT, 'archive.config.json');
const OUT_DIR = path.join(ROOT, 'static/archive');
const CACHE = path.resolve(flag('cache', process.env.ARCHIVE_CACHE ?? path.join(os.homedir(), '.cache/oxrinz-archive')));
const THUMB_WIDTH = Number(flag('width', 512));
const QUALITY = Number(flag('quality', 72));
const CONCURRENCY = Number(flag('jobs', os.cpus().length));

const expand = (p) => (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : path.resolve(p));

const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

/** Width/height straight from the file header — no image library needed. */
async function readDimensions(file) {
  const fh = await fs.open(file, 'r');
  try {
    const head = Buffer.alloc(65536);
    const { bytesRead } = await fh.read(head, 0, head.length, 0);
    const buf = head.subarray(0, bytesRead);

    // PNG: 8-byte signature, then the IHDR chunk holds width/height.
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    }
    // GIF: little-endian width/height at byte 6.
    if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') {
      return [buf.readUInt16LE(6), buf.readUInt16LE(8)];
    }
    // WebP (VP8X / VP8L / VP8 ).
    if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
      if (chunk === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
      if (chunk === 'VP8L') {
        const b = buf.readUInt32LE(21);
        return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)];
      }
    }
    // JPEG: walk the marker segments until a start-of-frame.
    if (buf.length > 4 && buf.readUInt16BE(0) === 0xffd8) {
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) { off++; continue; }
        const marker = buf[off + 1];
        const len = buf.readUInt16BE(off + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return [buf.readUInt16BE(off + 7), buf.readUInt16BE(off + 5)];
        }
        off += 2 + len;
      }
    }
    return null;
  } finally {
    await fh.close();
  }
}

async function walk(dir, rel = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  const dirs = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) dirs.push(...(await walk(path.join(dir, entry.name), relPath)));
    else if (EXTS.has(path.extname(entry.name).toLowerCase())) files.push({ rel: relPath, dir: rel, name: entry.name });
  }
  return [...files, ...dirs];
}

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-300)}`))));
  });
}

async function pool(items, limit, worker) {
  let index = 0;
  let done = 0;
  const tick = () => {
    done++;
    if (done % 25 === 0 || done === items.length) {
      process.stdout.write(`\r  thumbnails: ${done}/${items.length}`);
    }
  };
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      try {
        await worker(item);
      } catch (err) {
        process.stdout.write(`\n  ! ${item.rel}: ${err.message}\n`);
      }
      tick();
    }
  });
  await Promise.all(runners);
  if (items.length) process.stdout.write('\n');
}

async function needsThumb(src, dest) {
  try {
    const [a, b] = await Promise.all([fs.stat(src), fs.stat(dest)]);
    return b.mtimeMs < a.mtimeMs;
  } catch {
    return true;
  }
}

function coverFor(collection, dirs) {
  if (collection.cover) return collection.cover;

  // The most common landscape size in a rip is nearly always the full-scene artwork;
  // sprites and UI bits come in many odd sizes, so they lose this vote.
  const sizes = new Map();
  for (const entries of Object.values(dirs)) {
    for (const [, w, h] of entries) {
      if (!w || !h || w / h < 1.2 || w / h > 2.2) continue;
      const key = `${w}x${h}`;
      sizes.set(key, (sizes.get(key) ?? 0) + 1);
    }
  }
  const modal = [...sizes.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]?.[0];

  // Within that size, take the directory holding the most of them.
  let best = null;
  for (const [dir, entries] of Object.entries(dirs)) {
    const matching = entries.filter(([, w, h]) => (modal ? `${w}x${h}` === modal : w >= h));
    if (matching.length && (!best || matching.length > best.count)) {
      best = { count: matching.length, path: dir ? `${dir}/${matching[0][0]}` : matching[0][0] };
    }
  }
  return best?.path ?? null;
}

async function buildCollection(collection) {
  const src = expand(collection.src);
  const thumbs = path.join(CACHE, collection.id);

  if (!existsSync(src)) {
    console.error(`  ! source folder not found: ${src}`);
    return null;
  }

  console.log(`\n== ${collection.id} — ${src}`);
  const files = await walk(src);
  console.log(`  ${files.length} images`);
  if (!files.length) return null;

  const meta = new Map();
  let bytes = 0;
  await pool(files, CONCURRENCY * 4, async (file) => {
    const abs = path.join(src, file.rel);
    const [stat, dims] = await Promise.all([fs.stat(abs), readDimensions(abs)]);
    bytes += stat.size;
    meta.set(file.rel, { size: stat.size, w: dims?.[0] ?? 0, h: dims?.[1] ?? 0 });
  });

  const jobs = [];
  for (const file of files) {
    const dest = path.join(thumbs, `${file.rel}.webp`);
    if (await needsThumb(path.join(src, file.rel), dest)) jobs.push({ ...file, dest });
  }
  console.log(`  ${jobs.length} thumbnails to build (${files.length - jobs.length} up to date)`);
  await pool(jobs, CONCURRENCY, async (job) => {
    await fs.mkdir(path.dirname(job.dest), { recursive: true });
    const { w } = meta.get(job.rel);
    const resize = w > THUMB_WIDTH ? ['-resize', String(THUMB_WIDTH), '0'] : [];
    await run('cwebp', ['-quiet', '-q', String(QUALITY), ...resize, path.join(src, job.rel), '-o', job.dest]);
  });

  // Compact manifest: files grouped by directory, each entry [name, width, height, size].
  const dirs = {};
  for (const file of files) {
    const { w, h, size } = meta.get(file.rel);
    (dirs[file.dir] ??= []).push([file.name, w, h, size]);
  }
  for (const list of Object.values(dirs)) list.sort((a, b) => a[0].localeCompare(b[0], 'ja'));

  const manifest = {
    id: collection.id,
    title: collection.title,
    note: collection.note ?? null,
    generated: new Date().toISOString(),
    count: files.length,
    bytes,
    cover: coverFor(collection, dirs),
    dirs
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `${collection.id}.json`);
  const json = JSON.stringify(manifest);
  await fs.writeFile(out, json);
  console.log(`  wrote ${path.relative(ROOT, out)} (${(Buffer.byteLength(json) / 1024).toFixed(0)} KB)`);

  return manifest;
}

if (!existsSync(CONFIG)) {
  console.error(`no archive.config.json at ${CONFIG}`);
  process.exit(1);
}

const config = JSON.parse(await fs.readFile(CONFIG, 'utf8'));
const all = config.collections ?? [];
const targets = wanted.length ? all.filter((c) => wanted.includes(c.id)) : all;

if (!targets.length) {
  console.error(wanted.length ? `no collection matched: ${wanted.join(', ')}` : 'no collections configured');
  process.exit(1);
}

const built = new Map();
for (const collection of targets) {
  const manifest = await buildCollection(collection);
  if (manifest) built.set(collection.id, manifest);
}

// The index lists every configured collection, reusing manifests untouched by this run.
const index = [];
for (const collection of all) {
  let manifest = built.get(collection.id);
  if (!manifest) {
    try {
      manifest = JSON.parse(await fs.readFile(path.join(OUT_DIR, `${collection.id}.json`), 'utf8'));
    } catch {
      continue;
    }
  }
  const { dirs, ...summary } = manifest;
  index.push(summary);
}

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));

const totalBytes = index.reduce((sum, c) => sum + c.bytes, 0);
const totalCount = index.reduce((sum, c) => sum + c.count, 0);
console.log(`\narchive: ${index.length} collection(s), ${totalCount.toLocaleString()} images, ${(totalBytes / 1e9).toFixed(2)} GB`);
console.log(`thumbnails cached in ${CACHE}`);
console.log(`next: scripts/upload-archive.sh${wanted.length ? ` ${wanted.join(' ')}` : ''}`);
