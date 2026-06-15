'use client';
import React from 'react';
import { useApp } from '@/components/ctx';
import { Reveal, Icon, Stars, Badge, ProductImage, SectionHead, Btn, fmtRating, scrollTopSmooth } from '@/components/primitives';
import ProductCard from '@/components/ProductCard';
import { submitReview } from '@/app/actions';

function FicheModal({ product, brand, onClose }) {
  const { t, lang, wbp } = useApp();
  const cat = wbp.categoryById(product.cat);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fiche-scrim" onClick={onClose}>
      <div className="fiche" onClick={(e) => e.stopPropagation()}>
        <div className="fiche-hd">
          <div><span className="fiche-kicker"><Icon name="pdf" size={15} /> {t('fiche_technique')}</span><h3>{product.name}</h3></div>
          <button className="icon-btn" onClick={onClose} aria-label="close"><Icon name="close" size={18} /></button>
        </div>
        <div className="fiche-body">
          <div className="fiche-img"><ProductImage product={product} size="hero" /></div>
          <div className="fiche-meta">
            <div className="fiche-meta-row"><span>{t('ref')}</span><b>{product.code}</b></div>
            <div className="fiche-meta-row"><span>{t('brands')}</span><b>{brand.name}</b></div>
            <div className="fiche-meta-row"><span>{t('categories')}</span><b>{cat[lang]}</b></div>
            <table className="pp-spec-table fiche-specs"><tbody>{product.specs.map(([k, v], i) => <tr key={i}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
          </div>
        </div>
        <div className="fiche-foot">
          <span><Icon name="badge" size={14} /> World Business Plus — {t('agreed')}</span>
          <button className="btn btn-primary btn-md" onClick={() => window.print()}><Icon name="pdf" size={16} /> PDF</button>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ onSubmit, onCancel }) {
  const { t } = useApp();
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const valid = body.trim().length > 4 && author.trim().length > 1;
  return (
    <form className="rv-form" onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit({ rating, title: title.trim(), body: body.trim(), author: author.trim() }); }}>
      <div className="rv-form-rate"><span>{t('your_rating')}</span><Stars value={rating} size={26} onPick={setRating} /></div>
      <div className="rv-form-grid">
        <input className="rv-input" placeholder={t('your_name')} value={author} onChange={(e) => setAuthor(e.target.value)} />
        <input className="rv-input" placeholder={t('review_title_ph')} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <textarea className="rv-input rv-textarea" placeholder={t('review_body_ph')} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
      <div className="rv-form-actions">
        <Btn variant="ghost" onClick={onCancel} type="button">{t('clear')}</Btn>
        <button className="btn btn-primary btn-md" type="submit" disabled={!valid}>{t('submit_review')}</button>
      </div>
    </form>
  );
}

