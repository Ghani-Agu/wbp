'use client';
import React from 'react';
import { useApp } from '@/components/ctx';
import { Icon } from '@/components/primitives';

export default function BottomNav() {
  const { t, route, nav, cartCount, setCartOpen } = useApp();
  const tabs = [
    { view: 'home', icon: 'home', label: t('nav_home') },
    { view: 'catalog', icon: 'grid', label: t('nav_catalog') },
    { view: 'brands', icon: 'badge', label: t('nav_brands') },
  ];
  return (
    <nav className="botnav" aria-label="Navigation mobile">
      {tabs.map((tb) => (
        <button key={tb.view} className={`botnav-item ${route.view === tb.view ? 'on' : ''}`} onClick={() => nav(tb.view)}>
          <Icon name={tb.icon} size={21} />
          <span>{tb.label}</span>
        </button>
      ))}
      <button className="botnav-item" onClick={() => setCartOpen(true)} aria-label={t('cart')}>
        <span className="botnav-cart">
          <Icon name="cart" size={21} />
          {cartCount > 0 && <span className="botnav-badge">{cartCount}</span>}
        </span>
        <span>{t('cart')}</span>
      </button>
    </nav>
  );
}
