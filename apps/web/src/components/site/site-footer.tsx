import Link from 'next/link';
import { Clock, MapPin, Phone } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/icons';
import { prettyPhone, waLink } from '@/lib/format';
import type { PublicStore } from '@/lib/types';

export function SiteFooter({ store, categories }: { store: PublicStore | null; categories: { name: string; slug: string }[] }) {
  const info = store?.info;
  const week = store?.hours.weeks[store.hours.season] ?? [];
  const weekdays = week.find((d) => d.weekday === 1);
  const saturday = week.find((d) => d.weekday === 6);
  const fmt = (r?: { ranges: { opens: string; closes: string }[] }) =>
    r && r.ranges.length ? r.ranges.map((x) => `${x.opens} a ${x.closes}`).join(' y ') : 'Cerrado';

  return (
    <footer className="relative overflow-hidden bg-night text-white/80 mb-tabbar">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-teal/20 blur-3xl" />
      <div className="container-x relative grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:grid-cols-[1.3fr_1fr_1fr_1.2fr] md:py-20">
        <div className="col-span-2 max-w-xs md:col-span-1">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-auto" mono="white" />
            <div className="leading-tight">
              <p className="font-extrabold tracking-[0.06em] text-white uppercase">Amancio Fernández</p>
              <p className="text-sm text-white/60">farmacia &amp; bienestar</p>
            </div>
          </div>
          <p className="mt-6 font-serif text-2xl leading-snug text-white">Más de 60 años cuidándote en Villa Gesell.</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Catálogo</h2>
          <ul className="mt-4 space-y-2.5 text-[0.95rem]">
            {categories.slice(0, 7).map((c) => (
              <li key={c.slug}>
                <Link className="transition-colors hover:text-white" href={`/catalogo/${c.slug}`}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">La farmacia</h2>
          <ul className="mt-4 space-y-2.5 text-[0.95rem]">
            <li><Link className="hover:text-white" href="/farmacia">Horarios y ubicación</Link></li>
            <li><Link className="hover:text-white" href="/obras-sociales">Obras sociales</Link></li>
            <li><Link className="hover:text-white" href="/catalogo?decant=true">Decants</Link></li>
            <li><Link className="hover:text-white" href="/catalogo?promo=true">Promociones</Link></li>
            <li><Link className="hover:text-white" href="/pedido">Mi pedido</Link></li>
          </ul>
        </div>

        <div className="col-span-2 space-y-4 text-[0.95rem] md:col-span-1">
          <h2 className="text-sm font-semibold text-white">Contacto</h2>
          {info && (
            <>
              <a className="flex gap-3 hover:text-white" href={info.mapsUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                <MapPin className="mt-0.5 size-4 shrink-0 text-aqua" aria-hidden="true" />
                <span>
                  {info.address}
                  <br />
                  {info.city}, {info.province}
                </span>
              </a>
              <p className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-aqua" aria-hidden="true" />
                <span className="tabular">
                  Lun a vie: {fmt(weekdays)}
                  <br />
                  Sábados: {fmt(saturday)}
                </span>
              </p>
              <a className="flex gap-3 hover:text-white" href={`tel:${info.phone.replace(/\s/g, '')}`}>
                <Phone className="mt-0.5 size-4 shrink-0 text-aqua" aria-hidden="true" />
                <span className="tabular">{prettyPhone(info.phone)}</span>
              </a>
              <div className="flex gap-2 pt-2">
                <a
                  href={waLink(info.whatsapp, '¡Hola! Quería hacer una consulta.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-11 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition-colors hover:bg-white/20"
                  aria-label="Escribinos por WhatsApp"
                >
                  <WhatsAppIcon className="size-5 text-white" />
                </a>
                <a
                  href={info.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-11 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition-colors hover:bg-white/20"
                  aria-label="Seguinos en Instagram"
                >
                  <InstagramIcon className="size-5 text-white" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Farmacia Amancio Fernández · Villa Gesell, Buenos Aires</p>
          <p>Los precios pueden cambiar sin aviso. Consultá disponibilidad antes de acercarte.</p>
        </div>
      </div>
    </footer>
  );
}
