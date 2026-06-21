#!/usr/bin/env node
/**
 * WBP — product image fetcher / wirer (multi-image galleries).
 *
 * Reads a CSV of product -> image URL(s), downloads each, optimizes to a clean
 * white 1000x1000 WebP (so every shot is centered and fits the card the same way),
 * saves to /public/products/<id>-N.webp, and sets the product's `images` array
 * (+ image_url = first) in Supabase.
 *
 * Run from the project root (wbp/) with your real .env.local present:
 *
 *   node scripts/fetch-product-images.mjs --export-missing
 *        -> missing-product-images.csv (worklist: id, code, name, brand, search link)
 *
 *   node scripts/fetch-product-images.mjs --from-csv product-images.csv
 *        CSV is "id,url" (or "code,url"). Put MULTIPLE rows with the SAME id to
 *        give a product several gallery images, in order:
 *            r0022,https://…/front.jpg
 *            r0022,https://…/back.jpg
 *
 *   node scripts/fetch-product-images.mjs --auto --limit 20   (best-effort, needs SERPAPI_KEY)
 *
 *   options: --dry-run  --limit N  --only <id|code>  --no-pad (keep raw aspect, no white canvas)
 *
 * Requires (already in package.json): @supabase/supabase-js, sharp.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

// ---- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d = null) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const DRY = has('--dry-run');
const LIMIT = parseInt(val('--limit', '0'), 10) || 0;
const ONLY = val('--only', null);
const PAD = !has('--no-pad');           // default: pad onto white square so images fit the card uniformly
const SIZE = 1000;

// ---- optional sharp ---------------------------------------------------------
let _sharp = null, _sharpTried = false;
async function getSharp() {
  if (_sharpTried) return _sharp;
  _sharpTried = true;
  try { _sharp = (await import('sharp')).default; }
  catch { console.warn('  (sharp unavailable — saving raw images; run "npm install --include=optional sharp" for WebP + framing)'); _sharp = null; }
  return _sharp;
}
function extFor(ct, url) {
  if (/png/i.test(ct)) return 'png';
  if (/webp/i.test(ct)) return 'webp';
  if (/jpe?g/i.test(ct)) return 'jpg';
  const m = (url || '').match(/\.(png|jpe?g|webp)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

// ---- env --------------------------------------------------------------------
function loadEnv() {
  const out = { ...process.env };
  for (const f of ['.env.local', '.env']) {
    try {
      for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (m && !(m[1] in out)) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    } catch { /* file may not exist */ }
  }
  return out;
}
const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const sb = createClient(URL, SERVICE, { auth: { persistSession: false } });
const OUT_DIR = path.join(process.cwd(), 'public', 'products');
fs.mkdirSync(OUT_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- data -------------------------------------------------------------------
async function loadBrands() {
  const { data } = await sb.from('brands').select('id,name');
  return Object.fromEntries((data || []).map((b) => [b.id, b.name]));
}
async function loadMissing() {
  const { data, error } = await sb.from('products')
    .select('id,code,name,brand,image_url,images,active,sort').eq('active', true).order('sort');
  if (error) throw error;
  return (data || []).filter((p) => !p.image_url && !(Array.isArray(p.images) && p.images.length));
}

// ---- image pipeline ---------------------------------------------------------
async function downloadImage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 WBP-image-fetcher' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!/image\//.test(ct)) throw new Error(`not an image (${ct})`);
  return { buf: Buffer.from(await res.arrayBuffer()), ct };
}
async function saveImage(id, n, buf, ct, url) {
  const sh = await getSharp();
  if (sh) {
    const file = path.join(OUT_DIR, `${id}-${n}.webp`);
    if (DRY) { console.log(`   [dry] ${file}`); return `/products/${id}-${n}.webp`; }
    let img = sh(buf).flatten({ background: '#ffffff' });
    img = PAD
      ? img.resize(SIZE, SIZE, { fit: 'contain', background: '#ffffff' })
      : img.resize(SIZE, SIZE, { fit: 'inside', withoutEnlargement: true });
    await img.webp({ quality: 85 }).toFile(file);
    return `/products/${id}-${n}.webp`;
  }
  const ext = extFor(ct, url);
  const file = path.join(OUT_DIR, `${id}-${n}.${ext}`);
  if (DRY) { console.log(`   [dry] ${file} (raw)`); return `/products/${id}-${n}.${ext}`; }
  fs.writeFileSync(file, buf);
  return `/products/${id}-${n}.${ext}`;
}
async function setImages(id, rels) {
  if (DRY) { console.log(`   [dry] ${id}.images = [${rels.length}], image_url = ${rels[0]}`); return; }
  const { error } = await sb.from('products').update({ images: rels, image_url: rels[0] }).eq('id', id);
  if (error) console.warn(`  ! ${id} DB update: ${error.message}`);
}

