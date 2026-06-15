'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/app/actions';

function sessionId() {
  try {
    let id = localStorage.getItem('wbp_sid');
    if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); localStorage.setItem('wbp_sid', id); }
    return id;
  } catch { return null; }
}

export default function Analytics() {
  const pathname = usePathname();
  const last = useRef(null);
  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    const m = pathname.match(/^\/product\/([^/]+)/);
    const payload = m
      ? { type: 'product_view', path: pathname, productId: decodeURIComponent(m[1]), sessionId: sessionId() }
      : { type: 'page_view', path: pathname, sessionId: sessionId() };
    const id = setTimeout(() => { trackEvent(payload).catch(() => {}); }, 350);
    return () => clearTimeout(id);
  }, [pathname]);
  return null;
}
