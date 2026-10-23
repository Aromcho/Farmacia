/**
 * Lectura de datos desde componentes de servidor.
 * Pega directo a la API (NestJS) con caché de datos de Next y revalidación por tiempo.
 */
import type {
  Banner,
  Category,
  Facets,
  Highlight,
  InstagramPost,
  Insurer,
  Paginated,
  Product,
  ProductDetail,
  PublicStore,
} from './types';

const API_URL = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface GetOptions {
  revalidate?: number;
  tags?: string[];
}

export async function apiGet<T>(path: string, { revalidate = 60, tags }: GetOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    next: { revalidate, tags },
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new ApiError(res.status, `API ${res.status} en ${path}`);
  return (await res.json()) as T;
}

/** Igual que apiGet pero devuelve un valor por defecto si la API no responde (el sitio nunca se cae) */
export async function apiSafe<T>(path: string, fallback: T, opts?: GetOptions): Promise<T> {
  try {
    return await apiGet<T>(path, opts);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[api]', (err as Error).message);
    return fallback;
  }
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '' && v !== false) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
};

const emptyPage = <T,>(): Paginated<T> => ({ items: [], total: 0, page: 1, pageSize: 24, pages: 1 });

export const getStore = () =>
  apiSafe<PublicStore | null>('/store', null, { revalidate: 30, tags: ['store'] });

export const getCategories = () => apiSafe<Category[]>('/categories', [], { revalidate: 300, tags: ['catalog'] });

export const getHighlights = () => apiSafe<Highlight[]>('/highlights', [], { revalidate: 120, tags: ['content'] });

export const getBanners = (placement?: string) =>
  apiSafe<Banner[]>(`/banners${qs({ placement })}`, [], { revalidate: 120, tags: ['content'] });

export const getInsurers = () => apiSafe<Insurer[]>('/insurers', [], { revalidate: 600, tags: ['content'] });

export const getInstagram = (limit = 12) =>
  apiSafe<InstagramPost[]>(`/instagram${qs({ limit })}`, [], { revalidate: 600, tags: ['content'] });

export const getFacets = () =>
  apiSafe<Facets>('/products/facets', { brands: [], categories: [], tags: [] }, { revalidate: 300, tags: ['catalog'] });

export type ProductQuery = {
  q?: string;
  category?: string;
  brand?: string;
  tag?: string;
  gender?: string;
  featured?: boolean;
  isNew?: boolean;
  decant?: boolean;
  promo?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function productQueryString(q: ProductQuery) {
  return qs({
    q: q.q,
    category: q.category,
    brand: q.brand,
    tag: q.tag,
    gender: q.gender,
    featured: q.featured ? 'true' : undefined,
    isNew: q.isNew ? 'true' : undefined,
    decant: q.decant ? 'true' : undefined,
    promo: q.promo ? 'true' : undefined,
    sort: q.sort,
    page: q.page,
    pageSize: q.pageSize,
  });
}

export const getProducts = (q: ProductQuery = {}) =>
  apiSafe<Paginated<Product>>(`/products${productQueryString(q)}`, emptyPage<Product>(), { revalidate: 60, tags: ['catalog'] });

/** Devuelve null si no existe (para notFound()) */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { revalidate: 60, tags: ['catalog'] });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getCategory(slug: string): Promise<Category | null> {
  try {
    return await apiGet<Category>(`/categories/${encodeURIComponent(slug)}`, { revalidate: 300, tags: ['catalog'] });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
