'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCategory } from '@/app/admin/actions';

function CatRow({ c, isNew }) {
  const router = useRouter();
  const [f, setF] = useState({ id: c?.id || '', icon: c?.icon || 'box',
    name_fr: c?.name?.fr || '', name_en: c?.name?.en || '', name_ar: c?.name?.ar || '',
    blurb_fr: c?.blurb?.fr || '', blurb_en: c?.blurb?.en || '', blurb_ar: c?.blurb?.ar || '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    const res = await updateCategory(f);
    setMsg(res.ok ? 'Enregistré ✓' : (res.error || 'Erreur'));
    if (res.ok) { router.refresh(); if (isNew) setF({ id: '', icon: 'box', name_fr: '', name_en: '', name_ar: '', blurb_fr: '', blurb_en: '', blurb_ar: '' }); }
    setTimeout(() => setMsg(''), 2500);
  };
  const icons = ['camera', 'shield', 'fingerprint', 'door', 'monitor', 'flame', 'wifi', 'drive', 'box', 'layers'];
  return (
    <div className="adm-panel" style={{ padding: 16 }}>
      <div className="adm-grid3">
        <label>ID<input value={f.id} onChange={set('id')} disabled={!isNew} placeholder="sensors" /></label>
        <label>Icône<select value={f.icon} onChange={set('icon')}>{icons.map((i) => <option key={i} value={i}>{i}</option>)}</select></label>
        <label>Nom FR<input value={f.name_fr} onChange={set('name_fr')} /></label>
      </div>
      <div className="adm-grid2" style={{ marginTop: 12 }}>
        <label>Nom EN<input value={f.name_en} onChange={set('name_en')} /></label>
        <label>Nom AR<input value={f.name_ar} onChange={set('name_ar')} dir="rtl" /></label>
      </div>
      <div className="adm-grid3" style={{ marginTop: 12 }}>
        <label>Sous-titre FR<input value={f.blurb_fr} onChange={set('blurb_fr')} /></label>
        <label>Sous-titre EN<input value={f.blurb_en} onChange={set('blurb_en')} /></label>
        <label>Sous-titre AR<input value={f.blurb_ar} onChange={set('blurb_ar')} dir="rtl" /></label>
      </div>
      <div className="adm-actions" style={{ marginTop: 12 }}>
        <button className="adm-btn primary" onClick={save}>{isNew ? 'Ajouter' : 'Enregistrer'}</button>
        {msg && <span className="adm-muted" style={{ alignSelf: 'center' }}>{msg}</span>}
      </div>
    </div>
  );
}

export default function CategoriesManager({ categories }) {
  return (
    <>
      {categories.map((c) => <CatRow key={c.id} c={c} />)}
      <h2 className="adm-h1" style={{ fontSize: 18, marginTop: 20 }}>Ajouter une catégorie</h2>
      <CatRow isNew />
    </>
  );
}
