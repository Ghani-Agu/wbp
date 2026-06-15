import { createAdminClient, hasSupabase } from '@/lib/supabase/server';
import BrandsManager from '@/components/admin/BrandsManager';
export const dynamic = 'force-dynamic';
export default async function BrandsAdmin() {
  if (!hasSupabase()) return null;
  const sb = createAdminClient();
  const { data } = await sb.from('brands').select('*').order('sort');
  return (<><h1 className="adm-h1">Marques</h1><p className="adm-sub">Modifiez les marques affichées sur le site.</p><BrandsManager brands={data || []} /></>);
}
