'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr(error.message); setBusy(false); return; }
      router.push(sp.get('next') || '/admin');
      router.refresh();
    } catch (e2) { setErr(e2.message || 'Erreur'); setBusy(false); }
  };
  return (
    <form className="adm-login-card" onSubmit={submit}>
      <div className="logo-chip">W</div>
      <h1>World Business Plus</h1>
      <p>Espace d’administration</p>
      {err && <div className="adm-err">{err}</div>}
      <div className="adm-form">
        <label>E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
        <label>Mot de passe<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        <button className="adm-btn primary" type="submit" disabled={busy} style={{ marginTop: 4, justifyContent: 'center' }}>{busy ? '…' : 'Se connecter'}</button>
      </div>
    </form>
  );
}
