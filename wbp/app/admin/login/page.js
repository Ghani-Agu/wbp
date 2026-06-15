import { Suspense } from 'react';
import '../admin.css';
import LoginForm from '@/components/admin/LoginForm';

export const metadata = { title: 'Admin — Connexion' };

export default function AdminLoginPage() {
  return (
    <div className="adm-login">
      <Suspense fallback={<div className="adm-login-card"><h1>World Business Plus</h1><p>Chargement…</p></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
