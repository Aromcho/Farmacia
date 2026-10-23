'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Loader2, Minus, Plus, ShoppingBag, Store, Trash2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ProductRail } from '@/components/catalog/product-rail';
import { useStore } from '@/components/site/store-provider';
import { WhatsAppIcon } from '@/components/ui/icons';
import { Img } from '@/components/ui/img';
import { HttpError, post } from '@/lib/client-api';
import { cn } from '@/lib/cn';
import { money } from '@/lib/format';
import type { DeliveryMethod, Order, PaymentMethod, Product } from '@/lib/types';
import { useCart } from './cart-provider';

const schema = z
  .object({
    customerName: z.string().trim().min(2, 'Contanos tu nombre'),
    phone: z.string().trim().regex(/^[\d\s+()-]{6,20}$/, 'Revisá el teléfono: solo números, con característica'),
    deliveryMethod: z.enum(['PICKUP', 'DELIVERY']),
    address: z.string().trim().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER']),
    insurance: z.string().optional(),
    notes: z.string().max(600).optional(),
  })
  .refine((v) => v.deliveryMethod === 'PICKUP' || (v.address && v.address.length >= 5), { path: ['address'], message: 'Indicá la dirección de entrega' });

type Form = z.infer<typeof schema>;
const PROFILE_KEY = 'af_cliente';

const PAYMENTS: { value: Exclude<PaymentMethod, 'OTHER'>; label: string; hint: string }[] = [
  { value: 'CASH', label: 'Efectivo', hint: 'Con descuento' },
  { value: 'CARD', label: 'Tarjeta', hint: '3 cuotas s/interés' },
  { value: 'TRANSFER', label: 'Transferencia', hint: 'Te pasamos los datos' },
];

