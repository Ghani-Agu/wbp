import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabase() {
  return Boolean(URL && ANON);
}

// Cookie-bound client (carries the auth session). Anon key + RLS.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(list) {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* called from a Server Component — safe to ignore */ }
      },
    },
  });
}

// Service-role client. Bypasses RLS. Server-only — never expose to the browser.
export function createAdminClient() {
  if (!URL || !SERVICE) throw new Error('Supabase service role env vars are not set.');
  return createSupabaseClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
