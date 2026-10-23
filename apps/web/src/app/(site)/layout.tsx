import { SearchOverlay } from '@/components/site/search-overlay';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader, type NavLink } from '@/components/site/site-header';
import { TabBar } from '@/components/site/tab-bar';
import { getCategories, getStore } from '@/lib/api';
import { SITE_URL } from '@/lib/media';

// El estado "abierto/cerrado" y el catálogo cambian: se renderiza por pedido con datos cacheados
export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [store, categories] = await Promise.all([getStore(), getCategories()]);
  const top = categories.filter((c) => !c.parentId);
  const nav: NavLink[] = [
    ...top.slice(0, 5).map((c) => ({ href: `/catalogo/${c.slug}`, label: c.name })),
    { href: '/obras-sociales', label: 'Obras sociales' },
    { href: '/farmacia', label: 'La farmacia' },
  ];

  const info = store?.info;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const jsonLd = info
    ? {
        '@context': 'https://schema.org',
        '@type': 'Pharmacy',
        name: info.name,
        description: info.tagline,
        url: SITE_URL,
        telephone: info.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: info.address,
          addressLocality: info.city,
          addressRegion: info.province,
          addressCountry: 'AR',
        },
        ...(info.lat && info.lng ? { geo: { '@type': 'GeoCoordinates', latitude: info.lat, longitude: info.lng } } : {}),
        sameAs: [info.instagramUrl],
        openingHoursSpecification: (store?.hours.weeks[store.hours.season] ?? []).flatMap((d) =>
          d.ranges.map((r) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: days[d.weekday], opens: r.opens, closes: r.closes })),
        ),
      }
    : null;

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">
        Saltar al contenido
      </a>
      <SiteHeader nav={nav} />
      <main id="contenido">{children}</main>
      <SiteFooter store={store} categories={top} />
      <TabBar />
      <SearchOverlay categories={top} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </>
  );
}
