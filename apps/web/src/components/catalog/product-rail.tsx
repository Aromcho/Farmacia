'use client';

import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

/** Carrusel horizontal con scroll-snap (deslizable en móvil, flechas en escritorio) */
export function ProductRail({ products, moreHref, moreLabel = 'Ver todos', className }: { products: Product[]; moreHref?: string; moreLabel?: string; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [products]);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <div className={cn('relative', className)}>
      <ul ref={ref} className="scroll-x -mx-5 gap-4 px-5 pb-2 md:-mx-8 md:px-8 lg:gap-6">
        {products.map((p, i) => (
          <li key={p.id} className="w-[46vw] max-w-[17rem] shrink-0 sm:w-[34vw] lg:w-[calc((100%-4.5rem)/4.4)]">
            <ProductCard product={p} priority={i < 2} sizes="(min-width: 1024px) 22vw, 46vw" />
          </li>
        ))}
        {moreHref && (
          <li className="w-[40vw] max-w-[14rem] shrink-0 sm:w-[28vw] lg:w-[calc((100%-4.5rem)/5)]">
            <Link
              href={moreHref}
              className="group flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-[1.4rem] bg-foam text-center text-teal-strong transition-colors hover:bg-line"
            >
              <span className="grid size-12 place-items-center rounded-full bg-white shadow-float transition-transform group-hover:scale-105">
                <ArrowRight className="size-5" aria-hidden="true" />
              </span>
              <span className="px-4 font-semibold">{moreLabel}</span>
            </Link>
          </li>
        )}
      </ul>
      <div className="pointer-events-none absolute -top-16 right-0 hidden gap-2 lg:flex">
        <button
          type="button"
          onClick={() => scroll(-1)}
          disabled={edges.start}
          className="pointer-events-auto grid size-11 place-items-center rounded-full bg-white text-ink ring-1 ring-line transition hover:ring-teal/40 disabled:opacity-35"
          aria-label="Anteriores"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          disabled={edges.end}
          className="pointer-events-auto grid size-11 place-items-center rounded-full bg-white text-ink ring-1 ring-line transition hover:ring-teal/40 disabled:opacity-35"
          aria-label="Siguientes"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
