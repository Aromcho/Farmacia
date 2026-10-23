import { Benefits } from '@/components/home/benefits';
import { CategoryGrid } from '@/components/home/category-grid';
import { DecantsFeature } from '@/components/home/decants-feature';
import { Hero } from '@/components/home/hero';
import { InstagramGrid } from '@/components/home/instagram-grid';
import { InsurersTeaser } from '@/components/home/insurers-teaser';
import { PerfumeShowcase } from '@/components/home/perfume-showcase';
import { VisitSection } from '@/components/home/visit-section';
import { ProductRail } from '@/components/catalog/product-rail';
import { SectionHeading } from '@/components/ui/section-heading';
import { getCategories, getHighlights, getInstagram, getInsurers, getProducts, getStore } from '@/lib/api';

export default async function HomePage() {
  const [store, highlights, categories, ella, el, arabes, decants, nuevos, insurers, posts] = await Promise.all([
    getStore(),
    getHighlights(),
    getCategories(),
    getProducts({ category: 'perfumeria', gender: 'FEMENINO', pageSize: 10 }),
    getProducts({ category: 'perfumeria', gender: 'MASCULINO', pageSize: 10 }),
    getProducts({ category: 'perfumeria', tag: 'arabe', pageSize: 10 }),
    getProducts({ decant: true, pageSize: 10 }),
    getProducts({ isNew: true, sort: 'new', pageSize: 12 }),
    getInsurers(),
    getInstagram(12),
  ]);

  return (
    <>
      <Hero highlights={highlights} video={{ src: '/media/hero.mp4', poster: '/media/hero-poster.webp' }} />
      <Benefits info={store?.info ?? null} />
      <PerfumeShowcase
        tabs={[
          { key: 'ella', label: 'Para ella', href: '/catalogo/perfumeria?gender=FEMENINO', products: ella.items },
          { key: 'el', label: 'Para él', href: '/catalogo/perfumeria?gender=MASCULINO', products: el.items },
          { key: 'arabes', label: 'Árabes', href: '/catalogo/perfumeria?tag=arabe', products: arabes.items },
          { key: 'decants', label: 'En decant', href: '/catalogo?decant=true', products: decants.items },
        ]}
      />
      <DecantsFeature />
      <CategoryGrid categories={categories} />
      {nuevos.items.length > 0 && (
        <section className="py-16 lg:py-24" aria-labelledby="nuevos-title">
          <div className="container-x">
            <SectionHeading id="nuevos-title" title="Nuevos ingresos" text="Lo último que llegó a la farmacia: skincare coreano, fragancias y más." />
            <ProductRail products={nuevos.items} moreHref="/catalogo?isNew=true" moreLabel="Ver todos los nuevos" className="mt-8" />
          </div>
        </section>
      )}
      <InsurersTeaser insurers={insurers} />
      <VisitSection />
      <InstagramGrid posts={posts} url={store?.info?.instagramUrl} />
    </>
  );
}
