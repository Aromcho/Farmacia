'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Drawer } from 'vaul';
import { get } from '@/lib/client-api';
import { cn } from '@/lib/cn';
import { GENDER_LABEL, plural } from '@/lib/format';
import type { Facets, Gender, Paginated, Product } from '@/lib/types';
import { ProductCard } from './product-card';

const SORTS = [
  { value: '', label: 'Destacados' },
  { value: 'new', label: 'Más nuevos' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'name', label: 'A–Z' },
];

const TOGGLES = [
  { key: 'decant', label: 'Disponible en decant' },
  { key: 'promo', label: 'En promoción' },
  { key: 'isNew', label: 'Nuevos ingresos' },
] as const;

interface Props {
  initial: Paginated<Product>;
  facets: Facets;
  categorySlug?: string;
  apiQuery: string;
}

export function CatalogView({ initial, facets, categorySlug, apiQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // al cambiar los filtros, el servidor trae una nueva primera página
  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
  }, [initial]);

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (value === null || value === '') sp.delete(key);
    else sp.set(key, value);
    sp.delete('page');
    startTransition(() => router.replace(`${pathname}${sp.toString() ? `?${sp}` : ''}`, { scroll: false }));
  };

  const clearAll = () => startTransition(() => router.replace(pathname, { scroll: false }));

  const activeCount = useMemo(
    () => ['brand', 'gender', 'tag', 'decant', 'promo', 'isNew', 'q'].filter((k) => params.get(k)).length,
    [params],
  );

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const sp = new URLSearchParams(apiQuery.replace(/^\?/, ''));
      sp.set('page', String(page + 1));
      const next = await get<Paginated<Product>>(`/products?${sp}`);
      setItems((prev) => [...prev, ...next.items.filter((n) => !prev.some((p) => p.id === n.id))]);
      setPage(next.page);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = items.length < initial.total;
  const sort = params.get('sort') ?? '';

  const filters = (
    <div className="space-y-8">
      <FilterGroup title="Para quién">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
            <Chip key={g} active={params.get('gender') === g} onClick={() => setParam('gender', params.get('gender') === g ? null : g)}>
              {GENDER_LABEL[g]}
            </Chip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Mostrar">
        <div className="space-y-1">
          {TOGGLES.map((t) => {
            const on = params.get(t.key) === 'true';
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setParam(t.key, on ? null : 'true')}
                className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-[0.95rem] text-ink"
                aria-pressed={on}
              >
                {t.label}
                <span className={cn('grid size-5 place-items-center rounded-md border transition-colors', on ? 'border-teal-strong bg-teal-strong text-white' : 'border-line bg-white')}>
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </FilterGroup>
      {facets.brands.length > 0 && (
        <FilterGroup title="Marca">
          <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-1" data-lenis-prevent>
            {facets.brands.map((b) => {
              const on = params.get('brand') === b.slug;
              return (
                <li key={b.slug}>
                  <button
                    type="button"
                    onClick={() => setParam('brand', on ? null : b.slug)}
                    className={cn('flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[0.92rem] transition-colors', on ? 'bg-foam font-semibold text-teal-strong' : 'text-ink hover:bg-mist')}
                  >
                    {b.name}
                    <span className="tabular text-xs text-ink-soft">{b.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-h)+1.5rem)]">
          {filters}
          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="mt-8 text-sm font-semibold text-teal-strong">
              Limpiar filtros
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        {/* barra de herramientas */}
        <div className="sticky top-(--header-offset,var(--header-h)) z-20 transition-[top] duration-300 -mx-5 flex items-center gap-2 border-b border-line/70 bg-white/90 px-5 py-3 backdrop-blur-lg md:-mx-8 md:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:backdrop-blur-none">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filtros
            {activeCount > 0 && <span className="tabular grid size-5 place-items-center rounded-full bg-teal-strong text-[0.7rem] text-white">{activeCount}</span>}
          </button>
          <p className="tabular hidden text-sm text-ink-soft lg:block">{plural(initial.total, 'producto', 'productos')}</p>
          {pending && <Loader2 className="size-4 animate-spin text-ink-soft" aria-label="Cargando" />}
          <label className="relative ml-auto inline-flex h-10 items-center rounded-full bg-white pl-4 pr-9 text-sm font-semibold text-ink ring-1 ring-line">
            <span className="sr-only">Ordenar por</span>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value || null)} className="appearance-none bg-transparent pr-1 outline-none">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-4 text-ink-soft" aria-hidden="true" />
          </label>
        </div>

        {/* filtros activos */}
        {activeCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {params.get('q') && <ActiveChip onClear={() => setParam('q', null)}>“{params.get('q')}”</ActiveChip>}
            {params.get('gender') && <ActiveChip onClear={() => setParam('gender', null)}>{GENDER_LABEL[params.get('gender') as Gender]}</ActiveChip>}
            {params.get('brand') && <ActiveChip onClear={() => setParam('brand', null)}>{facets.brands.find((b) => b.slug === params.get('brand'))?.name ?? params.get('brand')}</ActiveChip>}
            {params.get('tag') && <ActiveChip onClear={() => setParam('tag', null)}>{tagLabel(params.get('tag')!)}</ActiveChip>}
            {TOGGLES.filter((t) => params.get(t.key)).map((t) => (
              <ActiveChip key={t.key} onClear={() => setParam(t.key, null)}>
                {t.label}
              </ActiveChip>
            ))}
          </div>
        )}

        <motion.ul layout className={cn('mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 xl:grid-cols-4 lg:gap-x-6', pending && 'opacity-60 transition-opacity')}>
          <AnimatePresence initial={false}>
            {items.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: Math.min(i % 24, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProductCard product={p} priority={i < 4} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {items.length === 0 && (
          <div className="mx-auto max-w-md py-20 text-center">
            <p className="display-3 text-ink">No encontramos productos con esos filtros</p>
            <p className="mt-3 text-ink-soft">Probá sacando algún filtro. Si buscás algo puntual, escribinos: muchas veces lo tenemos en la farmacia aunque no esté publicado.</p>
            <button type="button" onClick={clearAll} className="mt-6 font-semibold text-teal-strong">
              Ver todo el catálogo
            </button>
          </div>
        )}

        {hasMore && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="tabular text-sm text-ink-soft">
              Viendo {items.length} de {initial.total}
            </p>
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:bg-night-3 disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="size-4 animate-spin" />}
              Ver más productos
            </button>
          </div>
        )}
      </div>

      {/* filtros en móvil: hoja inferior */}
      <Drawer.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-night/40 backdrop-blur-[2px]" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[88dvh] flex-col rounded-t-[1.75rem] bg-white outline-none" data-lenis-prevent>
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line" />
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <Drawer.Title className="font-serif text-2xl text-ink">Filtros</Drawer.Title>
              {activeCount > 0 && (
                <button type="button" onClick={clearAll} className="text-sm font-semibold text-teal-strong">
                  Limpiar
                </button>
              )}
            </div>
            <Drawer.Description className="sr-only">Filtrá el catálogo por marca, tipo y promociones</Drawer.Description>
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">{filters}</div>
            <div className="border-t border-line p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              <button type="button" onClick={() => setFiltersOpen(false)} className="h-12 w-full rounded-full bg-teal-strong font-semibold text-white">
                Ver {plural(initial.total, 'producto', 'productos')}
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('rounded-full px-3.5 py-2 text-sm font-semibold transition-colors', active ? 'bg-ink text-white' : 'bg-foam text-ink-soft hover:text-ink')}
    >
      {children}
    </button>
  );
}

function ActiveChip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 rounded-full bg-foam py-1.5 pl-3 pr-2 text-sm font-semibold text-ink">
      {children}
      <X className="size-3.5 text-ink-soft" aria-label="Quitar filtro" />
    </button>
  );
}

const TAGS: Record<string, string> = { arabe: 'Árabes', disenador: 'De diseñador', nacional: 'Nacionales', infantil: 'Infantiles', 'body-mist': 'Body mist', coreano: 'Skincare coreano' };
export const tagLabel = (t: string) => TAGS[t] ?? t.replace(/-/g, ' ');

/** Chips de categorías arriba del catálogo */
export function CategoryChips({ categories, active }: { categories: { name: string; slug: string }[]; active?: string }) {
  return (
    <nav aria-label="Categorías" className="scroll-x -mx-5 gap-2 px-5 md:-mx-8 md:px-8">
      <Link href="/catalogo" className={cn('shrink-0 rounded-full px-4 py-2.5 text-[0.92rem] font-semibold transition-colors', !active ? 'bg-ink text-white' : 'bg-foam text-ink-soft hover:text-ink')}>
        Todo
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/catalogo/${c.slug}`}
          className={cn('shrink-0 rounded-full px-4 py-2.5 text-[0.92rem] font-semibold transition-colors', active === c.slug ? 'bg-ink text-white' : 'bg-foam text-ink-soft hover:text-ink')}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
