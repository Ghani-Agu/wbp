import { createAdminClient, hasSupabase } from '@/lib/supabase/server';
import { DeleteBtn } from '@/components/admin/controls';
export const dynamic = 'force-dynamic';
export default async function Subscribers() {
  if (!hasSupabase()) return null;
  const sb = createAdminClient();
  const { data } = await sb.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
  return (
    <>
      <h1 className="adm-h1">Abonnés newsletter</h1>
      <p className="adm-sub">{data?.length || 0} abonné(s).</p>
      <div className="adm-panel">
        {(!data || data.length === 0) ? <div className="adm-empty">Aucun abonné.</div> : (
          <table className="adm-table">
            <thead><tr><th>Date</th><th>E-mail</th><th></th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}><td className="adm-muted">{(s.created_at || '').slice(0, 10)}</td><td>{s.email}</td><td><DeleteBtn kind="subscriber" id={s.id} /></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
