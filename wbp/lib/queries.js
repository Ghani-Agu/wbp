import { createClient, hasSupabase } from '@/lib/supabase/server';
import { fallbackCatalog } from '@/lib/fallback-catalog';

const mapBrand = (r) => ({ id: r.id, name: r.name, short: r.short, color: r.color, desc: r.description || {} });
const mapCategory = (r) => ({ id: r.id, icon: r.icon, fr: r.name?.fr, en: r.name?.en, ar: r.name?.ar, blurb: r.blurb || {} });
const mapProduct = (r) => ({
  id: r.id, cat: r.cat, brand: r.brand, name: r.name, code: r.code, badge: r.badge,
  rating: Number(r.rating) || 0, reviews: r.reviews_count || 0,
  tag: r.tag || {}, specs: r.specs || [], image_url: r.image_url || null, price: r.price ?? null, images: Array.isArray(r.images) ? r.images : [],
});

// Whole catalog. Falls back to the bundled static catalog if Supabase is unset.
export async function getCatalog() {
  if (!hasSupabase()) return { ...fallbackCatalog, source: 'fallback' };
  try {
    const sb = await createClient();
    const [b, c, p, cl] = await Promise.all([
      sb.from('brands').select('*').order('sort'),
      sb.from('categories').select('*').order('sort'),
      sb.from('products').select('*').eq('active', true).order('sort'),
      sb.from('clients').select('name').order('sort'),
    ]);
    if (b.error || c.error || p.error) throw (b.error || c.error || p.error);
    return {
      brands: (b.data || []).map(mapBrand),
      categories: (c.data || []).map(mapCategory),
      products: (p.data || []).map(mapProduct),
      clients: (cl.data || []).map((x) => x.name),
      source: 'supabase',
    };
  } catch (e) {
    // Supabase IS configured but the query failed — show the real (empty) state
    // instead of the demo catalog, so the problem is visible rather than masked.
    console.error('getCatalog error:', e?.message);
    return { brands: [], categories: [], products: [], clients: [], source: 'error' };
  }
}

export async function getProduct(id) {
  if (!hasSupabase()) return fallbackCatalog.products.find((p) => p.id === id) || null;
  try {
    const sb = await createClient();
    const { data, error } = await sb.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapProduct(data) : null;
  } catch {
    return fallbackCatalog.products.find((p) => p.id === id) || null;
  }
}

export async function getReviews(productId) {
  if (!hasSupabase()) return [];
  try {
    const sb = await createClient();
    const { data, error } = await sb.from('reviews').select('*')
      .eq('product_id', productId).eq('approved', true).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => ({
      _id: r.id, author: r.author, rating: r.rating, title: r.title, body: r.body,
      helpful: r.helpful, verified: r.verified, date: (r.created_at || '').slice(0, 10),
    }));
  } catch { return []; }
}

const SETTINGS_DEFAULTS = {
  whatsapp: '213559533698',
  contact: {
    email: 'commercial@wbp-dz.com',
    phones: ['0559 533 698', '0560 061 082'],
    fax: 'Tél/Fax : 023 70 80 21',
    address: { fr: 'Cité DNC G8, Bt D, N°07, Garidi 1, Kouba, 16006 Alger, Algérie', en: 'Cité DNC G8, Bt D, N°07, Garidi 1, Kouba, 16006 Algiers, Algeria', ar: 'حي DNC G8، عمارة D، رقم 07، قاريدي 1، القبة، 16006 الجزائر العاصمة' },
  },
  hero: { fr: { title: '', sub: '' }, en: { title: '', sub: '' }, ar: { title: '', sub: '' } },
};

export async function getSettings() {
  if (!hasSupabase()) return { ...SETTINGS_DEFAULTS };
  try {
    const sb = await createClient();
    const { data, error } = await sb.from('settings').select('key,value');
    if (error) throw error;
    const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    return {
      whatsapp: map.whatsapp || SETTINGS_DEFAULTS.whatsapp,
      contact: { ...SETTINGS_DEFAULTS.contact, ...(map.contact || {}) },
      hero: map.hero || SETTINGS_DEFAULTS.hero,
    };
  } catch { return { ...SETTINGS_DEFAULTS }; }
}
