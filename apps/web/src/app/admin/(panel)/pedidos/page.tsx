'use client';

import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, MapPin, Phone, Search, Store } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Badge, Card, DeleteButton, EmptyState, LoadingBlock, PageHeader, SegmentedTabs, Select, Textarea } from '@/components/admin/ui';
import { WhatsAppIcon } from '@/components/ui/icons';
import { useAdminMutation, useAdminQuery } from '@/lib/admin';
import { cn } from '@/lib/cn';
import { DELIVERY_LABEL, formatDateTime, money, ORDER_STATUS_LABEL, PAYMENT_LABEL, timeAgo, toWhatsApp, waLink } from '@/lib/format';
import type { Inquiry, Order, OrderStatus, Paginated } from '@/lib/types';

const STATUSES: OrderStatus[] = ['NEW', 'CONTACTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
const TONE: Record<OrderStatus, 'teal' | 'sun' | 'neutral' | 'red' | 'ink'> = { NEW: 'teal', CONTACTED: 'sun', PREPARING: 'sun', READY: 'ink', DELIVERED: 'neutral', CANCELLED: 'red' };

function OrdersInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState<'orders' | 'inquiries'>('orders');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState<string | null>(null);
  const query = new URLSearchParams({ pageSize: '50', ...(status ? { status } : {}), ...(q ? { q } : {}) });
  const orders = useAdminQuery<Paginated<Order>>(['orders', status, q], `/admin/orders?${query}`);
  const inquiries = useAdminQuery<Inquiry[]>(['inquiries'], '/admin/inquiries');

  useEffect(() => {
    if (params.get('q') && orders.data?.items.length === 1) setOpen(orders.data.items[0].id);
  }, [orders.data, params]);

  return (
    <>
      <PageHeader title="Pedidos" text="Los pedidos que la gente arma en la web y envía por WhatsApp. Cambiá el estado a medida que avanzan." />
      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'orders', label: 'Pedidos', count: orders.data?.total },
          { value: 'inquiries', label: 'Consultas', count: inquiries.data?.filter((i) => !i.handled).length },
        ]}
      />
      {tab === 'orders' ? (
        <>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código, nombre o teléfono" className="h-11 w-full rounded-xl bg-white pl-10 pr-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-teal-strong" />
            </label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')} className="sm:w-56">
              <option value="">Todos los estados</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-5">
            {orders.isLoading ? (
              <LoadingBlock />
            ) : !orders.data?.items.length ? (
              <EmptyState title="No hay pedidos para mostrar" text="Cuando alguien envíe un pedido desde la web, aparece acá con todos sus datos." />
            ) : (
              <ul className="space-y-3">
                {orders.data.items.map((o) => (
                  <OrderRow key={o.id} order={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} />
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <InquiriesList items={inquiries.data ?? []} loading={inquiries.isLoading} />
      )}
    </>
  );
}

function OrderRow({ order: o, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  const [notes, setNotes] = useState(o.adminNotes ?? '');
  const update = useAdminMutation<Partial<Order>>({ method: 'PATCH', path: `/admin/orders/${o.id}`, invalidate: [['orders'], ['stats']], success: 'Pedido actualizado' });
  const remove = useAdminMutation({ method: 'DELETE', path: `/admin/orders/${o.id}`, invalidate: [['orders'], ['stats']], success: 'Pedido eliminado' });
  const reply = waLink(toWhatsApp(o.phone), `¡Hola ${o.customerName.split(' ')[0]}! Te escribimos de Farmacia Amancio Fernández por tu pedido ${o.code}.`);

  return (
    <li className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-line">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5" aria-expanded={open}>
        <span className={cn('size-2.5 shrink-0 rounded-full', o.status === 'NEW' ? 'bg-teal' : 'bg-line')} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold text-ink">{o.customerName}</span>
            <span className="tabular text-xs text-ink-soft">{o.code}</span>
          </span>
          <span className="block truncate text-sm text-ink-soft">
            {timeAgo(o.createdAt)} · {o.items.reduce((a, i) => a + i.quantity, 0)} productos · {DELIVERY_LABEL[o.deliveryMethod]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
          {o.total ? <span className="tabular text-sm font-semibold text-ink">{money(o.total)}</span> : null}
        </span>
        <ChevronDown className={cn('size-5 shrink-0 text-ink-soft transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid gap-6 border-t border-line px-4 py-5 sm:px-5 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <ul className="divide-y divide-line">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-4 py-2.5 text-sm">
                      <span className="text-ink">
                        <span className="tabular font-semibold">{i.quantity} ×</span> {i.name}
                        {i.option && <span className="text-ink-soft"> ({i.option})</span>}
                      </span>
                      <span className="tabular shrink-0 text-ink-soft">{i.unitPrice ? money(i.unitPrice * i.quantity) : 'a consultar'}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-ink"><Phone className="size-4 text-teal-strong" /> {o.phone}</div>
                  <div className="flex items-center gap-2 text-ink">
                    {o.deliveryMethod === 'DELIVERY' ? <MapPin className="size-4 text-teal-strong" /> : <Store className="size-4 text-teal-strong" />}
                    {o.deliveryMethod === 'DELIVERY' ? o.address : 'Retira en la farmacia'}
                  </div>
                  {o.paymentMethod && <div className="text-ink-soft">Pago: <span className="text-ink">{PAYMENT_LABEL[o.paymentMethod]}</span></div>}
                  {o.insurance && <div className="text-ink-soft">Obra social: <span className="text-ink">{o.insurance}</span></div>}
                  <div className="text-ink-soft">Recibido: <span className="text-ink">{formatDateTime(o.createdAt)}</span></div>
                </dl>
                {o.notes && <p className="mt-3 rounded-xl bg-mist p-3 text-sm text-ink">“{o.notes}”</p>}
              </div>
              <div className="space-y-4">
                <a href={reply} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-full bg-teal-strong font-semibold text-white">
                  <WhatsAppIcon className="size-5" /> Escribirle por WhatsApp
                </a>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">Estado</span>
                  <Select value={o.status} onChange={(e) => update.mutate({ status: e.target.value as OrderStatus })}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">Notas internas</span>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (o.adminNotes ?? '') && update.mutate({ adminNotes: notes })} placeholder="Ej.: se entrega el martes a la tarde" />
                </label>
                <div className="flex justify-end">
                  <DeleteButton onConfirm={() => remove.mutate(undefined)} pending={remove.isPending} label="Eliminar pedido" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function InquiriesList({ items, loading }: { items: Inquiry[]; loading: boolean }) {
  const toggle = useAdminMutation<{ id: string; handled: boolean }>({ method: 'PATCH', path: (v) => `/admin/inquiries/${v.id}`, body: (v) => ({ handled: v.handled }), invalidate: [['inquiries'], ['stats']] });
  if (loading) return <LoadingBlock />;
  if (!items.length) return <div className="mt-5"><EmptyState title="Sin consultas" text="Las consultas que lleguen desde el sitio aparecen acá." /></div>;
  return (
    <ul className="mt-5 space-y-3">
      {items.map((i) => (
        <Card key={i.id} className={cn(i.handled && 'opacity-60')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{i.name}</p>
              <p className="text-sm text-ink-soft">{[i.phone, i.email].filter(Boolean).join(' · ')} · {timeAgo(i.createdAt)}</p>
            </div>
            <button type="button" onClick={() => toggle.mutate({ id: i.id, handled: !i.handled })} className="rounded-full px-3 py-1.5 text-sm font-semibold text-teal-strong hover:bg-foam">
              {i.handled ? 'Marcar pendiente' : 'Marcar respondida'}
            </button>
          </div>
          <p className="mt-3 text-ink">{i.message}</p>
          {i.product && <p className="mt-2 text-sm text-ink-soft">Sobre: {i.product.name}</p>}
        </Card>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <OrdersInner />
    </Suspense>
  );
}
