'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useCart } from '@/components/cart/cart-provider';
import { Img } from '@/components/ui/img';
import { DropIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { money, savingPct } from '@/lib/format';
import type { Product } from '@/lib/types';

export function notesLine(p: Product): string {
  const parts = [p.notesTop[0], p.notesHeart[0], p.notesBase[0]].filter(Boolean);
  return parts.join(' · ');
}

export function ProductCard({ product: p, priority, className, sizes }: { product: Product; priority?: boolean; className?: string; sizes?: string }) {
  const { add } = useCart();
  const img = p.images[0]?.media;
  const alt = p.images[1]?.media;
  const cash = p.cashPrice ?? p.price;
  const off = savingPct(p.price, p.cashPrice);
  const notes = notesLine(p);

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative">
      <Link href={`/producto/${p.slug}`} className="relative block overflow-hidden rounded-[1.4rem] bg-foam" aria-label={`${p.brand?.name ?? ''} ${p.name}`.trim()}>
        <Img
          media={img}
          alt={`${p.brand?.name ?? ''} ${p.name}`.trim()}
          ratio="4/5"
          sizes={sizes ?? '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw'}
          priority={priority}
          imgClassName="transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]"
        />
        {alt && (
          <Img
            media={alt}
            alt=""
            sizes={sizes ?? '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw'}
            className="pointer-events-none absolute! inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <span className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {p.isNew && <span className="rounded-full bg-white/95 px-2.5 py-1 text-[0.7rem] font-bold text-teal-strong shadow-sm">Nuevo</span>}
          {p.hasDecant && (
            <span className="inline-flex items-center gap-1 rounded-full bg-night/85 px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur">
              <DropIcon className="size-3" /> Decant
            </span>
          )}
          {!p.available && <span className="rounded-full bg-white/95 px-2.5 py-1 text-[0.7rem] font-semibold text-ink-soft">Consultar stock</span>}
        </span>
      </Link>
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => add(p)}
        className="absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-full bg-white text-teal-strong shadow-float ring-1 ring-line transition-colors hover:bg-teal-strong hover:text-white"
        aria-label={`Agregar ${p.name} al pedido`}
      >
        <Plus className="size-5" strokeWidth={2.4} />
      </motion.button>
      </div>

      <div className="mt-3 flex flex-1 flex-col px-0.5">
        {p.brand && (
          <Link href={`/catalogo?brand=${p.brand.slug}`} className="text-[0.78rem] font-semibold text-teal-strong hover:underline">
            {p.brand.name}
          </Link>
        )}
        <Link href={`/producto/${p.slug}`} className="mt-0.5">
          <h3 className="line-clamp-2 font-serif text-[1.06rem] leading-snug text-ink">{p.name}</h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-[0.82rem] text-ink-soft">{notes || p.presentation || p.category.name}</p>
        <div className="mt-auto pt-2.5">
          {p.showPrice && cash ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="tabular text-[1.05rem] font-bold text-ink">{money(cash)}</span>
              {p.cashPrice && p.price && p.cashPrice < p.price ? (
                <span className="text-[0.75rem] font-medium text-ink-soft">
                  efectivo <span className="text-teal-strong">−{off}%</span>
                </span>
              ) : null}
              {p.compareAtPrice && p.price && p.compareAtPrice > p.price ? (
                <span className="tabular text-[0.78rem] text-ink-soft line-through">{money(p.compareAtPrice)}</span>
              ) : null}
            </div>
          ) : (
            <span className="text-[0.88rem] font-semibold text-ink-soft">Consultá el precio</span>
          )}
        </div>
      </div>
    </article>
  );
}
