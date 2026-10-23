import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/site/providers';
import { getStore } from '@/lib/api';
import { SITE_URL } from '@/lib/media';
import { figtree, youngSerif } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Farmacia Amancio Fernández · Villa Gesell',
    template: '%s · Farmacia Amancio Fernández',
  },
  description:
    'Farmacia, perfumería y herboristería en 106 y Boulevard, Villa Gesell. Más de 60 años cuidándote. Perfumes originales y decants, maquillaje, dermocosmética, obras sociales y pedidos por WhatsApp con envío sin cargo.',
  applicationName: 'Farmacia Amancio Fernández',
  keywords: ['farmacia Villa Gesell', 'perfumería Villa Gesell', 'perfumes árabes', 'decants', 'farmacia de turno', 'obras sociales', 'Amancio Fernández'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Farmacia Amancio Fernández',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [{ color: '#052a2e' }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  return (
    <html lang="es-AR" className={`${figtree.variable} ${youngSerif.variable}`} suppressHydrationWarning>
      <body>
        <Providers store={store}>{children}</Providers>
      </body>
    </html>
  );
}
