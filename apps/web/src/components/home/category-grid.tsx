import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Img } from '@/components/ui/img';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/lib/cn';
import type { Category } from '@/lib/types';

/** Categorías como vidrieras: la primera (perfumería) ocupa el doble */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  const list = categories.filter((c) => !c.parentId && c.productCount > 0);
  if (!list.length) return null;
  return (
    <section className="bg-mist py-16 lg:py-24" aria-labelledby="categorias-title">
      <div className="container-x">
        <SectionHeading id="categorias-title" title="Todo lo que hay en la Farma" text="Recorré la farmacia por sección, como si estuvieras en 106 y Boulevard." href="/catalogo" linkLabel="Ver catálogo" />
        <ul className="mt-9 grid auto-rows-[11.5rem] grid-cols-2 gap-3 sm:auto-rows-[14rem] md:grid-cols-3 lg:auto-rows-[15.5rem] lg:grid-cols-4 lg:gap-4">
          {list.map((c, i) => (
            <li key={c.id} className={cn(i === 0 && 'col-span-2 row-span-2', i === 3 && 'lg:col-span-2')}>
              <Link href={`/catalogo/${c.slug}`} className="group relative block size-full overflow-hidden rounded-[1.5rem] bg-foam">
                <Img
                  media={c.cover}
                  alt=""
                  sizes={i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
                  className="absolute! inset-0"
                  imgClassName="transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/25 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 lg:p-5">
                  <span>
                    <span className={cn('block text-balance font-serif leading-tight text-white', i === 0 ? 'text-[1.8rem] lg:text-[2.4rem]' : 'text-[1.12rem] lg:text-[1.35rem]')}>{c.name}</span>
                    {i === 0 && c.tagline && <span className="mt-1.5 block max-w-sm text-[0.9rem] text-white/75">{c.tagline}</span>}
                    <span className="tabular mt-1 block text-[0.78rem] font-medium text-white/70">{c.productCount} productos</span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors group-hover:bg-white group-hover:text-ink">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
