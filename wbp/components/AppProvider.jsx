'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AppCtx } from '@/components/ctx';
import { make } from '@/lib/i18n';
import { WHATSAPP } from '@/lib/config';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import BottomNav from '@/components/BottomNav';

function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }

function buildWbp(catalog) {
  const { brands, categories, products, clients } = catalog;
  return {
    brands, categories, products, clients, WHATSAPP,
    brandById: (id) => brands.find((b) => b.id === id),
    categoryById: (id) => categories.find((c) => c.id === id),
    productById: (id) => products.find((p) => p.id === id),
  };
}

export default function AppProvider({ catalog, settings = {}, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const wbp = useMemo(() => { const w = buildWbp(catalog); if (settings.whatsapp) w.WHATSAPP = settings.whatsapp; return w; }, [catalog, settings.whatsapp]);
  const [lang, setLang] = useState('fr');
  const [theme, setTheme] = useState('light');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // hydrate persisted prefs after mount (avoids SSR mismatch)
  useEffect(() => {
    setLang(lsGet('wbp_lang', 'fr'));
    setTheme(lsGet('wbp_theme', 'light'));
    setCart(lsGet('wbp_cart', []));
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) lsSet('wbp_lang', lang); }, [lang, hydrated]);
  useEffect(() => { if (hydrated) lsSet('wbp_theme', theme); }, [theme, hydrated]);
  useEffect(() => { if (hydrated) lsSet('wbp_cart', cart); }, [cart, hydrated]);

  const t = useMemo(() => make(lang), [lang]);

  // apply document attributes + Arabic fonts
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', theme);
    r.setAttribute('dir', t.dir);
    r.setAttribute('lang', lang);
    if (lang === 'ar') {
      r.style.setProperty('--font-display', "'Cairo'");
      r.style.setProperty('--font-body', "'Tajawal'");
    } else {
      r.style.removeProperty('--font-display');
      r.style.removeProperty('--font-body');
    }
  }, [theme, lang, t.dir]);

  // derive a route object compatible with the original components
  const route = useMemo(() => {
    let view = 'home';
    if (pathname.startsWith('/catalog')) view = 'catalog';
    else if (pathname.startsWith('/product')) view = 'product';
    else if (pathname.startsWith('/brands')) view = 'brands';
    else if (pathname.startsWith('/about')) view = 'about';
    else if (pathname.startsWith('/contact')) view = 'contact';
    const params = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    if (view === 'product') { const m = pathname.match(/\/product\/([^/]+)/); if (m) params.id = decodeURIComponent(m[1]); }
    return { view, params };
  }, [pathname, searchParams]);

  useEffect(() => { document.documentElement.setAttribute('data-route', route.view); }, [route.view]);

  const nav = useCallback((view, params = {}) => {
    let url = '/';
    if (view === 'home') url = '/';
    else if (view === 'catalog') {
      const qs = new URLSearchParams();
      ['cat', 'brand', 'q'].forEach((k) => { if (params[k]) qs.set(k, params[k]); });
      url = '/catalog' + (qs.toString() ? `?${qs}` : '');
    } else if (view === 'product') url = '/product/' + encodeURIComponent(params.id);
    else url = '/' + view;
    setCartOpen(false);
    router.push(url);
  }, [router]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === product.id);
      if (ex) return c.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...c, { id: product.id, name: product.name, code: product.code, cat: product.cat, brand: product.brand, qty }];
    });
  }, []);
  const removeFromCart = useCallback((id) => setCart((c) => c.filter((i) => i.id !== id)), []);
  const setQty = useCallback((id, q) => setCart((c) => q <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => i.id === id ? { ...i, qty: q } : i)), []);
  const cartCount = cart.reduce((a, c) => a + c.qty, 0);

  const ctx = {
    t, lang, setLang, theme, setTheme, dir: t.dir, wbp,
    cart, addToCart, removeFromCart, setQty, cartCount, cartOpen, setCartOpen,
    route, nav, settings,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <Header />
      <div className="page-shell">{children}</div>
      <Footer />
      <CartDrawer />
      <BottomNav />
    </AppCtx.Provider>
  );
}
