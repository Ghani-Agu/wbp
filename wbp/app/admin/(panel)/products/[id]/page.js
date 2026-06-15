import { createAdminClient, hasSupabase } from '@/lib/supabase/server';
import ProductEditor from '@/components/admin/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function ProductEditPage({ params }) {
  if (!hasSupabase()) return null;
  const { id } = await params;
  const isNew = id === 'new';
  const sb = createAdminClient();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    sb.from('brands').select('*').order('sort'),
    sb.from('categories').select('*').order('sort'),
  ]);
  const cats = (categories || []).map((c) => ({ id: c.id, fr: c.name?.fr }));
  let product = null;
  if (!isNew) {
    const { data } = await sb.from('products').select('*').eq('id', id).maybeSingle();
    if (data) product = { ...data, reviews: data.reviews_count };
  }
  return (
    <>
      <h1 className="adm-h1">{isNew ? 'Nouveau produit' : 'Modifier le produit'}</h1>
      <p className="adm-sub">{isNew ? 'Ajoutez une référence au catalogue.' : product?.name}</p>
      <ProductEditor product={product} brands={brands || []} categories={cats} isNew={isNew} />
    </>
  );
}
