'use server';
import { createAdminClient, hasSupabase } from '@/lib/supabase/server';

const str = (v, max = 2000) => (v == null ? null : String(v).slice(0, max).trim() || null);

export async function submitQuote(payload) {
  const row = {
    customer_name: str(payload.customer_name, 200),
    company: str(payload.company, 200),
    email: str(payload.email, 200),
    phone: str(payload.phone, 60),
    message: str(payload.message, 4000),
    items: Array.isArray(payload.items)
      ? payload.items.slice(0, 200).map((i) => ({ id: str(i.id, 60), name: str(i.name, 300), code: str(i.code, 120), qty: Math.max(1, parseInt(i.qty, 10) || 1) }))
      : [],
  };
  if (!hasSupabase()) return { ok: true, stored: false };
  const sb = createAdminClient();
  const { error } = await sb.from('quote_requests').insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true, stored: true };
}

export async function submitContact(payload) {
  const row = {
    name: str(payload.name, 200), company: str(payload.company, 200),
    email: str(payload.email, 200), phone: str(payload.phone, 60),
    subject: str(payload.subject, 300), message: str(payload.message, 5000),
  };
  if (!hasSupabase()) return { ok: true, stored: false };
  const sb = createAdminClient();
  const { error } = await sb.from('contact_messages').insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true, stored: true };
}

export async function submitReview(payload) {
  const rating = Math.min(5, Math.max(1, parseInt(payload.rating, 10) || 0));
  if (!payload.product_id || !rating || !str(payload.body)) return { ok: false, error: 'invalid' };
  const row = {
    product_id: str(payload.product_id, 60), author: str(payload.author, 120) || 'Anonyme',
    rating, title: str(payload.title, 200), body: str(payload.body, 4000),
    verified: false, approved: true,
  };
  if (!hasSupabase()) return { ok: true, stored: false };
  const sb = createAdminClient();
  const { error } = await sb.from('reviews').insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true, stored: true };
}

export async function subscribeNewsletter(email) {
  const e = str(email, 200);
  if (!e || !e.includes('@')) return { ok: false, error: 'invalid' };
  if (!hasSupabase()) return { ok: true, stored: false };
  const sb = createAdminClient();
  const { error } = await sb.from('newsletter_subscribers').upsert({ email: e }, { onConflict: 'email', ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, stored: true };
}

// ---------- Analytics ----------
function parseDevice(ua = '') {
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return 'tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/.test(s)) return 'mobile';
  return 'desktop';
}

export async function trackEvent({ type, path, productId, sessionId } = {}) {
  try {
    if (!hasSupabase()) return { ok: true, stored: false };
    const t = type === 'product_view' ? 'product_view' : 'page_view';
    const { headers } = await import('next/headers');
    const h = await headers();
    const ua = h.get('user-agent') || '';
    const referrer = h.get('referer') || null;
    const sb = createAdminClient();
    await sb.from('events').insert({
      type: t,
      path: str(path, 300),
      product_id: str(productId, 60),
      referrer: str(referrer, 400),
      device: parseDevice(ua),
      session_id: str(sessionId, 60),
    });
    return { ok: true, stored: true };
  } catch {
    return { ok: false };
  }
}
