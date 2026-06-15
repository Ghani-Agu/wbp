'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateBrand } from '@/app/admin/actions';

function BrandRow({ b, isNew }) {
  const router = useRouter();
  const [f, setF] = useState({ id: b?.id || '', name: b?.name || '', short: b?.short || '', color: b?.color || '#FF5A1F',
    desc_fr: b?.description?.fr || '', desc_en: b?.description?.en || '', desc_ar: b?.description?.ar || '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    const res = await updateBrand(f);
    setMsg(res.ok ? 'Enregistré ✓' : (res.error || 'Erreur'));
    if (res.ok) { router.refresh(); if (isNew) setF({ id: '', name: '', short: '', color: '#FF5A1F', desc_fr: '', desc_en: '', desc_ar: '' }); }
    setTimeout(() => setMsg(''), 2500);
  };
  return (
    <div className="adm-panel" style={{ padding: 16 }}>
      <div className="adm-grid3">
        <label>ID<input value={f.id} onChange={set('id')} disabled={!isNew} placeholder="hikvision" /></label>
        <label>Nom<input value={f.name} onChange={set('name')} /></label>
        <label>Abrégé<input value={f.short} onChange={set('short')} /></label>
      </div>
      <div className="adm-grid3" style={{ marginTop: 12 }}>
        <label>Couleur<input type="color" value={f.color} onChange={set('color')} style={{ height: 38 }} /></label>
        <label>Description FR<input value={f.desc_fr} onChange={set('desc_fr')} /></label>
        <label>Description EN<input value={f.desc_en} onChange={set('desc_en')} /></label>
      </div>
      <label style={{ marginTop: 12 }}>Description AR<input value={f.desc_ar} onChange={set('desc_ar')} dir="rtl" /></label>
      <div className="adm-actions" style={{ marginTop: 12 }}>
        <button className="adm-btn primary" onClick={save}>{isNew ? 'Ajouter' : 'Enregistrer'}</button>
        {msg && <span className="adm-muted" style={{ alignSelf: 'center' }}>{msg}</span>}
      </div>
    </div>
  );
}

export default function BrandsManager({ brands }) {
  return (
    <>
      {brands.map((b) => <BrandRow key={b.id} b={b} />)}
      <h2 className="adm-h1" style={{ fontSize: 18, marginTop: 20 }}>Ajouter une marque</h2>
      <BrandRow isNew />
    </>
  );
}
