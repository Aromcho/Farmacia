import type { ProductQuery } from './api';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Convierte los parámetros de la URL del catálogo en la consulta a la API */
export function queryFromSearchParams(sp: SP, category?: string): ProductQuery {
  return {
    q: one(sp.q)?.slice(0, 80),
    category,
    brand: one(sp.brand),
    tag: one(sp.tag),
    gender: one(sp.gender),
    decant: one(sp.decant) === 'true',
    promo: one(sp.promo) === 'true',
    isNew: one(sp.isNew) === 'true',
    sort: one(sp.sort),
    pageSize: 24,
  };
}
