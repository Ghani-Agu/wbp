import { createAdminClient, hasSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export async function GET(req) {
  try {
    const sid = new URL(req.url).searchParams.get('s');
    if (sid && hasSupabase()) {
      const sb = createAdminClient();
      const { data } = await sb.from('email_campaign_sends').select('id,opened_at').eq('id', sid).maybeSingle();
      if (data && !data.opened_at) {
        await sb.from('email_campaign_sends').update({ opened_at: new Date().toISOString() }).eq('id', sid);
      }
    }
  } catch { /* never block the pixel */ }
  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
