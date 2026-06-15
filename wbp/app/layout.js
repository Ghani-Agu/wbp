import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wbp-dz.com'),
  title: {
    default: 'World Business Plus — Sécurité · Réseaux · Affichage',
    template: '%s — World Business Plus',
  },
  description:
    "World Business Plus (WBP) — Distributeur agréé en Algérie. Vidéosurveillance, alarme, contrôle d'accès, affichage MAXHUB, réseau & stockage. Prix sur devis.",
  icons: { icon: '/favicon.svg' },
};

export const viewport = { themeColor: '#FF5A1F' };

export default function RootLayout({ children }) {
  return (
    <html lang="fr" dir="ltr" data-theme="light" suppressHydrationWarning>
      <body data-cards="shadow" data-motion="on">{children}</body>
    </html>
  );
}
