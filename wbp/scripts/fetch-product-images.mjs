#!/usr/bin/env node
/**
 * WBP — product image fetcher / wirer.
 *
 * Finds active products with no image, gets an image for each, optimizes it to
 * WebP into /public/products/<id>.webp, and sets the product's image_url.
 *
 * Run from the project root (wbp/) with your real .env.local present:
 *
 *   # 1) Export the worklist (which on-site products are missing an image):
 *   node scripts/fetch-product-images.mjs --export-missing
 *        -> writes missing-product-images.csv  (id, code, name, brand, search links)
 *
 *   # 2a) RECOMMENDED — curate official image URLs in a CSV then wire them:
 *   #     CSV columns: id,url   (or  code,url). Use manufacturer/official images.
 *   node scripts/fetch-product-images.mjs --from-csv my-images.csv
 *
 *   # 2b) OR auto-search (best effort, review results!) — needs SERPAPI_KEY:
 *   node scripts/fetch-product-images.mjs --auto --limit 20
 *
 *   Flags: --dry-run  --limit N  --only <id|code>
 *
 * Requires (already in package.json): @supabase/supabase-js, sharp.
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *                   and (for --auto) SERPAPI_KEY=...   (https://serpapi.com)
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

// sharp is optional: if its native binary is missing, fall back to saving the
// raw image bytes (no resize / WebP). Install with: npm install --include=optional sharp
let _sharp = null, _sharpTried = false;
async function getSharp() {
  if (_sharpTried) return _sharp;
  _sharpTried = true;
  try { _sharp = (await import('sharp')).default; }
  catch { console.warn('  (sharp unavailable — saving images un-optimized; run "npm install --include=optional sharp" for WebP)'); _sharp = null; }
  return _sharp;
}
function extFor(ct, url) {
  if (/png/i.test(ct)) return 'png';
  if (/webp/i.test(ct)) return 'webp';
  if (/jpe?g/i.test(ct)) return 'jpg';
  const m = (url || '').match(/\.(png|jpe?g|webp)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

// ---- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d = null) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const DRY = has('--dry-run');
const LIMIT = parseInt(val('--limit', '0'), 10) || 0;
const ONLY = val('--only', null);

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
if (!URL || !SERVICE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1);
}
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
  // "On the site" = active products. Missing = no image_url AND no images[].
  let q = sb.from('products').select('id,code,name,brand,image_url,images,active,sort').eq('active', true).order('sort');
  const { data, error } = await q;
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
async function saveOptimized(id, buf, ct, url) {
  const sh = await getSharp();
  if (sh) {
    const file = path.join(OUT_DIR, `${id}.webp`);
    if (DRY) { console.log(`   [dry] would write ${file}`); return `/products/${id}.webp`; }
    await sh(buf).resize(1000, 1000, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(file);
    return `/products/${id}.webp`;
  }
  const ext = extFor(ct, url);
  const file = path.join(OUT_DIR, `${id}.${ext}`);
  if (DRY) { console.log(`   [dry] would write ${file} (raw)`); return `/products/${id}.${ext}`; }
  fs.writeFileSync(file, buf);
  return `/products/${id}.${ext}`;
}
async function setImageUrl(id, rel) {
  if (DRY) { console.log(`   [dry] would set ${id}.image_url = ${rel}`); return; }
  const { error } = await sb.from('products').update({ image_url: rel }).eq('id', id);
  if (error) throw error;
}

// ---- SerpAPI (optional, for --auto) -----------------------------------------
async function serpImage(query) {
  if (!env.SERPAPI_KEY) throw new Error('SERPAPI_KEY not set (needed for --auto). Get one at https://serpapi.com');
  const u = new URL('https://serpapi.com/search.json');
  u.searchParams.set('engine', 'google_images');
  u.searchParams.set('q', query);
  u.searchParams.set('api_key', env.SERPAPI_KEY);
  const res = await fetch(u);
  const j = await res.json();
  const first = (j.images_results || []).find((r) => r.original && /^https?:\/\//.test(r.original));
  return first?.original || null;
}

// ---- commands ---------------------------------------------------------------
function queryFor(p, brands) {
  const brand = brands[p.brand] || '';
  const ref = p.code && p.code !== '-' ? p.code : '';
  return [brand, ref || p.name].filter(Boolean).join(' ').trim();
}

async function exportMissing() {
  const brands = await loadBrands();
  let rows = await loadMissing();
  if (ONLY) rows = rows.filter((p) => p.id === ONLY || p.code === ONLY);
  if (LIMIT) rows = rows.slice(0, LIMIT);
  const csv = ['id,code,name,brand,query,google_images'];
  for (const p of rows) {
    const q = queryFor(p, brands);
    const link = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    csv.push([p.id, p.code, p.name, brands[p.brand] || p.brand, q, link].map(esc).join(','));
  }
  fs.writeFileSync('missing-product-images.csv', csv.join('\n') + '\n');
  console.log(`Wrote missing-product-images.csv — ${rows.length} product(s) without an image.`);
}

async function fromCsv(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  const lines = text.split('\n').slice(text.toLowerCase().startsWith('id,') || text.toLowerCase().startsWith('code,') ? 1 : 0);
  // resolve code->id if the CSV is keyed by code (robust: trim + case-insensitive)
  const { data: all } = await sb.from('products').select('id,code');
  const norm = (s) => String(s ?? '').trim().toLowerCase();
  const ids = new Set((all || []).map((p) => p.id));
  const byCode = {};
  for (const p of (all || [])) byCode[norm(p.code)] = p.id;
  let done = 0, fail = 0, skipped = 0;
  for (const line of lines) {
    const [key, url] = line.split(',').map((s) => s.replace(/^["']|["']$/g, '').trim());
    if (!key || !url) continue;
    const id = ids.has(key) ? key : byCode[norm(key)];
    if (!id) { console.warn(`  ! "${key}" — no matching product (check the code/id), skipped`); skipped++; continue; }
    if (ONLY && id !== ONLY && key !== ONLY) continue;
    try {
      console.log(`• ${id}  <- ${url.slice(0, 70)}`);
      const { buf, ct } = await downloadImage(url);
      const rel = await saveOptimized(id, buf, ct, url);
      await setImageUrl(id, rel);
      done++;
    } catch (e) { console.warn(`  ! ${id}: ${e.message}`); fail++; }
  }
  console.log(`\nDone. ${done} wired, ${fail} failed.${DRY ? ' (dry-run)' : ''}`);
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
      const rel = await saveOptimized(p.id, buf, ct, url);
      await setImageUrl(p.id, rel);
      done++;
      await sleep(1200); // be gentle with the API
    } catch (e) { console.warn(`  ! ${p.id}: ${e.message}`); fail++; }
  }
  console.log(`\nDone. ${done} wired, ${fail} failed.${DRY ? ' (dry-run)' : ''}`);
}

// ---- main -------------------------------------------------------------------
(async () => {
  if (has('--export-missing')) return exportMissing();
  if (has('--from-csv')) return fromCsv(val('--from-csv'));
  if (has('--auto')) return auto();
  console.log(`WBP product image fetcher

  node scripts/fetch-product-images.mjs --export-missing
  node scripts/fetch-product-images.mjs --from-csv images.csv     (CSV: id,url  or  code,url)
  node scripts/fetch-product-images.mjs --auto --limit 20         (needs SERPAPI_KEY)

  options: --dry-run  --limit N  --only <id|code>`);
})().catch((e) => { console.error(e); process.exit(1); });
