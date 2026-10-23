import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductRail } from '@/components/catalog/product-rail';
import { ProductDetail } from '@/components/product/product-detail';
import { SectionHeading } from '@/components/ui/section-heading';
import { getProduct } from '@/lib/api';
import { absoluteMediaUrl, SITE_URL } from '@/lib/media';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Producto no encontrado' };
  const title = [p.brand?.name, p.name].filter(Boolean).join(' ');
  const img = p.images[0]?.media;
  return {
    title,
    description: p.shortDescription ?? p.description ?? undefined,
    openGraph: { title, description: p.shortDescription ?? undefined, images: img ? [{ url: absoluteMediaUrl(img.variants?.lg ?? img.path) }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const price = p.cashPrice ?? p.price;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: [p.brand?.name, p.name].filter(Boolean).join(' '),
    description: p.description ?? p.shortDescription ?? undefined,
    image: p.images.map((i) => absoluteMediaUrl(i.media.variants?.lg ?? i.media.path)),
    brand: p.brand ? { '@type': 'Brand', name: p.brand.name } : undefined,
    category: p.category.name,
    url: `${SITE_URL}/producto/${p.slug}`,
    ...(p.showPrice && price
      ? { offers: { '@type': 'Offer', priceCurrency: 'ARS', price, availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability' } }
      : {}),
  };

  return (
    <div className="pb-24 pt-[calc(var(--header-h)+env(safe-area-inset-top))] lg:pb-0">
      <div className="lg:container-x lg:pt-10">
        <ProductDetail product={p} />
      </div>
      {p.related.length > 0 && (
        <section className="mt-20 border-t border-line py-16 lg:py-20" aria-labelledby="rel-title">
          <div className="container-x">
            <SectionHeading id="rel-title" title="También te puede gustar" />
            <ProductRail products={p.related} className="mt-8" />
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