export function CheckoutView({ insurers, suggestions }: { insurers: string[]; suggestions: Product[] }) {
  const { items, ready, setQty, remove, total, cashTotal, clear, count } = useCart();
  const { info } = useStore();
  const [form, setForm] = useState<Form>({ customerName: '', phone: '', deliveryMethod: 'PICKUP', address: '', paymentMethod: 'CASH', insurance: '', notes: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ code: string; url: string | null } | null>(null);
  const [website, setWebsite] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null');
      if (saved) setForm((f) => ({ ...f, ...saved }));
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof Form, string>> = {};
      for (const issue of parsed.error.issues) errs[issue.path[0] as keyof Form] ??= issue.message;
      setErrors(errs);
      document.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setSending(true);
    try {
      const v = parsed.data;
      const res = await post<{ order: Order; whatsappUrl: string | null }>('/orders', {
        customerName: v.customerName,
        phone: v.phone,
        deliveryMethod: v.deliveryMethod as DeliveryMethod,
        address: v.deliveryMethod === 'DELIVERY' ? v.address : undefined,
        paymentMethod: v.paymentMethod,
        insurance: v.insurance || undefined,
        notes: v.notes || undefined,
        website,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, option: it.option ?? undefined })),
      });
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify({ customerName: v.customerName, phone: v.phone, address: v.address, deliveryMethod: v.deliveryMethod }));
      } catch {
        /* sin almacenamiento */
      }
      setDone({ code: res.order.code, url: res.whatsappUrl });
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (res.whatsappUrl) window.setTimeout(() => (window.location.href = res.whatsappUrl!), 900);
    } catch (err) {
      toast.error('No pudimos enviar el pedido', { description: err instanceof HttpError ? err.message : 'Revisá tu conexión y probá de nuevo.' });
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="container-x flex min-h-[70svh] items-center justify-center py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.1 }} className="mx-auto grid size-20 place-items-center rounded-full bg-teal-strong text-white shadow-lift">
            <Check className="size-9" strokeWidth={2.5} />
          </motion.span>
          <h1 className="display-2 mt-8 text-ink">¡Pedido listo!</h1>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-soft">
            Tu código es <strong className="tabular text-ink">{done.code}</strong>. Te estamos llevando a WhatsApp para que nos mandes el detalle; te respondemos dentro del horario de la farmacia.
          </p>
          {done.url && (
            <a href={done.url} className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-teal-strong px-7 font-semibold text-white">
              <WhatsAppIcon className="size-5" />
              Abrir WhatsApp
            </a>
          )}
          <Link href="/catalogo" className="mt-4 block font-semibold text-teal-strong">
            Seguir mirando productos
          </Link>
        </motion.div>
      </div>
    );
  }

  if (ready && items.length === 0) {
    return (
      <div className="pb-16">
        <div className="container-x py-16 text-center lg:py-24">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-foam text-teal-strong">
            <ShoppingBag className="size-7" />
          </span>
          <h1 className="display-2 mt-6 text-ink">Tu pedido está vacío</h1>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">Agregá productos desde el catálogo y mandanos el pedido por WhatsApp. Lo preparamos y te lo llevamos sin cargo.</p>
          <Link href="/catalogo" className="mt-8 inline-flex h-12 items-center rounded-full bg-teal-strong px-7 font-semibold text-white">
            Explorar el catálogo
          </Link>
        </div>
        {suggestions.length > 0 && (
          <div className="container-x">
            <h2 className="display-3 text-ink">Los más pedidos</h2>
            <ProductRail products={suggestions} className="mt-6" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-x pb-20 pt-6 lg:pt-12">
      <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-strong">
        <ArrowLeft className="size-4" /> Seguir comprando
      </Link>
      <h1 className="display-2 mt-3 text-ink">Tu pedido</h1>
      <p className="tabular mt-1 text-ink-soft">{count} {count === 1 ? 'producto' : 'productos'}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        {/* ítems */}
        <section aria-label="Productos del pedido">
          <ul className="divide-y divide-line border-y border-line">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <motion.li
                  key={`${it.productId}-${it.option ?? ''}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-4 py-4"
                >
                  <Link href={`/producto/${it.slug}`} className="w-20 shrink-0 overflow-hidden rounded-2xl sm:w-24">
                    <Img media={it.image} ratio="4/5" sizes="96px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {it.brand && <p className="text-xs font-semibold text-teal-strong">{it.brand}</p>}
                        <Link href={`/producto/${it.slug}`} className="block font-serif text-[1.05rem] leading-snug text-ink">
                          {it.name}
                        </Link>
                        <p className="mt-0.5 text-sm text-ink-soft">{[it.option, it.presentation].filter(Boolean).join(' · ')}</p>
                      </div>
                      <button type="button" onClick={() => remove(it.productId, it.option)} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-foam hover:text-ink" aria-label={`Quitar ${it.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full ring-1 ring-line">
                        <button type="button" onClick={() => setQty(it.productId, it.option, it.quantity - 1)} className="grid size-9 place-items-center" aria-label="Restar uno">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="tabular w-6 text-center text-sm font-semibold">{it.quantity}</span>
                        <button type="button" onClick={() => setQty(it.productId, it.option, it.quantity + 1)} className="grid size-9 place-items-center" aria-label="Sumar uno">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="tabular font-semibold text-ink">{(it.cashPrice ?? it.price) ? money((it.cashPrice ?? it.price ?? 0) * it.quantity) : 'A consultar'}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <dl className="mt-5 space-y-2 text-[0.95rem]">
            {cashTotal !== null && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Total en efectivo</dt>
                <dd className="tabular text-lg font-bold text-ink">{money(cashTotal)}</dd>
              </div>
            )}
            {total !== null && total !== cashTotal && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Total de lista (3 cuotas sin interés)</dt>
                <dd className="tabular font-semibold text-ink">{money(total)}</dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {cashTotal === null ? 'Algunos productos no tienen precio publicado: ' : ''}Te confirmamos precio final y disponibilidad por WhatsApp antes de prepararlo.
          </p>
        </section>

        {/* datos */}
        <form onSubmit={submit} noValidate className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start lg:rounded-[2rem] lg:bg-mist lg:p-8">
          <h2 className="font-serif text-2xl text-ink">Tus datos</h2>
          <Field label="Nombre y apellido" error={errors.customerName}>
            <input name="customerName" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} autoComplete="name" className={input(errors.customerName)} />
          </Field>
          <Field label="Teléfono (WhatsApp)" error={errors.phone}>
            <input name="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" inputMode="tel" placeholder="2255 123456" className={input(errors.phone)} />
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">¿Cómo lo recibís?</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'PICKUP' as const, label: 'Retiro en la farmacia', icon: Store, hint: '106 y Boulevard' },
                { v: 'DELIVERY' as const, label: 'Envío a domicilio', icon: Truck, hint: 'Sin cargo' },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => set('deliveryMethod', o.v)}
                  aria-pressed={form.deliveryMethod === o.v}
                  className={cn('rounded-2xl p-3.5 text-left ring-1 transition', form.deliveryMethod === o.v ? 'bg-white ring-2 ring-teal-strong' : 'bg-white ring-line')}
                >
                  <o.icon className={cn('size-5', form.deliveryMethod === o.v ? 'text-teal-strong' : 'text-ink-soft')} />
                  <span className="mt-2 block text-[0.92rem] font-semibold leading-tight text-ink">{o.label}</span>
                  <span className="text-xs text-ink-soft">{o.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <AnimatePresence initial={false}>
            {form.deliveryMethod === 'DELIVERY' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Field label="Dirección de entrega" error={errors.address}>
                  <input name="address" value={form.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" placeholder="Paseo 105 entre Av. 3 y 4, depto…" className={input(errors.address)} />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">¿Cómo pagás?</legend>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENTS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => set('paymentMethod', pm.value)}
                  aria-pressed={form.paymentMethod === pm.value}
                  className={cn('rounded-2xl px-2.5 py-3 text-center ring-1 transition', form.paymentMethod === pm.value ? 'bg-white ring-2 ring-teal-strong' : 'bg-white ring-line')}
                >
                  <span className="block text-[0.9rem] font-semibold text-ink">{pm.label}</span>
                  <span className="block text-[0.72rem] leading-tight text-ink-soft">{pm.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <Field label="Obra social (opcional)">
            <select name="insurance" value={form.insurance} onChange={(e) => set('insurance', e.target.value)} className={input()}>
              <option value="">Sin obra social / particular</option>
              {insurers.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
              <option value="Otra">Otra (te consulto por WhatsApp)</option>
            </select>
          </Field>
          <Field label="¿Algo más? (opcional)">
            <textarea name="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Horario para recibirlo, si necesitás factura, etc." className={cn(input(), 'h-auto py-3')} />
          </Field>
          {/* campo trampa para bots */}
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <button type="submit" disabled={sending || items.length === 0} className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-teal-strong text-[1.02rem] font-semibold text-white shadow-[0_10px_30px_-10px_rgb(0_119_131/0.7)] transition hover:bg-teal-deep active:scale-[0.98] disabled:opacity-60">
            {sending ? <Loader2 className="size-5 animate-spin" /> : <WhatsAppIcon className="size-5" />}
            Enviar pedido por WhatsApp
          </button>
          <p className="text-center text-xs leading-relaxed text-ink-soft">
            Se abre WhatsApp con tu pedido para que lo envíes{info?.phone ? ` al ${info.phone}` : ''}. No se cobra nada desde la web.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-sm font-medium text-[#b42318]">{error}</span>}
    </label>
  );
}

const input = (error?: string) =>
  cn(
    'h-12 w-full rounded-2xl bg-white px-4 text-[1rem] text-ink outline-none ring-1 transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-teal-strong',
    error ? 'ring-[#b42318]' : 'ring-line',
  );
