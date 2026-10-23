import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogView, CategoryChips } from '@/components/catalog/catalog-view';
import { Img } from '@/components/ui/img';
import { getCategories, getCategory, getFacets, getProducts, productQueryString } from '@/lib/api';
import { queryFromSearchParams } from '@/lib/catalog-query';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Categoría no encontrada' };
  return { title: category.name, description: category.description ?? category.tagline ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();
  const query = queryFromSearchParams(sp, slug);
  const [products, facets, categories] = await Promise.all([getProducts(query), getFacets(), getCategories()]);

  return (
    <div className="mb-tabbar">
      <header className="relative isolate overflow-hidden bg-night pb-10 pt-[calc(var(--header-h)+env(safe-area-inset-top)+2.5rem)] text-white lg:pb-16 lg:pt-[calc(var(--header-h)+4rem)]">
        <Img media={category.cover} alt="" sizes="100vw" priority className="absolute! inset-0 -z-20 opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/70 to-night/30" />
        <div className="container-x">
          <h1 className="display-1">{category.name}</h1>
          {category.description && <p className="mt-4 max-w-[54ch] text-[1.05rem] leading-relaxed text-white/75">{category.description}</p>}
        </div>
      </header>
      <div className="container-x pb-20 pt-6">
        <CategoryChips categories={categories.filter((c) => !c.parentId && c.productCount > 0)} active={slug} />
        <div className="mt-6">
          <CatalogView initial={products} facets={facets} categorySlug={slug} apiQuery={productQueryString({ ...query, page: undefined })} />
        </div>
      </div>
    </div>
  );
}
