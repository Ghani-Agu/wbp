import { NextResponse } from 'next/server';
import { createAdminClient, hasSupabase } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const sid = url.searchParams.get('s');
  let target = url.searchParams.get('u') || '';
  try { target = decodeURIComponent(target); } catch { /* keep as-is */ }
  if (!/^https?:\/\//i.test(target)) target = siteUrl(); // only allow absolute http(s); else home

  try {
    if (sid && hasSupabase()) {
      const sb = createAdminClient();
      const { data } = await sb.from('email_campaign_sends').select('id,opened_at,clicked_at').eq('id', sid).maybeSingle();
      if (data) {
        const patch = {};
        if (!data.clicked_at) patch.clicked_at = new Date().toISOString();
        if (!data.opened_at) patch.opened_at = new Date().toISOString(); // a click implies an open
        if (Object.keys(patch).length) await sb.from('email_campaign_sends').update(patch).eq('id', sid);
      }
    }
  } catch { /* never block the redirect */ }

  return NextResponse.redirect(target, 302);
}
