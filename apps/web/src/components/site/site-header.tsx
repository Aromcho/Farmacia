'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Search, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { useCart } from '@/components/cart/cart-provider';
import { cn } from '@/lib/cn';
import { StatusPill } from './status-pill';
import { useUI } from './ui-provider';

export interface NavLink {
  href: string;
  label: string;
}

/** Páginas con hero oscuro a sangre: el header arranca transparente */
const isDarkHero = (p: string) => p === '/' || /^\/catalogo\/[^/]+$/.test(p) || p === '/farmacia';

export function SiteHeader({ nav }: { nav: NavLink[] }) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { openSearch } = useUI();
  const { count, bump } = useCart();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    // en móvil se esconde al bajar y vuelve al subir
    setHidden(y > 160 && y > prev + 2);
    if (y < prev - 2) setHidden(false);
  });

  const overDark = isDarkHero(pathname) && !scrolled;

  // las barras "sticky" (filtros del catálogo) suben cuando el header se esconde
  useEffect(() => {
    document.documentElement.style.setProperty('--header-offset', hidden ? '0px' : 'var(--header-h)');
  }, [hidden]);

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300',
        overDark ? 'border-b border-transparent text-white' : 'glass border-b border-line/70 text-ink shadow-[0_1px_0_rgb(255_255_255/0.6)_inset]',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="container-x flex h-(--header-h) items-center gap-6">
        <Link href="/" aria-label="Farmacia Amancio Fernández, inicio" className="shrink-0 rounded-xl">
          <Logo tone={overDark ? 'white' : 'color'} className="[&_svg]:h-8 lg:[&_svg]:h-9" />
        </Link>

        <nav aria-label="Secciones" className="hidden flex-1 items-center gap-0.5 lg:flex">
          {nav.map((l, i) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'relative whitespace-nowrap rounded-full px-3 py-2 text-[0.9rem] font-medium transition-colors',
                  i >= 3 && i < nav.length - 2 && 'hidden 2xl:block',
                  overDark ? 'text-white/80 hover:text-white' : 'text-ink-soft hover:text-ink',
                  active && (overDark ? 'text-white' : 'text-ink'),
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className={cn('absolute inset-0 -z-10 rounded-full', overDark ? 'bg-white/12' : 'bg-foam')}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <StatusPill tone={overDark ? 'dark' : 'light'} className={overDark ? 'max-lg:hidden' : undefined} />
          <button
            type="button"
            onClick={openSearch}
            className={cn(
              'hidden h-10 items-center gap-2 rounded-full pl-3.5 pr-2 text-sm font-medium transition-colors lg:inline-flex',
              overDark ? 'bg-white/10 text-white/85 ring-1 ring-white/20 hover:bg-white/15' : 'bg-white text-ink-soft ring-1 ring-line hover:text-ink',
            )}
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden w-28 text-left xl:inline">Buscar</span>
            <kbd className={cn('rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold', overDark ? 'bg-white/15' : 'bg-foam text-ink-soft')}>⌘K</kbd>
          </button>
          <Link
            href="/pedido"
            className={cn(
              'relative hidden h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors lg:inline-flex',
              overDark ? 'bg-white text-ink hover:bg-foam' : 'bg-teal-strong text-white hover:bg-teal-deep',
            )}
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            Mi pedido
            {count > 0 && (
              <motion.span
                key={bump}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                className={cn(
                  'tabular grid min-w-5 place-items-center rounded-full px-1.5 text-[0.72rem] leading-5',
                  overDark ? 'bg-teal-strong text-white' : 'bg-white text-teal-strong',
                )}
              >
                {count}
              </motion.span>
            )}
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
