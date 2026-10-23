import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Farmacia Amancio Fernández',
    short_name: 'Amancio Fernández',
    description: 'Farmacia, perfumería y herboristería en Villa Gesell. Pedidos por WhatsApp.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#052a2e',
    lang: 'es-AR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
