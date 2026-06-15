'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertProduct } from '@/app/admin/actions';

export default function ProductEditor({ product, brands, categories, isNew }) {
  const router = useRouter();
  const [f, setF] = useState({
    id: product?.id || '', name: product?.name || '', code: product?.code || '',
    cat: product?.cat || (categories[0]?.id || ''), brand: product?.brand || (brands[0]?.id || ''),
    badge: product?.badge || '', rating: product?.rating ?? 4.5, reviews_count: product?.reviews ?? 0,
    tag_fr: product?.tag?.fr || '', tag_en: product?.tag?.en || '', tag_ar: product?.tag?.ar || '',
    image_url: product?.image_url || '', price: product?.price ?? '', active: product?.active ?? true, sort: product?.sort ?? 0,
  });
  const [specs, setSpecs] = useState(product?.specs?.length ? product.specs : [['', '']]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setSpec = (i, j) => (e) => setSpecs((s) => s.map((r, ri) => ri === i ? (j === 0 ? [e.target.value, r[1]] : [r[0], e.target.value]) : r));

  const save = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const res = await upsertProduct({ ...f, specs });
    setBusy(false);
    if (!res.ok) { setErr(res.error || 'Erreur'); return; }
    router.push('/admin/products'); router.refresh();
  };

  return (
    <form className="adm-form" onSubmit={save}>
      {err && <div className="adm-err">{err}</div>}
      <div className="adm-grid2">
        <label>Identifiant (slug)<input value={f.id} onChange={set('id')} disabled={!isNew} placeholder="p28" required /></label>
        <label>Référence / code<input value={f.code} onChange={set('code')} required /></label>
      </div>
      <label>Nom du produit<input value={f.name} onChange={set('name')} required /></label>
      <div className="adm-grid3">
        <label>Catégorie<select value={f.cat} onChange={set('cat')}>{categories.map((c) => <option key={c.id} value={c.id}>{c.fr || c.id}</option>)}</select></label>
        <label>Marque<select value={f.brand} onChange={set('brand')}>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label>Badge<select value={f.badge} onChange={set('badge')}><option value="">—</option><option value="bestseller">Best-seller</option><option value="new">Nouveau</option></select></label>
      </div>
      <div className="adm-grid3">
        <label>Note (0–5)<input type="number" step="0.1" min="0" max="5" value={f.rating} onChange={set('rating')} /></label>
        <label>Nb d’avis (affiché)<input type="number" min="0" value={f.reviews_count} onChange={set('reviews_count')} /></label>
        <label>Ordre<input type="number" value={f.sort} onChange={set('sort')} /></label>
      </div>
      <div className="adm-grid3">
        <label>Accroche FR<input value={f.tag_fr} onChange={set('tag_fr')} /></label>
        <label>Accroche EN<input value={f.tag_en} onChange={set('tag_en')} /></label>
        <label>Accroche AR<input value={f.tag_ar} onChange={set('tag_ar')} dir="rtl" /></label>
      </div>
      <div className="adm-grid2"><label>Prix de vente (DA, optionnel)<input type="number" step="0.01" value={f.price} onChange={set('price')} placeholder="0" /></label><label>URL image (optionnel)<input value={f.image_url} onChange={set('image_url')} placeholder="https://…" /></label></div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Spécifications</div>
        {specs.map((r, i) => (
          <div className="adm-spec-row" key={i} style={{ marginBottom: 8 }}>
            <input placeholder="Caractéristique" value={r[0]} onChange={setSpec(i, 0)} />
            <input placeholder="Valeur" value={r[1]} onChange={setSpec(i, 1)} />
            <button type="button" className="adm-btn danger sm" onClick={() => setSpecs((s) => s.filter((_, ri) => ri !== i))}>×</button>
          </div>
        ))}
        <button type="button" className="adm-btn sm" onClick={() => setSpecs((s) => [...s, ['', '']])}>+ Ligne</button>
      </div>
      <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={f.active} onChange={set('active')} style={{ width: 'auto' }} /> Visible sur le site
      </label>
      <div className="adm-actions">
        <button className="adm-btn primary" type="submit" disabled={busy}>{busy ? '…' : 'Enregistrer'}</button>
        <button className="adm-btn" type="button" onClick={() => router.push('/admin/products')}>Annuler</button>
      </div>
    </form>
  );
}
