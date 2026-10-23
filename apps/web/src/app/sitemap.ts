import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/api';
import { SITE_URL } from '@/lib/media';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts({ pageSize: 100 })]);
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/catalogo`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/farmacia`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/obras-sociales`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...categories.map((c) => ({ url: `${SITE_URL}/catalogo/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.items.map((p) => ({ url: `${SITE_URL}/producto/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: 'weekly' as const, priority: 0.6 })),
  ];
}