// ---- SerpAPI (optional, --auto) ---------------------------------------------
async function serpImage(query) {
  if (!env.SERPAPI_KEY) throw new Error('SERPAPI_KEY not set (needed for --auto). https://serpapi.com');
  const u = new URL('https://serpapi.com/search.json');
  u.searchParams.set('engine', 'google_images'); u.searchParams.set('q', query); u.searchParams.set('api_key', env.SERPAPI_KEY);
  const j = await (await fetch(u)).json();
  return (j.images_results || []).find((r) => r.original && /^https?:\/\//.test(r.original))?.original || null;
}
function queryFor(p, brands) {
  const brand = brands[p.brand] || '';
  const ref = p.code && p.code !== '-' ? p.code : '';
  return [brand, ref || p.name].filter(Boolean).join(' ').trim();
}

// ---- commands ---------------------------------------------------------------
async function exportMissing() {
  const brands = await loadBrands();
  let rows = await loadMissing();
  if (ONLY) rows = rows.filter((p) => p.id === ONLY || p.code === ONLY);
  if (LIMIT) rows = rows.slice(0, LIMIT);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['id,code,name,brand,query,google_images'];
  for (const p of rows) {
    const q = queryFor(p, brands);
    csv.push([p.id, p.code, p.name, brands[p.brand] || p.brand, q, 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q)].map(esc).join(','));
  }
  fs.writeFileSync('missing-product-images.csv', csv.join('\n') + '\n');
  console.log(`Wrote missing-product-images.csv — ${rows.length} product(s) without an image.`);
}

async function fromCsv(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  let lines = text.split(/\r?\n/);
  if (/^(id|code)\s*,/i.test(lines[0] || '')) lines = lines.slice(1);
  const { data: all } = await sb.from('products').select('id,code');
  const norm = (s) => String(s ?? '').trim().toLowerCase();
  const ids = new Set((all || []).map((p) => p.id));
  const byCode = {}; for (const p of (all || [])) byCode[norm(p.code)] = p.id;
  // group urls by product id, preserving order
  const groups = new Map();
  for (const line of lines) {
    const i = line.indexOf(',');
    if (i < 0) continue;
    const key = line.slice(0, i).replace(/^["']|["']$/g, '').trim();
    const url = line.slice(i + 1).replace(/^["']|["']$/g, '').trim();
    if (!key || !url) continue;
    // Trust rXXXX-style ids directly (DB select can be capped at 1000 rows, so the
    // `ids` set may not contain higher-numbered products); fall back to code lookup.
    const id = (/^r\d+$/i.test(key) || ids.has(key)) ? key : byCode[norm(key)];
    if (!id) { console.warn(`  ! "${key}" — no matching product, skipped`); continue; }
    if (ONLY && id !== ONLY && key !== ONLY) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(url);
  }
  let done = 0, failImg = 0;
  for (const [id, urls] of groups) {
    const saved = [];
    for (let n = 0; n < urls.length; n++) {
      try { const { buf, ct } = await downloadImage(urls[n]); saved.push(await saveImage(id, n + 1, buf, ct, urls[n])); }
      catch (e) { console.warn(`  ! ${id} img${n + 1}: ${e.message}`); failImg++; }
    }
    if (saved.length) { console.log(`• ${id}: ${saved.length} image(s)`); await setImages(id, saved); done++; }
  }
  console.log(`\nDone. ${done} product(s) updated, ${failImg} image(s) failed.${DRY ? ' (dry-run)' : ''}`);
}

async function auto() {
  const brands = await loadBrands();
  let rows = await loadMissing();
  if (ONLY) rows = rows.filter((p) => p.id === ONLY || p.code === ONLY);
  if (LIMIT) rows = rows.slice(0, LIMIT);
  let done = 0, fail = 0;
  for (const p of rows) {
    const q = queryFor(p, brands);
    try {
      console.log(`• ${p.id}  "${q}"`);
      const url = await serpImage(q);
      if (!url) throw new Error('no image result');
      const { buf, ct } = await downloadImage(url);
      const rel = await saveImage(p.id, 1, buf, ct, url);
      await setImages(p.id, [rel]);
      done++; await sleep(1200);
    } catch (e) { console.warn(`  ! ${p.id}: ${e.message}`); fail++; }
  }
  console.log(`\nDone. ${done} wired, ${fail} failed.${DRY ? ' (dry-run)' : ''}`);
}

// ---- main -------------------------------------------------------------------
(async () => {
  if (has('--export-missing')) return exportMissing();
  if (has('--from-csv')) return fromCsv(val('--from-csv'));
  if (has('--auto')) return auto();
  console.log(`WBP product image fetcher (multi-image galleries)

  node scripts/fetch-product-images.mjs --export-missing
  node scripts/fetch-product-images.mjs --from-csv product-images.csv   (id,url ; repeat id for gallery)
  node scripts/fetch-product-images.mjs --auto --limit 20               (needs SERPAPI_KEY)

  options: --dry-run  --limit N  --only <id|code>  --no-pad`);
})().catch((e) => { console.error(e); process.exit(1); });