function ReviewSystem({ product, initialReviews }) {
  const { t } = useApp();
  const base = initialReviews || [];
  const [extra, setExtra] = React.useState([]);
  const [helpful, setHelpful] = React.useState({});
  const [filter, setFilter] = React.useState(0);
  const [sort, setSort] = React.useState('recent');
  const [showForm, setShowForm] = React.useState(false);
  const [thanks, setThanks] = React.useState(false);

  React.useEffect(() => { setExtra([]); setHelpful({}); setFilter(0); setShowForm(false); setThanks(false); }, [product.id]);

  const all = [...extra, ...base];
  const dist = [5, 4, 3, 2, 1].map((s) => all.filter((r) => Math.round(r.rating) === s).length);
  const total = all.length || product.reviews;
  const avg = all.length ? all.reduce((a, r) => a + r.rating, 0) / all.length : product.rating;

  let view = all.filter((r) => !filter || Math.round(r.rating) === filter);
  const sorters = {
    recent: (a, b) => new Date(b.date) - new Date(a.date),
    helpful: (a, b) => (b.helpful + (helpful[b._id] ? 1 : 0)) - (a.helpful + (helpful[a._id] ? 1 : 0)),
    high: (a, b) => b.rating - a.rating,
    low: (a, b) => a.rating - b.rating,
  };
  view = [...view].sort(sorters[sort]);

  const submit = async (rev) => {
    setExtra((e) => [{ ...rev, _id: 'u' + Date.now(), date: new Date().toISOString().slice(0, 10), helpful: 0, verified: false }, ...e]);
    setShowForm(false); setThanks(true); setTimeout(() => setThanks(false), 4000);
    try { await submitReview({ ...rev, product_id: product.id }); } catch { /* optimistic; ignore */ }
  };

  return (
    <div className="rv">
      <SectionHead kicker={t('sec_client_kicker')} kickerIcon="badge" title={t('reviews_title')} />
      <div className="rv-top">
        <Reveal className="rv-summary">
          <div className="rv-avg">
            <span className="rv-avg-n">{fmtRating(avg)}</span>
            <Stars value={avg} size={20} />
            <span className="rv-avg-c">{t('reviews_sub')} {total} {total > 1 ? t('reviews') : t('review_one')}</span>
          </div>
          <div className="rv-bars">
            {[5, 4, 3, 2, 1].map((s, i) => {
              const c = dist[i]; const pct = total ? (c / Math.max(total, all.length)) * 100 : 0;
              return (
                <button key={s} className={`rv-bar ${filter === s ? 'on' : ''}`} onClick={() => setFilter(filter === s ? 0 : s)}>
                  <span className="rv-bar-l">{s} <Icon name="star" size={12} style={{ color: 'var(--star)' }} /></span>
                  <span className="rv-bar-track"><span className="rv-bar-fill" style={{ width: pct + '%' }} /></span>
                  <span className="rv-bar-c">{c}</span>
                </button>
              );
            })}
          </div>
          <Btn variant="primary" icon="plus" onClick={() => setShowForm((s) => !s)}>{t('write_review')}</Btn>
        </Reveal>
        <div className="rv-list-col">
          <div className="rv-toolbar">
            <div className="rv-filter-chips">
              <button className={`rv-chip ${filter === 0 ? 'on' : ''}`} onClick={() => setFilter(0)}>{t('all_stars')}</button>
              {[5, 4, 3].map((s) => (<button key={s} className={`rv-chip ${filter === s ? 'on' : ''}`} onClick={() => setFilter(filter === s ? 0 : s)}>{s} ★</button>))}
            </div>
            <div className="rv-sort">
              <Icon name="layers" size={14} />
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">{t('sort_recent')}</option>
                <option value="helpful">{t('sort_helpful')}</option>
                <option value="high">{t('sort_high')}</option>
                <option value="low">{t('sort_low')}</option>
              </select>
            </div>
          </div>
          {thanks && <div className="rv-thanks"><Icon name="check" size={16} /> {t('review_thanks')}</div>}
          {showForm && <ReviewForm onSubmit={submit} onCancel={() => setShowForm(false)} />}
          <div className="rv-list">
            {view.length === 0 && <p className="sec-sub" style={{ padding: '8px 2px' }}>{t('reviews_sub')} 0 {t('reviews')}.</p>}
            {view.map((r) => {
              const voted = !!helpful[r._id];
              return (
                <Reveal className="rv-item" key={r._id}>
                  <div className="rv-item-hd">
                    <span className="rv-ava">{r.author.slice(0, 1)}</span>
                    <div className="rv-who"><b>{r.author}</b>{r.verified && <span className="rv-verified"><Icon name="check" size={12} /> {t('verified')}</span>}</div>
                    <span className="rv-date">{new Date(r.date).toLocaleDateString(t.lang === 'ar' ? 'ar' : (t.lang === 'en' ? 'en-GB' : 'fr-FR'), { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="rv-item-stars"><Stars value={r.rating} size={14} /></div>
                  {r.title && <h4 className="rv-item-title">{r.title}</h4>}
                  <p className="rv-item-body">{r.body}</p>
                  <div className="rv-item-foot">
                    <span className="rv-helpq">{t('was_helpful')}</span>
                    <button className={`rv-help ${voted ? 'on' : ''}`} onClick={() => setHelpful((h) => ({ ...h, [r._id]: !h[r._id] }))}>
                      <Icon name="check" size={14} /> {t('helpful')} ({r.helpful + (voted ? 1 : 0)})
                    </button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Product({ product, initialReviews }) {
  const { t, lang, nav, addToCart, wbp } = useApp();
  const brand = wbp.brandById(product.brand);
  const cat = wbp.categoryById(product.cat);
  const [qty, setQty] = React.useState(1);
  const [tab, setTab] = React.useState('overview');
  const [added, setAdded] = React.useState(false);
  const [ficheOpen, setFicheOpen] = React.useState(false);
  const [activeShot, setActiveShot] = React.useState(0);
  const reviewsRef = React.useRef(null);

  React.useEffect(() => { setQty(1); setTab('overview'); setActiveShot(0); scrollTopSmooth(); }, [product.id]);

  const similar = wbp.products.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);
  const waText = encodeURIComponent(`Bonjour World Business Plus,\nJe suis intéressé par : ${product.name} (${product.code}).\nQuantité souhaitée : ${qty}.\nMerci de m'envoyer un devis.`);
  const waLink = `https://wa.me/${wbp.WHATSAPP}?text=${waText}`;
  const tag = product.tag[lang] || product.tag.fr;
  const gallery = (product.images && product.images.length) ? product.images : null;

  return (
    <main className="page-product">
      <div className="wrap">
        <nav className="crumbs pp-crumbs">
          <button onClick={() => nav('home')}>{t('nav_home')}</button><Icon name="chevright" size={13} />
          <button onClick={() => nav('catalog', { cat: product.cat })}>{cat[lang]}</button><Icon name="chevright" size={13} />
          <span>{product.code}</span>
        </nav>
        <div className="pp-top">
          <div className="pp-gallery">
            <Reveal className="pp-stage">
              <Badge kind={product.badge} />
              <div className="pp-stage-img" key={activeShot}>
                {gallery
                  ? <img src={gallery[Math.min(activeShot, gallery.length - 1)]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                  : <ProductImage product={product} size="hero" />}
              </div>
              <span className="pp-brand-chip" style={{ '--bc': brand.color }}>{brand.short}</span>
            </Reveal>
            <div className="pp-thumbs">
              {(gallery || [0, 1, 2, 3]).map((g, i) => (
                <button key={i} className={`pp-thumb ${activeShot === i ? 'on' : ''}`} onClick={() => setActiveShot(i)}>
                  {gallery
                    ? <img src={g} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                    : <ProductImage product={product} />}
                  {!gallery && <span className="pp-thumb-n">{i === 0 ? '360°' : `0${i + 1}`}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="pp-info">
            <Reveal as="div" className="pp-info-head">
              <div className="pp-brand-row">
                <span className="pp-brand-tag" style={{ '--bc': brand.color }} onClick={() => nav('catalog', { brand: brand.id })}>{brand.name}</span>
                <span className="pp-stock"><span className="dot" /> {t('in_stock')}</span>
              </div>
              <h1 className="pp-title">{product.name}</h1>
              <p className="pp-tag">{tag}</p>
              <button className="pp-rating-link" onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                {product.rating > 0
                  ? (<><Stars value={product.rating} size={16} /><b>{fmtRating(product.rating)}</b><span>· {product.reviews} {product.reviews > 1 ? t('reviews') : t('review_one')}</span></>)
                  : (<span>{t('write_review')}</span>)}
              </button>
            </Reveal>
            <Reveal className="pp-price-card" delay={80}>
              <div className="pp-price-row">
                <div><span className="pp-price">{t('price_quote')}</span><span className="pp-price-note"><Icon name="badge" size={13} /> {t('quote_model')}</span></div>
                <div className="pp-qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-"><Icon name="minus" size={15} /></button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="+"><Icon name="plus" size={15} /></button>
                </div>
              </div>
              <div className="pp-actions">
                <button className="btn btn-primary btn-lg pp-add" onClick={() => { addToCart(product, qty); setAdded(true); setTimeout(() => setAdded(false), 1400); }}>
                  <Icon name={added ? 'check' : 'cart'} size={19} /><span>{added ? t('added') : t('add_to_cart')}</span>
                </button>
                <a className="btn btn-whatsapp btn-lg pp-wa" href={waLink} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={19} /><span>{t('shop_whatsapp')}</span></a>
              </div>
              <div className="pp-mini-actions">
                <button className="pp-mini-btn" onClick={() => setFicheOpen(true)}><Icon name="pdf" size={15} /> {t('fiche_technique')}</button>
                <button className="pp-mini-btn" onClick={() => nav('catalog', { cat: product.cat })}><Icon name="layers" size={15} /> {cat[lang]}</button>
                <button className="pp-mini-btn" aria-label={t('save')}><Icon name="heart" size={15} /> {t('save')}</button>
              </div>
            </Reveal>
            <Reveal className="pp-trust" delay={140}>
              <div className="pp-trust-item"><Icon name="badge" size={18} /><span>{t('agreed')}</span></div>
              <div className="pp-trust-item"><Icon name="headset" size={18} /><span>{t('why3_t')}</span></div>
              <div className="pp-trust-item"><Icon name="truck" size={18} /><span>{t('why4_t')}</span></div>
            </Reveal>
          </div>
        </div>
        <div className="pp-tabs-wrap">
          <div className="pp-tabs">
            {['overview', 'specifications', 'documents'].map((tb) => (<button key={tb} className={`pp-tab ${tab === tb ? 'on' : ''}`} onClick={() => setTab(tb)}>{t(tb)}</button>))}
          </div>
          <div className="pp-tab-body">
            {tab === 'overview' && (
              <div className="pp-overview">
                <p className="pp-desc">{t('desc_generic')}</p>
                <div className="pp-highlights">
                  {product.specs.slice(0, 4).map(([k, v], i) => (<div className="pp-hl" key={i}><span className="pp-hl-k">{k}</span><span className="pp-hl-v">{v}</span></div>))}
                </div>
              </div>
            )}
            {tab === 'specifications' && (
              <table className="pp-spec-table"><tbody>
                {product.specs.map(([k, v], i) => (<tr key={i}><th>{k}</th><td>{v}</td></tr>))}
                <tr><th>{t('ref')}</th><td>{product.code}</td></tr>
                <tr><th>{t('brands')}</th><td>{brand.name}</td></tr>
              </tbody></table>
            )}
            {tab === 'documents' && (
              <div className="pp-docs">
                <button className="pp-doc" onClick={() => setFicheOpen(true)}>
                  <span className="pp-doc-ic"><Icon name="pdf" size={22} /></span>
                  <span className="pp-doc-txt"><b>{t('fiche_technique')}</b><i>{product.code}.pdf</i></span><Icon name="arrow" size={16} />
                </button>
                <a className="pp-doc" href={waLink} target="_blank" rel="noopener noreferrer">
                  <span className="pp-doc-ic"><Icon name="whatsapp" size={22} /></span>
                  <span className="pp-doc-txt"><b>{t('whatsapp_chat')}</b><i>commercial@wbp-dz.com</i></span><Icon name="arrow" size={16} />
                </a>
              </div>
            )}
          </div>
        </div>
        {similar.length > 0 && (
          <section className="pp-similar">
            <SectionHead kicker={cat[lang]} kickerIcon={cat.icon} title={t('similar')} />
            <div className="prod-grid">{similar.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
          </section>
        )}
        <section className="pp-reviews" ref={reviewsRef}><ReviewSystem product={product} initialReviews={initialReviews} /></section>
      </div>
      {ficheOpen && <FicheModal product={product} brand={brand} onClose={() => setFicheOpen(false)} />}
    </main>
  );
}
