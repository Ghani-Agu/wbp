import { createAdminClient, hasSupabase } from '@/lib/supabase/server';
import CategoriesManager from '@/components/admin/CategoriesManager';
export const dynamic = 'force-dynamic';
export default async function CategoriesAdmin() {
  if (!hasSupabase()) return null;
  const sb = createAdminClient();
  const { data } = await sb.from('categories').select('*').order('sort');
  return (<><h1 className="adm-h1">Catégories</h1><p className="adm-sub">Modifiez les catégories du catalogue.</p><CategoriesManager categories={data || []} /></>);
}
