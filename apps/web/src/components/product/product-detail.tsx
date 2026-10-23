'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, Minus, Plus, ShoppingBag, Store, Truck, CreditCard, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/components/cart/cart-provider';
import { useStore } from '@/components/site/store-provider';
import { DropIcon, WhatsAppIcon } from '@/components/ui/icons';
import { Img } from '@/components/ui/img';
import { cn } from '@/lib/cn';
import { GENDER_LABEL, installment, money, savingPct, waLink } from '@/lib/format';
import type { ProductDetail as TProduct } from '@/lib/types';

export function ProductDetail({ product: p }: { product: TProduct }) {
  const { add } = useCart();
  const { info } = useStore();
  const [qty, setQty] = useState(1);
  const [option, setOption] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/products/${p.slug}/view`, { method: 'POST' }).catch(() => {});
  }, [p.slug]);

  const cash = p.cashPrice ?? p.price;
  const off = savingPct(p.price, p.cashPrice);
  const label = [p.brand?.name, p.name].filter(Boolean).join(' ');
  const options = p.hasDecant ? ['Frasco', 'Decant'] : null;
  const hasNotes = p.notesTop.length + p.notesHeart.length + p.notesBase.length > 0;
  const wa = waLink(info?.whatsapp, `¡Hola! Quería consultar por ${label}${p.presentation ? ` (${p.presentation})` : ''}${option === 'Decant' ? ' en decant' : ''}.`);

  const addToCart = () => add(p, qty, options ? (option ?? 'Frasco') : null);

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
        <Gallery product={p} onZoom={setZoom} />

        <div className="container-x pt-6 lg:px-0 lg:pt-0">
          <nav aria-label="Ruta" className="hidden items-center gap-1.5 text-sm text-ink-soft lg:flex">
            <Link href="/catalogo" className="hover:text-ink">
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/catalogo/${p.category.slug}`} className="hover:text-ink">
              {p.category.name}
            </Link>
          </nav>

          {p.brand && (
            <Link href={`/catalogo?brand=${p.brand.slug}`} className="mt-0 inline-block text-[0.95rem] font-semibold text-teal-strong hover:underline lg:mt-6">
              {p.brand.name}
            </Link>
          )}
          <h1 className="display-2 mt-1 text-balance text-ink">{p.name}</h1>
          <p className="mt-2 text-ink-soft">{[p.presentation, p.gender ? GENDER_LABEL[p.gender] : null].filter(Boolean).join(' · ')}</p>

          {p.highlights.length > 0 && (
            <p className="mt-5 font-serif text-[1.35rem] leading-snug text-ink">
              {p.highlights.map((h, i) => (
                <motion.span key={h} className="mr-2 inline-block" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.6 }}>
                  {h}.
                </motion.span>
              ))}
            </p>
          )}

          {/* precio */}
          <div className="mt-6 rounded-[1.4rem] bg-mist p-5">
            {p.showPrice && cash ? (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tabular text-[2rem] font-bold leading-none tracking-tight text-ink">{money(cash)}</span>
                  {p.cashPrice && <span className="text-sm font-semibold text-teal-strong">{off ? `en efectivo · ahorrás ${off}%` : 'en efectivo'}</span>}
                </div>
                {p.price && p.cashPrice && p.price !== p.cashPrice && (
                  <p className="tabular mt-2 text-[0.95rem] text-ink-soft">
                    Precio de lista {money(p.price)} · 3 cuotas sin interés de {installment(p.price, 3)}
                  </p>
                )}
                {p.price && !p.cashPrice && <p className="mt-2 text-[0.95rem] text-ink-soft">Hasta 3 cuotas sin interés de {installment(p.price, 3)}</p>}
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-ink">Consultá el precio</p>
                <p className="mt-1 text-[0.95rem] text-ink-soft">Te respondemos por WhatsApp dentro del horario de la farmacia.</p>
              </>
            )}
            {!p.available && <p className="mt-3 text-sm font-semibold text-[#9a5b00]">Consultá disponibilidad antes de venir.</p>}
          </div>

          {options && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink">Formato</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {options.map((o) => {
                  const active = (option ?? 'Frasco') === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOption(o)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[0.95rem] font-semibold ring-1 transition',
                        active ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line hover:ring-teal/40',
                      )}
                    >
                      {o === 'Decant' && <DropIcon className="size-4" />}
                      {o === 'Frasco' ? 'Frasco original' : 'Decant'}
                    </button>
                  );
                })}
              </div>
              {(option ?? 'Frasco') === 'Decant' && (
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">Lo fraccionamos del frasco original en un atomizador práctico. Te confirmamos tamaños y precio por WhatsApp.</p>
              )}
            </div>
          )}

          {/* acciones (escritorio) */}
          <div className="mt-6 hidden items-center gap-3 lg:flex">
            <Stepper qty={qty} setQty={setQty} />
            <button type="button" onClick={addToCart} className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-teal-strong px-6 font-semibold text-white shadow-[0_8px_24px_-8px_rgb(0_119_131/0.6)] transition hover:bg-teal-deep active:scale-[0.98]">
              <ShoppingBag className="size-5" aria-hidden="true" />
              Agregar al pedido
            </button>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="grid size-13 place-items-center rounded-full bg-white text-ink ring-1 ring-line transition hover:bg-mist" aria-label="Consultar por WhatsApp">
              <WhatsAppIcon className="size-5" />
            </a>
          </div>

          <ul className="mt-6 grid gap-2 text-[0.9rem] text-ink-soft sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <li className="flex items-center gap-2"><Truck className="size-4 text-teal-strong" aria-hidden="true" /> Envío sin cargo</li>
            <li className="flex items-center gap-2"><Store className="size-4 text-teal-strong" aria-hidden="true" /> Retiro en 106 y Boulevard</li>
            <li className="flex items-center gap-2"><CreditCard className="size-4 text-teal-strong" aria-hidden="true" /> 3 cuotas sin interés</li>
          </ul>

          {hasNotes && <NotesPyramid top={p.notesTop} heart={p.notesHeart} base={p.notesBase} />}

          {(p.description || p.shortDescription) && (
            <section className="mt-10">
              <h2 className="font-serif text-2xl text-ink">Sobre el producto</h2>
              {p.shortDescription && p.description && <p className="mt-3 text-[1.05rem] font-medium leading-relaxed text-ink">{p.shortDescription}</p>}
              <p className="mt-3 whitespace-pre-line text-[1.02rem] leading-relaxed text-ink-soft">{p.description ?? p.shortDescription}</p>
            </section>
          )}

          {p.attributes && Object.keys(p.attributes).length > 0 && (
            <dl className="mt-8 divide-y divide-line rounded-2xl ring-1 ring-line">
              {Object.entries(p.attributes).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 px-4 py-3 text-[0.95rem]">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="text-right font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-6 text-xs leading-relaxed text-ink-soft">Precios sujetos a cambio sin previo aviso. Las imágenes son de nuestras publicaciones en Instagram.</p>
        </div>
      </div>

      {/* barra fija móvil */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 pb-safe lg:hidden">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <Link href="/catalogo" className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-ink ring-1 ring-line" aria-label="Volver al catálogo">
            <ChevronLeft className="size-5" />
          </Link>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-ink ring-1 ring-line" aria-label="Consultar por WhatsApp">
            <WhatsAppIcon className="size-5" />
          </a>
          <button type="button" onClick={addToCart} className="flex h-12 flex-1 items-center justify-between gap-2 rounded-full bg-teal-strong pl-5 pr-2 font-semibold text-white active:scale-[0.98]">
            <span>Agregar</span>
            <span className="tabular rounded-full bg-white/15 px-3 py-1.5 text-sm">{p.showPrice && cash ? money(cash * qty) : 'Consultar'}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>{zoom !== null && <Lightbox product={p} index={zoom} onClose={() => setZoom(null)} />}</AnimatePresence>
    </>
  );
}

function Stepper({ qty, setQty }: { qty: number; setQty: (n: number) => void }) {
  return (
    <div className="flex h-13 items-center rounded-full bg-white ring-1 ring-line">
      <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid size-12 place-items-center text-ink disabled:opacity-40" disabled={qty <= 1} aria-label="Restar uno">
        <Minus className="size-4" />
      </button>
      <span className="tabular w-6 text-center font-semibold" aria-live="polite">
        {qty}
      </span>
      <button type="button" onClick={() => setQty(Math.min(50, qty + 1))} className="grid size-12 place-items-center text-ink" aria-label="Sumar uno">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function Gallery({ product: p, onZoom }: { product: TProduct; onZoom: (i: number) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const imgs = p.images;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!imgs.length) return <div className="aspect-[4/5] bg-foam lg:rounded-[2rem]" />;

  return (
    <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
      <div className="relative">
        <ul ref={ref} className="scroll-x lg:overflow-hidden lg:rounded-[2rem]" style={{ scrollPaddingInline: 0 }}>
          {imgs.map((im, i) => (
            <li key={im.id} className="w-full shrink-0">
              <button type="button" onClick={() => onZoom(i)} className="block w-full cursor-zoom-in" aria-label="Ampliar imagen">
                <Img media={im.media} alt={`${p.brand?.name ?? ''} ${p.name}`} ratio="4/5" sizes="(min-width: 1024px) 50vw, 100vw" priority={i === 0} />
              </button>
            </li>
          ))}
        </ul>
        {p.hasDecant && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-night/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <DropIcon className="size-3.5" /> También en decant
          </span>
        )}
        {imgs.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {imgs.map((im, i) => (
              <button
                key={im.id}
                type="button"
                onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' })}
                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/60')}
                aria-label={`Ver imagen ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="mt-3 hidden gap-3 lg:flex">
          {imgs.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' })}
              className={cn('w-20 overflow-hidden rounded-xl ring-2 transition', i === index ? 'ring-teal-strong' : 'ring-transparent opacity-70 hover:opacity-100')}
            >
              <Img media={im.media} ratio="4/5" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Lightbox({ product: p, index, onClose }: { product: TProduct; index: number; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-night/95 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} data-lenis-prevent>
      <button type="button" onClick={onClose} className="absolute right-4 top-[calc(env(safe-area-inset-top)+12px)] grid size-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Cerrar">
        <X className="size-6" />
      </button>
      <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <Img media={p.images[index]?.media} ratio="4/5" sizes="100vw" fit="contain" className="rounded-2xl bg-transparent" />
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/** Pirámide olfativa: salida, corazón y fondo */
function NotesPyramid({ top, heart, base }: { top: string[]; heart: string[]; base: string[] }) {
  const rows = [
    { label: 'Salida', hint: 'lo primero que sentís', notes: top, w: 'w-[62%]' },
    { label: 'Corazón', hint: 'el carácter del perfume', notes: heart, w: 'w-[81%]' },
    { label: 'Fondo', hint: 'lo que queda en la piel', notes: base, w: 'w-full' },
  ].filter((r) => r.notes.length);
  return (
    <section className="mt-10" aria-labelledby="notas-title">
      <h2 id="notas-title" className="font-serif text-2xl text-ink">
        Notas olfativas
      </h2>
      <div className="mt-5 flex flex-col items-center gap-2">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 12, scaleX: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scaleX: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn('rounded-2xl px-4 py-3.5 text-center', r.w, i === 0 ? 'bg-foam' : i === 1 ? 'bg-[#d5efef]' : 'bg-[#bfe5e6]')}
          >
            <p className="text-[0.78rem] font-semibold text-teal-deep">
              {r.label} <span className="font-normal text-ink-soft">· {r.hint}</span>
            </p>
            <p className="mt-1 font-serif text-[1.1rem] leading-snug text-ink">{r.notes.join(' · ')}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
