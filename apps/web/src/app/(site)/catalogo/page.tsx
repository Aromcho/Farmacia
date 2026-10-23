import type { Metadata } from 'next';
import { CatalogView, CategoryChips } from '@/components/catalog/catalog-view';
import { getCategories, getFacets, getProducts, productQueryString } from '@/lib/api';
import { queryFromSearchParams } from '@/lib/catalog-query';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Perfumes originales y decants, maquillaje, cuidado de la piel, suplementos, herboristería y más. Pedí por WhatsApp con envío sin cargo en Villa Gesell.',
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const query = queryFromSearchParams(sp);
  const [products, facets, categories] = await Promise.all([getProducts(query), getFacets(), getCategories()]);
  const title = query.q ? `Resultados para “${query.q}”` : query.decant ? 'Perfumes en decant' : query.isNew ? 'Nuevos ingresos' : query.promo ? 'Promociones' : 'Catálogo';

  return (
    <div className="pt-[calc(var(--header-h)+env(safe-area-inset-top))] mb-tabbar">
      <div className="container-x pb-20 pt-8 lg:pt-12">
        <header className="mb-6 lg:mb-10">
          <h1 className="display-2 text-ink">{title}</h1>
          <p className="tabular mt-2 text-ink-soft">
            {products.total} {products.total === 1 ? 'producto' : 'productos'}
            {!query.q && ' · precios de lista y en efectivo'}
          </p>
        </header>
        <CategoryChips categories={categories.filter((c) => !c.parentId && c.productCount > 0)} />
        <div className="mt-6">
          <CatalogView initial={products} facets={facets} apiQuery={productQueryString({ ...query, page: undefined })} />
        </div>
      </div>
    </div>
  );
}
