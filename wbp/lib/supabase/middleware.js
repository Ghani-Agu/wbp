import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  const res = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  if (!url || !anon) return res; // Supabase not configured yet
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(list) { list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    if (!user) {
      const u = request.nextUrl.clone();
      u.pathname = '/admin/login';
      u.searchParams.set('next', path);
      return NextResponse.redirect(u);
    }
  }
  return res;
}
