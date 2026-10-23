'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Cross, Home, LayoutGrid, Search, ShoppingBag, type LucideIcon } from 'lucide-react';
import { useCart } from '@/components/cart/cart-provider';
import { cn } from '@/lib/cn';
import { useUI } from './ui-provider';

type Tab = { key: string; label: string; icon: LucideIcon; href?: string; match?: (p: string) => boolean };

const TABS: Tab[] = [
  { key: 'inicio', label: 'Inicio', icon: Home, href: '/', match: (p) => p === '/' },
  { key: 'catalogo', label: 'Catálogo', icon: LayoutGrid, href: '/catalogo', match: (p) => p.startsWith('/catalogo') },
  { key: 'buscar', label: 'Buscar', icon: Search },
  { key: 'pedido', label: 'Pedido', icon: ShoppingBag, href: '/pedido', match: (p) => p.startsWith('/pedido') },
  { key: 'farmacia', label: 'Farmacia', icon: Cross, href: '/farmacia', match: (p) => p.startsWith('/farmacia') || p.startsWith('/obras-sociales') },
];

/** Barra de pestañas inferior (sólo móvil/tablet): todo al alcance del pulgar */
export function TabBar() {
  const pathname = usePathname();
  const { count, bump } = useCart();
  const { openSearch, searchOpen } = useUI();

  // en la ficha de producto la reemplaza la barra de "Agregar al pedido"
  if (pathname.startsWith('/producto/')) return null;

  return (
    <nav aria-label="Navegación principal" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 pb-safe lg:hidden">
      <ul className="mx-auto grid h-(--tabbar-h) max-w-lg grid-cols-5 px-1">
        {TABS.map((t) => {
          const active = t.key === 'buscar' ? searchOpen : !searchOpen && !!t.match?.(pathname);
          const Icon = t.icon;
          const inner = (
            <>
              <span className="relative grid h-8 w-14 place-items-center">
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-foam"
                    transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  />
                )}
                <Icon className={cn('relative size-[1.3rem] transition-colors', active ? 'text-teal-strong' : 'text-ink-soft')} strokeWidth={active ? 2.3 : 1.9} aria-hidden="true" />
                {t.key === 'pedido' && count > 0 && (
                  <motion.span
                    key={bump}
                    initial={{ scale: 0.3, y: -4 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 16 }}
                    className="tabular absolute -top-0.5 right-2 grid min-w-[1.15rem] place-items-center rounded-full bg-teal-strong px-1 text-[0.66rem] font-bold leading-[1.15rem] text-white ring-2 ring-white"
                  >
                    {count}
                  </motion.span>
                )}
              </span>
              <span className={cn('text-[0.68rem] font-semibold tracking-[0.01em]', active ? 'text-teal-strong' : 'text-ink-soft')}>{t.label}</span>
            </>
          );
          const cls = 'flex h-full flex-col items-center justify-center gap-0.5 rounded-2xl active:scale-95 transition-transform';
          return (
            <li key={t.key}>
              {t.href ? (
                <Link href={t.href} className={cls} aria-current={active ? 'page' : undefined}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={openSearch} className={cn(cls, 'w-full')} aria-label="Buscar productos">
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
