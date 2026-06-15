import { createClient, hasSupabase } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export async function getSessionUser() {
  if (!hasSupabase()) return null;
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    return user || null;
  } catch { return null; }
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) throw new Error('Not authorized');
  return user;
}
