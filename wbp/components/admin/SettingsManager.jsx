'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSetting, addClient, deleteClient } from '@/app/admin/actions';

function Saver({ label, onSave }) {
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="adm-actions" style={{ marginTop: 14 }}>
      <button className="adm-btn primary" disabled={busy} onClick={async () => { setBusy(true); const r = await onSave(); setBusy(false); setMsg(r?.ok ? 'Enregistré ✓' : (r?.error || 'Erreur')); setTimeout(() => setMsg(''), 2500); }}>
        {busy ? '…' : (label || 'Enregistrer')}
      </button>
      {msg && <span className="adm-muted" style={{ alignSelf: 'center' }}>{msg}</span>}
    </div>
  );
}

export default function SettingsManager({ settings, clients }) {
  const router = useRouter();
  const [wa, setWa] = useState(settings.whatsapp || '');
  const [c, setC] = useState({
    email: settings.contact?.email || '', fax: settings.contact?.fax || '',
    phones: (settings.contact?.phones || []).join(', '),
    addr_fr: settings.contact?.address?.fr || '', addr_en: settings.contact?.address?.en || '', addr_ar: settings.contact?.address?.ar || '',
  });
  const [hero, setHero] = useState({
    fr_t: settings.hero?.fr?.title || '', fr_s: settings.hero?.fr?.sub || '',
    en_t: settings.hero?.en?.title || '', en_s: settings.hero?.en?.sub || '',
    ar_t: settings.hero?.ar?.title || '', ar_s: settings.hero?.ar?.sub || '',
  });
  const [newClient, setNewClient] = useState('');
  const refresh = () => router.refresh();

  return (
    <>
      <div className="adm-card-form" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>WhatsApp & contact</h2>
        <div className="adm-form">
          <div className="adm-grid2">
            <label>Numéro WhatsApp (format international, sans +)<input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="213559533698" /></label>
            <label>E-mail<input value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></label>
          </div>
          <div className="adm-grid2">
            <label>Téléphones (séparés par des virgules)<input value={c.phones} onChange={(e) => setC({ ...c, phones: e.target.value })} /></label>
            <label>Ligne fax/tél<input value={c.fax} onChange={(e) => setC({ ...c, fax: e.target.value })} /></label>
          </div>
          <label>Adresse (FR)<input value={c.addr_fr} onChange={(e) => setC({ ...c, addr_fr: e.target.value })} /></label>
          <div className="adm-grid2">
            <label>Adresse (EN)<input value={c.addr_en} onChange={(e) => setC({ ...c, addr_en: e.target.value })} /></label>
            <label>Adresse (AR)<input value={c.addr_ar} onChange={(e) => setC({ ...c, addr_ar: e.target.value })} dir="rtl" /></label>
          </div>
        </div>
        <Saver onSave={async () => {
          const r1 = await saveSetting('whatsapp', wa.trim());
          const r2 = await saveSetting('contact', {
            email: c.email.trim(), fax: c.fax.trim(),
            phones: c.phones.split(',').map((x) => x.trim()).filter(Boolean),
            address: { fr: c.addr_fr, en: c.addr_en, ar: c.addr_ar },
          });
          refresh(); return r1.ok && r2.ok ? { ok: true } : { ok: false, error: r1.error || r2.error };
        }} />
      </div>

      <div className="adm-card-form" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Bandeau d’accueil (laisser vide = texte par défaut)</h2>
        <div className="adm-form">
          {[['fr', 'Français'], ['en', 'English'], ['ar', 'العربية']].map(([l, lbl]) => (
            <div className="adm-grid2" key={l}>
              <label>Titre {lbl}<input value={hero[l + '_t']} onChange={(e) => setHero({ ...hero, [l + '_t']: e.target.value })} dir={l === 'ar' ? 'rtl' : 'ltr'} /></label>
              <label>Sous-titre {lbl}<input value={hero[l + '_s']} onChange={(e) => setHero({ ...hero, [l + '_s']: e.target.value })} dir={l === 'ar' ? 'rtl' : 'ltr'} /></label>
            </div>
          ))}
        </div>
        <Saver onSave={async () => {
          const r = await saveSetting('hero', { fr: { title: hero.fr_t, sub: hero.fr_s }, en: { title: hero.en_t, sub: hero.en_s }, ar: { title: hero.ar_t, sub: hero.ar_s } });
          refresh(); return r;
        }} />
      </div>

      <div className="adm-card-form">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Clients / références ({clients.length})</h2>
        <div className="adm-actions" style={{ marginBottom: 12 }}>
          <input className="adm-form" style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 11, minWidth: 240 }} value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Nom du client" />
          <button className="adm-btn primary" onClick={async () => { if (!newClient.trim()) return; await addClient(newClient.trim()); setNewClient(''); refresh(); }}>Ajouter</button>
        </div>
        <div className="adm-actions">
          {clients.map((cl) => (
            <span key={cl.id} className="adm-tag blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 6px 5px 12px' }}>
              {cl.name}
              <button className="adm-btn sm danger" style={{ padding: '1px 7px' }} onClick={async () => { await deleteClient(cl.id); refresh(); }}>×</button>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
