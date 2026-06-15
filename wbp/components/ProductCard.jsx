'use client';
import React, { useState } from 'react';
import { useApp } from '@/components/ctx';
import { Reveal, Badge, ProductImage, Stars, Icon, useTilt, fmtRating } from '@/components/primitives';

export default function ProductCard({ product, index = 0 }) {
  const { t, nav, addToCart, lang, wbp } = useApp();
  const tilt = useTilt(5);
  const cat = wbp.categoryById(product.cat);
  const [added, setAdded] = useState(false);
  return (
    <Reveal className="pcard-wrap" delay={(index % 4) * 70}>
      <article className="pcard" ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}
        onClick={() => nav('product', { id: product.id })}>
        <div className="pcard-media">
          <Badge kind={product.badge} />
          <ProductImage product={product} />
          <button className="pcard-quick" aria-label={t('add_to_cart')} title={t('add_to_cart')}
            onClick={(e) => { e.stopPropagation(); addToCart(product); setAdded(true); setTimeout(() => setAdded(false), 1100); }}>
            <Icon name={added ? 'check' : 'plus'} size={18} />
          </button>
        </div>
        <div className="pcard-body">
          <span className="pcard-cat">{cat ? cat[lang] : ''}</span>
          <h3 className="pcard-title">{product.name}</h3>
          {product.rating > 0 && (
            <div className="pcard-meta">
              <Stars value={product.rating} size={13} />
              <span className="pcard-rev">{fmtRating(product.rating)} · {product.reviews} {product.reviews > 1 ? t('reviews') : t('review_one')}</span>
            </div>
          )}
          <div className="pcard-foot">
            <span className="pcard-price">{t('price_quote')}</span>
            <span className="pcard-go"><span>{t('shop_now')}</span><Icon name="arrow" size={15} /></span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
