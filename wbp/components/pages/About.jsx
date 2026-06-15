'use client';
import React from 'react';
import { useApp } from '@/components/ctx';
import { Reveal, Kicker, Icon, SectionHead, ProductImage, useCountUp } from '@/components/primitives';
import { CTABand } from '@/components/pages/Home';

function AboutStat({ n, suf, label }) {
  const [ref, v] = useCountUp(n, 1500);
  return <div className="about-stat" ref={ref}><span className="about-stat-n">{Math.round(v)}{suf}</span><span className="about-stat-l">{label}</span></div>;
}

export default function About() {
  const { t, nav, wbp } = useApp();
  const stats = [
    [wbp.brands.length, '+', t('stat_brands')], [18, '+', t('stat_clients')],
    [7, '', t('stat_years')], [wbp.products.length, '+', t('stat_products')],
  ];
  const values = [['shield', t('val1'), t('val1d')], ['box', t('val2'), t('val2d')], ['headset', t('val3'), t('val3d')]];
  const collage = ['p17', 'p01', 'p07', 'p23'].map((id) => wbp.productById(id)).filter(Boolean);
  return (
    <main className="page-about">
      <section className="about-hero">
        <div className="hero-aura" />
        <div className="wrap">
          <Reveal><Kicker icon="badge">{t('about_kicker')}</Kicker></Reveal>
          <Reveal as="h1" className="about-h1" delay={90}>{t('about_title')}</Reveal>
          <Reveal as="p" className="about-lead" delay={160}>{t('about_lead')}</Reveal>
        </div>
      </section>
      <section className="wrap about-stats-wrap">
        <div className="about-stats">{stats.map(([n, suf, l], i) => <AboutStat key={i} n={n} suf={suf} label={l} />)}</div>
      </section>
      <section className="wrap about-story">
        <Reveal className="about-story-txt">
          <h2 className="sec-title">{t('mission_t')}</h2>
          <p>{t('about_p1')}</p><p>{t('about_p2')}</p>
          <div className="about-mission"><Icon name="bolt" size={20} /><span>{t('mission_d')}</span></div>
        </Reveal>
        <Reveal className="about-story-vis" delay={120}>
          <div className="about-collage">
            {collage.map((p, i) => (
              <div key={p.id} className={`about-tile at-${i}`} onClick={() => nav('product', { id: p.id })}><ProductImage product={p} /></div>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="sec sec-why">
        <div className="wrap">
          <SectionHead kicker={t('about_kicker')} kickerIcon="shield" title={t('values_t')} />
          <div className="why-grid why-grid-3">
            {values.map(([ic, ti, de], i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="why-card"><span className="why-ico"><Icon name={ic} size={24} /></span><h3>{ti}</h3><p>{de}</p><span className="why-num">0{i + 1}</span></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="sec sec-clients">
        <div className="wrap"><Reveal className="clients-head"><Kicker icon="badge">{t('sec_client_kicker')}</Kicker><h2 className="sec-title">{t('sectors_t')}</h2><p className="sec-sub">{t('clients_lead')}</p></Reveal></div>
        <div className="cmarquee"><div className="cmarquee-track">{[...wbp.clients, ...wbp.clients].map((c, i) => <span className="client-chip" key={i}>{c}</span>)}</div></div>
      </section>
      <CTABand />
    </main>
  );
}
