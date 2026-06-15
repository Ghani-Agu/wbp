// World Business Plus — full database setup (tables + data) over a direct Postgres connection.
// Run from the project root:  node scripts/db-setup.mjs
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function env() {
  for (const f of ['.env.local', '.env']) {
    try {
      const o = {};
      for (const line of readFileSync(join(root, f), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
      if (o.DATABASE_URL) return o;
    } catch {}
  }
  return {};
}

const { DATABASE_URL } = env();
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing from .env.local.');
  console.error('   Add it from Supabase → Project Settings → Database → Connection string (URI).');
  process.exit(1);
}

const sql = (f) => readFileSync(join(root, 'supabase', f), 'utf8');

async function run() {
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  console.log('Connecting to the database …');
  await client.connect();
  try {
    console.log('→ Creating tables, security policies and base data (setup.sql) …');
    await client.query(sql('setup.sql'));
    console.log('→ Importing the full product catalogue (products_import.sql) …');
    await client.query(sql('products_import.sql'));
    const t = await client.query('select count(*)::int n from products');
    const a = await client.query('select count(*)::int n from products where active = true');
    const b = await client.query('select count(*)::int n from brands');
    const c = await client.query('select count(*)::int n from categories');
    console.log(`\n✅ Database ready.`);
    console.log(`   brands: ${b.rows[0].n}  categories: ${c.rows[0].n}`);
    console.log(`   products: ${t.rows[0].n}  (visible on site: ${a.rows[0].n})`);
    console.log('\nNext: create your admin user in Supabase → Authentication → Users, then open /admin.');
  } finally {
    await client.end();
  }
}
run().catch((e) => { console.error('\n❌ Setup failed:', e.message); process.exit(1); });
