import Link from 'next/link';

// Themed, centered result card for the confirm / unsubscribe landing pages.
// Uses the site's design tokens (loaded globally via app/globals.css).
export default function NewsletterResult({ icon = '✓', tone = 'ok', title, message, ctaHref = '/', ctaLabel = 'Retour au site', dir = 'ltr' }) {
  const color = tone === 'error' ? '#e5484d' : tone === 'accent' ? 'var(--accent)' : '#1f9d55';
  return (
    <main dir={dir} style={{ minHeight: '72vh', display: 'grid', placeItems: 'center', padding: '48px 18px' }}>
      <div style={{
        maxWidth: 460, width: '100%', background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--sh-2)', padding: '36px 28px', textAlign: 'center',
      }}>
        <div style={{
          width: 62, height: 62, borderRadius: '50%', margin: '0 auto 18px', display: 'grid', placeItems: 'center',
          background: `color-mix(in oklab, ${color} 14%, transparent)`, color, fontSize: 30, fontWeight: 800, lineHeight: 1,
        }}>{icon}</div>
        <h1 style={{ fontSize: 22, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h1>
        <p style={{ color: 'var(--ink-2)', margin: '0 0 22px', lineHeight: 1.6, fontSize: 15 }}>{message}</p>
        <Link href={ctaHref} className="btn btn-primary btn-md" style={{ textDecoration: 'none' }}>{ctaLabel}</Link>
      </div>
    </main>
  );
}
