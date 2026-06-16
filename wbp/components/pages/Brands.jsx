'use client';
import React from 'react';
import { useApp } from '@/components/ctx';
import { Reveal, Icon } from '@/components/primitives';
import { brandLogo } from '@/lib/logos';

export default function Brands() {
  const { t, lang, nav, wbp } = useApp();
  return (
    <main className="page-brands">
      <div className="cat-hero">
        <div className="wrap">
          <nav className="crumbs"><button onClick={() => nav('home')}>{t('nav_home')}</button><Icon name="chevright" size={13} /><span>{t('nav_brands')}</span></nav>
          <Reveal as="h1" className="cat-hero-title">{t('brands_title')}</Reveal>
          <Reveal as="p" className="cat-hero-sub" delay={80}>{t('brands_sub')}</Reveal>
        </div>
      </div>
      <div className="wrap">
        <div className="brands-page-grid">
          {wbp.brands.map((b, i) => {
            const count = wbp.products.filter((p) => p.brand === b.id).length;
            return (
              <Reveal key={b.id} delay={(i % 2) * 70}>
                <div className="brandx" style={{ '--bc': b.color }}>
                  <div className="brandx-head">
                    {brandLogo(b)
                      ? <span className="brandx-logo"><img src={brandLogo(b)} alt={b.name} loading="lazy" /></span>
                      : <span className="brandx-mark">{b.short.slice(0, 2)}</span>}
                    <div><h3>{b.name}</h3><span className="brandx-count">{count} {t('products_count')}</span></div>
                  </div>
                  <p className="brandx-desc">{b.desc[lang] || b.desc.fr}</p>
                  <button className="brandx-cta" onClick={() => nav('catalog', { brand: b.id })}>{t('view_products')} <Icon name="arrow" size={16} /></button>
                  <span className="brandx-watermark">{b.short.slice(0, 2)}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </main>
  );
}
