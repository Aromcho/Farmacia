'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Img } from '@/components/ui/img';
import { get } from '@/lib/client-api';
import { money } from '@/lib/format';
import type { Paginated, Product } from '@/lib/types';
import { useUI } from './ui-provider';

const SUGGESTIONS = ['Perfumes árabes', 'Decants', 'Lattafa', 'Maybelline', 'Medicube', 'Protector solar', 'Colágeno', 'Stanley', 'Vitamina'];

function useDebounced<T>(value: T, ms = 220) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function SearchOverlay({ categories }: { categories: { name: string; slug: string; productCount?: number }[] }) {
  const { searchOpen, closeSearch } = useUI();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const term = useDebounced(q.trim());

  const { data, isFetching } = useQuery({
    queryKey: ['search', term],
    queryFn: () => get<Paginated<Product>>(`/products?q=${encodeURIComponent(term)}&pageSize=8`),
    enabled: searchOpen && term.length > 1,
    placeholderData: (prev) => prev,
  });
  const results = term.length > 1 ? (data?.items ?? []) : [];

  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [searchOpen]);

  useEffect(() => setActive(0), [term]);

  const go = (href: string) => {
    closeSearch();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeSearch();
    if (!results.length) {
      if (e.key === 'Enter' && q.trim()) go(`/catalogo?q=${encodeURIComponent(q.trim())}`);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active < results.length) go(`/producto/${results[active].slug}`);
      else go(`/catalogo?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <button type="button" aria-label="Cerrar buscador" onClick={closeSearch} className="absolute inset-0 hidden bg-night/50 backdrop-blur-sm lg:block" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar productos"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
            className="relative flex h-full flex-col bg-white lg:mx-auto lg:mt-[12vh] lg:h-auto lg:max-h-[72vh] lg:max-w-2xl lg:overflow-hidden lg:rounded-3xl lg:shadow-lift"
            onKeyDown={onKey}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] lg:px-5 lg:pt-4">
              <Search className="size-5 shrink-0 text-teal-strong" aria-hidden="true" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscá perfumes, marcas, notas…"
                className="h-11 min-w-0 flex-1 bg-transparent text-[1.05rem] text-ink outline-none placeholder:text-ink-soft/70"
                enterKeyHint="search"
                autoComplete="off"
                aria-label="Buscar"
              />
              {isFetching && <Loader2 className="size-4 animate-spin text-ink-soft" aria-hidden="true" />}
              {q && (
                <button type="button" onClick={() => setQ('')} className="grid size-8 place-items-center rounded-full bg-foam text-ink-soft" aria-label="Borrar búsqueda">
                  <X className="size-4" />
                </button>
              )}
              <button type="button" onClick={closeSearch} className="text-sm font-semibold text-teal-strong lg:hidden">
                Cancelar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 lg:px-5">
              {term.length < 2 && (
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-semibold text-ink-soft">Lo más buscado</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setQ(s)}
                          className="rounded-full bg-foam px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-line"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-sm font-semibold text-ink-soft">Categorías</h3>
                    <ul className="mt-2 divide-y divide-line">
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <button type="button" onClick={() => go(`/catalogo/${c.slug}`)} className="flex w-full items-center justify-between py-3.5 text-left text-[1.02rem] text-ink">
                            {c.name}
                            <span className="text-sm text-ink-soft tabular">{c.productCount ?? ''}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}

              {term.length > 1 && (
                <div>
                  {results.length === 0 && !isFetching && (
                    <div className="py-10 text-center">
                      <p className="font-serif text-2xl text-ink">Sin resultados para “{term}”</p>
                      <p className="mx-auto mt-2 max-w-sm text-ink-soft">Probá con la marca o una nota (vainilla, cítrico…). Si no lo encontrás, escribinos y te lo conseguimos.</p>
                    </div>
                  )}
                  <ul className="space-y-1">
                    {results.map((p, i) => (
                      <li key={p.id}>
                        <Link
                          href={`/producto/${p.slug}`}
                          onClick={closeSearch}
                          onMouseEnter={() => setActive(i)}
                          className={`flex items-center gap-3.5 rounded-2xl p-2 transition-colors ${active === i ? 'bg-foam' : ''}`}
                        >
                          <Img media={p.images[0]?.media} sizes="64px" className="size-16 shrink-0 rounded-xl" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-teal-strong">{p.brand?.name ?? p.category.name}</span>
                            <span className="block truncate font-serif text-[1.05rem] text-ink">{p.name}</span>
                            <span className="block text-sm text-ink-soft">{p.presentation}</span>
                          </span>
                          {p.showPrice && (p.cashPrice ?? p.price) ? (
                            <span className="tabular text-right text-sm font-semibold text-ink">{money(p.cashPrice ?? p.price)}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={() => go(`/catalogo?q=${encodeURIComponent(term)}`)}
                      className={`mt-3 flex w-full items-center justify-between rounded-2xl px-3 py-3.5 text-[0.95rem] font-semibold text-teal-strong ${active === results.length ? 'bg-foam' : ''}`}
                    >
                      Ver todos los resultados de “{term}”
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
