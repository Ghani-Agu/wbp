'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, siteUrl } from '@/lib/email/send';
import { wrapEmail, rewriteLinksForTracking, trackingPixel } from '@/lib/email/template';

const s = (v, max = 4000) => (v == null || v === '' ? null : String(v).slice(0, max));

export async function signOutAction() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect('/admin/login');
}

// ---------- Products ----------
export async function upsertProduct(p) {
  await requireAdmin();
  const sb = createAdminClient();
  const specs = Array.isArray(p.specs) ? p.specs.filter((r) => r[0] || r[1]).map((r) => [s(r[0], 120) || '', s(r[1], 300) || '']) : [];
  const row = {
    id: s(p.id, 60), cat: s(p.cat, 60), brand: s(p.brand, 60),
    name: s(p.name, 300), code: s(p.code, 120), badge: p.badge ? s(p.badge, 30) : null,
    rating: Math.min(5, Math.max(0, Number(p.rating) || 0)),
    reviews_count: Math.max(0, parseInt(p.reviews_count, 10) || 0),
    tag: { fr: s(p.tag_fr, 200) || '', en: s(p.tag_en, 200) || '', ar: s(p.tag_ar, 200) || '' },
    specs, image_url: s(p.image_url, 600), price: (p.price === '' || p.price == null) ? null : Number(p.price), active: !!p.active, sort: parseInt(p.sort, 10) || 0,
  };
  if (!row.id || !row.name || !row.code) return { ok: false, error: 'id, nom et code sont requis' };
  const { error } = await sb.from('products').upsert(row, { onConflict: 'id' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/products'); revalidatePath('/');
  return { ok: true };
}
export async function deleteProduct(id) {
  await requireAdmin();
  const sb = createAdminClient();
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/products'); revalidatePath('/');
  return { ok: true };
}
export async function toggleProductActive(id, active) {
  await requireAdmin();
  const sb = createAdminClient();
  await sb.from('products').update({ active }).eq('id', id);
  revalidatePath('/admin/products'); revalidatePath('/');
  return { ok: true };
}

// ---------- Brands / Categories ----------
export async function updateBrand(b) {
  await requireAdmin();
  const sb = createAdminClient();
  const row = { id: s(b.id, 60), name: s(b.name, 200), short: s(b.short, 60), color: s(b.color, 20),
    description: { fr: s(b.desc_fr, 1000) || '', en: s(b.desc_en, 1000) || '', ar: s(b.desc_ar, 1000) || '' } };
  const { error } = await sb.from('brands').upsert(row, { onConflict: 'id' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/brands'); revalidatePath('/'); return { ok: true };
}
export async function updateCategory(c) {
  await requireAdmin();
  const sb = createAdminClient();
  const row = { id: s(c.id, 60), icon: s(c.icon, 40),
    name: { fr: s(c.name_fr, 200) || '', en: s(c.name_en, 200) || '', ar: s(c.name_ar, 200) || '' },
    blurb: { fr: s(c.blurb_fr, 400) || '', en: s(c.blurb_en, 400) || '', ar: s(c.blurb_ar, 400) || '' } };
  const { error } = await sb.from('categories').upsert(row, { onConflict: 'id' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/categories'); revalidatePath('/'); return { ok: true };
}

// ---------- Leads / moderation ----------
export async function updateQuoteStatus(id, status) {
  await requireAdmin(); const sb = createAdminClient();
  await sb.from('quote_requests').update({ status: s(status, 30) }).eq('id', id);
  revalidatePath('/admin/quotes'); revalidatePath('/admin'); return { ok: true };
}
export async function deleteQuote(id) {
  await requireAdmin(); const sb = createAdminClient();
  await sb.from('quote_requests').delete().eq('id', id);
  revalidatePath('/admin/quotes'); revalidatePath('/admin'); return { ok: true };
}
export async function updateMessageStatus(id, status) {
  await requireAdmin(); const sb = createAdminClient();
  await sb.from('contact_messages').update({ status: s(status, 30) }).eq('id', id);
  revalidatePath('/admin/messages'); revalidatePath('/admin'); return { ok: true };
}
export async function deleteMessage(id) {
  await requireAdmin(); const sb = createAdminClient();
  await sb.from('contact_messages').delete().eq('id', id);
  revalidatePath('/admin/messages'); revalidatePath('/admin'); return { ok: true };
}
export async function setReviewApproved(id, approved) {
  await requireAdmin(); const sb = createAdminClient();
  await sb.from('reviews').update({ approved }).eq('id', id);
  revalidatePath('/admin/reviews'); return { ok: true };
}
export async function deleteReview(id) {
  await requireAdmin(); const sb = createAdminClient();
  await sb.from('reviews').delete().eq('id', id);
  revalidatePath('/admin/reviews'); return { ok: true };
}
export async function deleteSubscriber(id) {
  await requireAdmin(); const sb = createAdminClient();
  await sb.from('newsletter_subscribers').delete().eq('id', id);
  revalidatePath('/admin/subscribers'); return { ok: true };
}

// ---------- Settings & clients ----------
export async function saveSetting(key, value) {
  await requireAdmin();
  const sb = createAdminClient();
  const { error } = await sb.from('settings').upsert({ key: s(key, 60), value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/settings'); revalidatePath('/', 'layout');
  return { ok: true };
}
export async function addClient(name) {
  await requireAdmin();
  const nm = s(name, 200); if (!nm) return { ok: false, error: 'Nom requis' };
  const sb = createAdminClient();
  const { error } = await sb.from('clients').insert({ name: nm, sort: 999 });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/settings'); revalidatePath('/', 'layout');
  return { ok: true };
}
export async function deleteClient(id) {
  await requireAdmin();
  const sb = createAdminClient();
  await sb.from('clients').delete().eq('id', id);
  revalidatePath('/admin/settings'); revalidatePath('/', 'layout');
  return { ok: true };
}

// ---------- Email campaigns ----------
export async function createCampaign() {
  await requireAdmin();
  const sb = createAdminClient();
  const { data, error } = await sb.from('email_campaigns')
    .insert({ subject: 'Nouvelle campagne', body_html: '' }).select('id').single();
  if (error) throw new Error(error.message);
  redirect(`/admin/campaigns/${data.id}`);
}

export async function updateCampaign(id, p) {
  await requireAdmin();
  const sb = createAdminClient();
  const row = {
    subject: s(p.subject, 300) || 'Sans objet',
    preheader: s(p.preheader, 300),
    body_html: s(p.body_html, 100000) || '',
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from('email_campaigns').update(row).eq('id', s(id, 60));
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/campaigns/${id}`); revalidatePath('/admin/campaigns');
  return { ok: true };
}

export async function deleteCampaign(id) {
  await requireAdmin();
  const sb = createAdminClient();
  await sb.from('email_campaigns').delete().eq('id', s(id, 60));
  revalidatePath('/admin/campaigns');
  return { ok: true };
}

function renderCampaignHtml(campaign, { unsubscribeUrl, sendId }) {
  let body = campaign.body_html || '';
  if (sendId) body = rewriteLinksForTracking(body, sendId);
  body += trackingPixel(sendId);
  return wrapEmail({ title: campaign.subject, preheader: campaign.preheader, bodyHtml: body, unsubscribeUrl, lang: 'fr' });
}

export async function sendTestCampaign(id, email) {
  await requireAdmin();
  const to = s(email, 200);
  if (!to || !to.includes('@')) return { ok: false, error: 'E-mail invalide' };
  const sb = createAdminClient();
  const { data: c } = await sb.from('email_campaigns').select('*').eq('id', s(id, 60)).single();
  if (!c) return { ok: false, error: 'Campagne introuvable' };
  const html = renderCampaignHtml(c, { unsubscribeUrl: `${siteUrl()}/newsletter/unsubscribe?token=TEST`, sendId: null });
  const r = await sendEmail({ to, subject: `[TEST] ${c.subject}`, html });
  return r.ok ? { ok: true, dev: !!r.dev } : { ok: false, error: r.error };
}

export async function sendCampaign(id) {
  await requireAdmin();
  const sb = createAdminClient();
  const cid = s(id, 60);
  const { data: c } = await sb.from('email_campaigns').select('*').eq('id', cid).single();
  if (!c) return { ok: false, error: 'Campagne introuvable' };
  if (c.status === 'sent') return { ok: false, error: 'Campagne déjà envoyée' };
  const { data: subs } = await sb.from('newsletter_subscribers')
    .select('id,email,token,lang').eq('status', 'subscribed');
  const list = subs || [];
  await sb.from('email_campaigns').update({ status: 'sending' }).eq('id', cid);
  let sent = 0, failed = 0;
  for (const sub of list) {
    // Insert the send row first (unique on campaign+email) to dedupe and get a tracking id.
    const { data: srow, error: insErr } = await sb.from('email_campaign_sends')
      .insert({ campaign_id: cid, subscriber_id: sub.id, email: sub.email }).select('id').single();
    if (insErr || !srow) continue; // already sent to this address
    const unsubscribeUrl = `${siteUrl()}/newsletter/unsubscribe?token=${sub.token}&lang=${sub.lang || 'fr'}`;
    const html = renderCampaignHtml(c, { unsubscribeUrl, sendId: srow.id });
    const r = await sendEmail({ to: sub.email, subject: c.subject, html, headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` } });
    if (r.ok) { sent++; }
    else { failed++; await sb.from('email_campaign_sends').update({ status: 'failed', error: s(r.error, 300) }).eq('id', srow.id); }
  }
  await sb.from('email_campaigns')
    .update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: sent }).eq('id', cid);
  revalidatePath(`/admin/campaigns/${id}`); revalidatePath('/admin/campaigns');
  return { ok: true, sent, failed, total: list.length };
}
