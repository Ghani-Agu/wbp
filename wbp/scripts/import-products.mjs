// World Business Plus — catalog importer
// Run from the project root:  node scripts/import-products.mjs
// Loads brands, categories and all products into Supabase using your service-role key.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readEnv() {
  for (const f of ['.env.local', '.env']) {
    try {
      const txt = readFileSync(join(root, f), 'utf8');
      const env = {};
      for (const line of txt.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
      if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) return env;
    } catch {}
  }
  return null;
}

const env = readEnv();
if (!env) { console.error('❌ Could not find NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const data = JSON.parse(readFileSync(join(__dirname, 'catalog-data.json'), 'utf8'));

const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

async function main() {
  console.log(`Connecting to ${env.NEXT_PUBLIC_SUPABASE_URL} …`);

  console.log(`→ Upserting ${data.brands.length} brands …`);
  let r = await sb.from('brands').upsert(data.brands, { onConflict: 'id' });
  if (r.error) throw new Error('brands: ' + r.error.message + ' (have you run setup.sql to create the tables?)');

  console.log(`→ Upserting ${data.categories.length} categories …`);
  r = await sb.from('categories').upsert(data.categories, { onConflict: 'id' });
  if (r.error) throw new Error('categories: ' + r.error.message);

  // detect optional price column
  const probe = await sb.from('products').select('price').limit(1);
  const hasPrice = !probe.error;
  const probe2 = await sb.from('products').select('images').limit(1);
  const hasImages = !probe2.error;
  console.log(`→ price column ${hasPrice ? 'detected' : 'absent'}; images column ${hasImages ? 'detected' : 'absent'}.`);

  console.log('→ Clearing existing products …');
  r = await sb.from('products').delete().not('id', 'is', null);
  if (r.error) throw new Error('clear products: ' + r.error.message);

  const rows = data.products.map((p) => {
    const row = { id: p.id, code: p.code, name: p.name, cat: p.cat, brand: p.brand,
      active: p.active, rating: p.rating, reviews_count: p.reviews_count, tag: p.tag, specs: p.specs, sort: p.sort };
    if (hasPrice) row.price = p.price;
    row.image_url = p.image_url || null;
    if (hasImages) row.images = p.images || [];
    return row;
  });

  const batches = chunk(rows, 500);
  let done = 0;
  for (const b of batches) {
    const res = await sb.from('products').insert(b);
    if (res.error) throw new Error('insert: ' + res.error.message);
    done += b.length;
    console.log(`   inserted ${done}/${rows.length}`);
  }

  const total = await sb.from('products').select('id', { count: 'exact', head: true });
  const active = await sb.from('products').select('id', { count: 'exact', head: true }).eq('active', true);
  console.log(`\n✅ Done. Products in database: ${total.count} (visible on site: ${active.count}).`);
  console.log('Refresh your site / restart npm run dev to see them.');
}

main().catch((e) => { console.error('\n❌ Import failed:', e.message); process.exit(1); });
