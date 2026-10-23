'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  BookImage,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  Images,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { LogoMark } from '@/components/brand/logo';
import { InstagramIcon } from '@/components/ui/icons';
import { statusText, useStore } from '@/components/site/store-provider';
import { LedDot } from '@/components/site/status-pill';
import { useAdminQuery, useMe } from '@/lib/admin';
import { post } from '@/lib/client-api';
import { cn } from '@/lib/cn';
import type { AdminStats } from '@/lib/types';
import { LoadingBlock } from './ui';

type Item = { href: string; label: string; icon: LucideIcon | typeof InstagramIcon; badge?: 'orders' };
const NAV: { title?: string; items: Item[] }[] = [
  {
    items: [
      { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
      { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList, badge: 'orders' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/admin/productos', label: 'Productos', icon: Package },
      { href: '/admin/categorias', label: 'Categorías', icon: LayoutGrid },
      { href: '/admin/marcas', label: 'Marcas', icon: Tag },
    ],
  },
  {
    title: 'Contenido',
    items: [
      { href: '/admin/historias', label: 'Historias destacadas', icon: BookImage },
      { href: '/admin/banners', label: 'Banners', icon: Megaphone },
      { href: '/admin/instagram', label: 'Instagram', icon: InstagramIcon },
      { href: '/admin/medios', label: 'Biblioteca de medios', icon: Images },
    ],
  },
  {
    title: 'La farmacia',
    items: [
      { href: '/admin/horarios', label: 'Horarios', icon: CalendarClock },
      { href: '/admin/obras-sociales', label: 'Obras sociales', icon: ShieldCheck },
      { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
];

function NavList({ onNavigate, newOrders }: { onNavigate?: () => void; newOrders: number }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6" aria-label="Panel">
      {NAV.map((group, gi) => (
        <div key={gi}>
          {group.title && <p className="mb-1.5 px-3 text-xs font-semibold text-ink-soft/80">{group.title}</p>}
          <ul className="space-y-0.5">
            {group.items.map((it) => {
              const active = it.href === '/admin' ? pathname === '/admin' : pathname.startsWith(it.href);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link href={it.href} onClick={onNavigate} className={cn('relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.93rem] font-medium transition-colors', active ? 'text-ink' : 'text-ink-soft hover:bg-mist hover:text-ink')}>
                    {active && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-foam" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                    <Icon className={cn('relative size-[1.15rem]', active && 'text-teal-strong')} aria-hidden="true" />
                    <span className="relative flex-1">{it.label}</span>
                    {it.badge === 'orders' && newOrders > 0 && <span className="tabular relative rounded-full bg-teal-strong px-2 py-0.5 text-xs font-bold text-white">{newOrders}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const me = useMe();
  const [menu, setMenu] = useState(false);
  const { hours } = useStore();
  const s = statusText(hours);
  const stats = useAdminQuery<AdminStats>(['stats'], '/admin/stats', { enabled: !!me.data });
  const newOrders = stats.data?.totals.ordersNew ?? 0;

  useEffect(() => {
    if (me.isError) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [me.isError, router, pathname]);

  const logout = async () => {
    await post('/auth/logout').catch(() => {});
    qc.clear();
    router.replace('/admin/login');
  };

  if (!me.data) return <LoadingBlock />;

  const footer = (
    <div className="space-y-1 border-t border-line pt-4">
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-soft">
        <LedDot on={s.open} warn={s.soon} />
        <span className="tabular">{s.short}</span>
      </div>
      <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-mist hover:text-ink">
        <ExternalLink className="size-4" /> Ver el sitio
      </a>
      <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-soft hover:bg-mist hover:text-ink">
        <LogOut className="size-4" /> Salir ({me.data.name})
      </button>
    </div>
  );

  return (
    <div className="lg:grid lg:min-h-svh lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col gap-6 overflow-y-auto border-r border-line bg-white px-3 py-5 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-3">
          <LogoMark className="h-8 w-auto" />
          <span className="leading-tight">
            <span className="block text-[0.82rem] font-extrabold uppercase tracking-[0.06em] text-teal-strong">Amancio Fernández</span>
            <span className="block text-xs text-ink-soft">Panel de gestión</span>
          </span>
        </Link>
        <div className="flex-1">
          <NavList newOrders={newOrders} />
        </div>
        {footer}
      </aside>

      <header className="glass sticky top-0 z-40 flex items-center gap-3 border-b border-line px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-line" aria-label="Abrir menú">
          <Menu className="size-5" />
        </button>
        <LogoMark className="h-7 w-auto" />
        <span className="font-semibold text-ink">Panel</span>
        {newOrders > 0 && (
          <Link href="/admin/pedidos" className="tabular ml-auto rounded-full bg-teal-strong px-3 py-1.5 text-xs font-bold text-white">
            {newOrders} {newOrders === 1 ? 'pedido nuevo' : 'pedidos nuevos'}
          </Link>
        )}
      </header>

      <Drawer.Root open={menu} onOpenChange={setMenu} direction="left">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-night/40" />
          <Drawer.Content className="fixed inset-y-0 left-0 z-[61] flex w-[min(20rem,86vw)] flex-col gap-6 overflow-y-auto bg-white px-3 py-5 outline-none" data-lenis-prevent>
            <Drawer.Title className="flex items-center gap-2.5 px-3">
              <LogoMark className="h-8 w-auto" />
              <span className="text-sm font-extrabold uppercase tracking-[0.06em] text-teal-strong">Panel</span>
            </Drawer.Title>
            <Drawer.Description className="sr-only">Secciones del panel</Drawer.Description>
            <div className="flex-1">
              <NavList onNavigate={() => setMenu(false)} newOrders={newOrders} />
            </div>
            {footer}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <main className="min-w-0 px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10">
        <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="mx-auto max-w-6xl">
          {children}
        </motion.div>
      </main>
    </div>
  );
}
