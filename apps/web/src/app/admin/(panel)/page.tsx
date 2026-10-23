'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, Eye, MessageSquare, Package } from 'lucide-react';
import { OrdersChart } from '@/components/admin/orders-chart';
import { Badge, Card, LoadingBlock, PageHeader } from '@/components/admin/ui';
import { Img } from '@/components/ui/img';
import { useAdminQuery, useMe } from '@/lib/admin';
import { money, ORDER_STATUS_LABEL, timeAgo } from '@/lib/format';
import type { AdminStats } from '@/lib/types';

export default function DashboardPage() {
  const me = useMe();
  const { data, isLoading } = useAdminQuery<AdminStats>(['stats'], '/admin/stats');
  if (isLoading || !data) return <LoadingBlock />;
  const t = data.totals;
  const hour = new Date().getHours();
  const greet = hour < 13 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const tiles = [
    { label: 'Pedidos nuevos', value: t.ordersNew, hint: `${t.orders7} en los últimos 7 días`, href: '/admin/pedidos', icon: ClipboardList, accent: t.ordersNew > 0 },
    { label: 'Productos activos', value: t.activeProducts, hint: `${t.products} en total · ${t.featured} destacados`, href: '/admin/productos', icon: Package },
    { label: 'Pedidos del mes', value: t.orders30, hint: 'últimos 30 días', href: '/admin/pedidos', icon: ClipboardList },
    { label: 'Consultas sin responder', value: t.inquiriesPending, hint: 'desde el sitio', href: '/admin/pedidos', icon: MessageSquare },
  ];

  return (
    <>
      <PageHeader title={`${greet}, ${me.data?.name.split(' ')[0] ?? ''}`} text={data.hours.isOpen ? `La farmacia está abierta${data.hours.closesAt ? ` hasta las ${data.hours.closesAt}` : ''}.` : 'La farmacia está cerrada ahora.'} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {tiles.map((x) => (
          <Link key={x.label} href={x.href} className={`group rounded-[1.5rem] p-5 ring-1 transition ${x.accent ? 'bg-teal-strong text-white ring-teal-strong' : 'bg-white ring-line hover:ring-teal/40'}`}>
            <x.icon className={`size-5 ${x.accent ? 'text-white/80' : 'text-teal-strong'}`} />
            <p className="tabular mt-4 text-[2.2rem] font-bold leading-none">{x.value}</p>
            <p className={`mt-2 text-sm font-semibold ${x.accent ? 'text-white' : 'text-ink'}`}>{x.label}</p>
            <p className={`mt-0.5 text-xs ${x.accent ? 'text-white/75' : 'text-ink-soft'}`}>{x.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Actividad">
          <OrdersChart daily={data.daily} />
        </Card>
        <Card title="Últimos pedidos" actions={<Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-strong">Ver todos <ArrowRight className="size-4" /></Link>}>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">Todavía no llegaron pedidos desde la web. Cuando alguien envíe uno, aparece acá y en WhatsApp.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos?q=${o.code}`} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{o.customerName}</span>
                      <span className="tabular block text-xs text-ink-soft">{o.code} · {timeAgo(o.createdAt)} · {o.items.length} {o.items.length === 1 ? 'producto' : 'productos'}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={o.status === 'NEW' ? 'teal' : 'neutral'}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                      {o.total ? <span className="tabular text-xs text-ink-soft">{money(o.total)}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6" title="Lo más visto en la web" actions={<span className="inline-flex items-center gap-1 text-xs text-ink-soft"><Eye className="size-3.5" /> visitas a la ficha</span>}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data.topViewed.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/productos/${p.id}`} className="block">
                <Img media={p.images[0]?.media} ratio="4/5" sizes="160px" className="rounded-xl" />
                <p className="mt-2 truncate text-xs font-semibold text-teal-strong">{p.brand?.name}</p>
                <p className="truncate text-sm text-ink">{p.name}</p>
                <p className="tabular text-xs text-ink-soft">{p.views} visitas</p>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
