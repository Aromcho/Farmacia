'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, EmptyState, LoadingBlock, PageHeader, SegmentedTabs, Select } from '@/components/admin/ui';
import { Img } from '@/components/ui/img';
import { useAdminMutation, useAdminQuery } from '@/lib/admin';
import { cn } from '@/lib/cn';
import { money } from '@/lib/format';
import type { Category, Paginated, Product } from '@/lib/types';

type Status = 'all' | 'active' | 'inactive';

export default function ProductsAdminPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams({ page: String(page), pageSize: '30', status, ...(debounced ? { q: debounced } : {}), ...(category ? { category } : {}) });
  const list = useAdminQuery<Paginated<Product>>(['admin-products', params.toString()], `/admin/products?${params}`);
  const cats = useAdminQuery<Category[]>(['admin-categories'], '/admin/categories');
  const bulk = useAdminMutation<{ action: string }>({
    method: 'POST',
    path: '/admin/products/bulk',
    body: (v) => ({ ids: selected, action: v.action }),
    invalidate: [['admin-products'], ['stats']],
    publicTags: ['catalog'],
    success: (r) => `${(r as { count: number }).count} productos actualizados`,
    onSuccess: () => setSelected([]),
  });

  const items = list.data?.items ?? [];
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <PageHeader
        title="Productos"
        text="Todo el catálogo. Tocá un producto para editar precio, fotos, notas y visibilidad."
        actions={
          <Link href="/admin/productos/nuevo" className="inline-flex h-11 items-center gap-2 rounded-full bg-teal-strong px-5 font-semibold text-white">
            <Plus className="size-4" /> Nuevo producto
          </Link>
        }
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, marca o nota" className="h-11 w-full rounded-xl bg-white pl-10 pr-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-teal-strong" />
        </label>
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="lg:w-60">
          <option value="">Todas las categorías</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name} ({c.productCount})
            </option>
          ))}
        </Select>
        <SegmentedTabs<Status> value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Visibles' }, { value: 'inactive', label: 'Ocultos' }]} />
      </div>

      <div className="mt-5">
        {list.isLoading ? (
          <LoadingBlock />
        ) : !items.length ? (
          <EmptyState title="No hay productos con esos filtros" />
        ) : (
          <ul className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-line">
            {items.map((p) => {
              const on = selected.includes(p.id);
              return (
                <li key={p.id} className={cn('flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 sm:px-4', on && 'bg-foam')}>
                  <button type="button" onClick={() => toggle(p.id)} className={cn('grid size-5 shrink-0 place-items-center rounded-md border transition', on ? 'border-teal-strong bg-teal-strong text-white' : 'border-line')} aria-label="Seleccionar">
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </button>
                  <Img media={p.images[0]?.media} ratio="4/5" sizes="48px" className="w-12 shrink-0 rounded-lg" />
                  <Link href={`/admin/productos/${p.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-teal-strong">{p.brand?.name ?? p.category.name}</span>
                    <span className="block truncate font-medium text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-ink-soft sm:hidden">{p.category.name}</span>
                  </Link>
                  <span className="hidden w-40 shrink-0 text-sm text-ink-soft md:block">{p.category.name}</span>
                  <span className="hidden shrink-0 gap-1 lg:flex">
                    {!p.active && <Badge tone="red">Oculto</Badge>}
                    {p.featured && <Badge tone="teal">Destacado</Badge>}
                    {p.isNew && <Badge tone="sun">Nuevo</Badge>}
                    {p.hasDecant && <Badge>Decant</Badge>}
                  </span>
                  <span className="tabular w-24 shrink-0 text-right text-sm font-semibold text-ink">{p.showPrice && (p.cashPrice ?? p.price) ? money(p.cashPrice ?? p.price) : <span className="font-normal text-ink-soft">Consultar</span>}</span>
                </li>
              );
            })}
          </ul>
        )}
        {list.data && list.data.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-line disabled:opacity-40" aria-label="Anterior"><ChevronLeft className="size-4" /></button>
            <span className="tabular text-sm text-ink-soft">Página {page} de {list.data.pages} · {list.data.total} productos</span>
            <button type="button" disabled={page >= list.data.pages} onClick={() => setPage(page + 1)} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-line disabled:opacity-40" aria-label="Siguiente"><ChevronRight className="size-4" /></button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-[1.5rem] bg-ink p-2 pl-5 text-white shadow-lift lg:left-[calc(16rem+1.5rem)]">
            <span className="tabular mr-auto text-sm font-semibold">{selected.length} seleccionados</span>
            {[
              ['activate', 'Mostrar'],
              ['deactivate', 'Ocultar'],
              ['feature', 'Destacar'],
              ['unfeature', 'Quitar destacado'],
            ].map(([a, l]) => (
              <button key={a} type="button" onClick={() => bulk.mutate({ action: a })} className="h-9 rounded-full bg-white/10 px-3.5 text-sm font-semibold hover:bg-white/20">
                {l}
              </button>
            ))}
            <button type="button" onClick={() => setSelected([])} className="h-9 rounded-full px-3 text-sm text-white/70">
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
