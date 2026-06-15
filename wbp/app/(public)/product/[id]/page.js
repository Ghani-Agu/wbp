import { notFound } from 'next/navigation';
import Product from '@/components/pages/Product';
import { getProduct, getReviews } from '@/lib/queries';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Produit introuvable' };
  const tag = product.tag?.fr || '';
  return { title: product.name, description: `${product.name} (${product.code}). ${tag}. Prix sur devis — World Business Plus.` };
}

export default async function Page({ params }) {
  const { id } = await params;
  const [product, reviews] = await Promise.all([getProduct(id), getReviews(id)]);
  if (!product) notFound();
  return <Product product={product} initialReviews={reviews} />;
}
