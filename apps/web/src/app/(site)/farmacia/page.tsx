import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Navigation, Phone } from 'lucide-react';
import { DayNight } from '@/components/site/day-night';
import { HoursTable } from '@/components/site/hours-table';
import { MapEmbed } from '@/components/site/map-embed';
import { ExternalButton } from '@/components/ui/button';
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/icons';
import { ParallaxItem } from '@/components/ui/parallax';
import { getInsurers, getStore } from '@/lib/api';
import { prettyPhone, waLink } from '@/lib/format';

export const metadata: Metadata = {
  title: 'La farmacia: horarios y ubicación',
  description: 'Farmacia Amancio Fernández, en Paseo 106 y Boulevard, Villa Gesell. Horarios de verano y del resto del año, cómo llegar, obras sociales y contacto.',
};

const PHOTOS = [
  { src: '/media/nosotros/dia-lateral.webp', alt: 'Fachada de la farmacia en Paseo 106 y Boulevard', caption: 'Paseo 106 y Boulevard', wide: true },
  { src: '/media/farma/interior.webp', alt: 'Interior de la farmacia con mostradores de atención', caption: 'Mostrador' },
  { src: '/media/farma/perfumes.webp', alt: 'Góndolas de perfumería', caption: 'Perfumería' },
  { src: '/media/farma/herboristeria.webp', alt: 'Sección de herboristería', caption: 'Herboristería' },
  { src: '/media/farma/decant.webp', alt: 'Decants de perfumes', caption: 'Decants' },
  { src: '/media/nosotros/noche-amplia.webp', alt: 'La farmacia de noche con el cartel verde encendido', caption: 'De noche', wide: true },
];

export default async function FarmaciaPage() {
  const [store, insurers] = await Promise.all([getStore(), getInsurers()]);
  const info = store?.info;

  return (
    <div className="mb-tabbar">

      <DayNight />

      <section id="horarios" className="container-x scroll-mt-24 py-16 lg:py-24" aria-labelledby="horarios-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 id="horarios-title" className="display-2 text-ink">
              Horarios
            </h2>
            <p className="mt-3 max-w-[46ch] text-ink-soft">En temporada de verano extendemos el horario. Por WhatsApp te respondemos dentro de estos horarios.</p>
            <div className="mt-8">
              <HoursTable />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <MapEmbed lat={info?.lat} lng={info?.lng} label={info ? `${info.address}, ${info.city}` : 'Villa Gesell'} />
            {info && (
              <div className="grid gap-2.5 sm:grid-cols-3">
                <ExternalButton href={info.mapsUrl} icon={<Navigation className="size-4" />}>
                  Cómo llegar
                </ExternalButton>
                <ExternalButton href={waLink(info.whatsapp, '¡Hola! Quería hacer una consulta.')} variant="secondary" icon={<WhatsAppIcon className="size-4" />}>
                  WhatsApp
                </ExternalButton>
                <a href={`tel:+54${info.phone.replace(/\D/g, '')}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 font-semibold text-ink ring-1 ring-line hover:bg-mist">
                  <Phone className="size-4" />
                  <span className="tabular">{prettyPhone(info.phone)}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-mist py-16 lg:py-24" aria-labelledby="fotos-title">
        <div className="container-x">
          <h2 id="fotos-title" className="display-2 text-ink">
            Pasá a conocernos
          </h2>
          <p className="mt-3 max-w-[50ch] text-ink-soft">Un local amplio y luminoso, con estacionamiento en la puerta y todo a la vista.</p>
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {PHOTOS.map((ph, i) => (
              <ParallaxItem key={ph.src} offset={i % 2 ? 36 : -18} className={ph.wide ? 'col-span-2' : undefined}>
                <figure className="group relative overflow-hidden rounded-[1.5rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ph.src}
                    alt={ph.alt}
                    loading="lazy"
                    decoding="async"
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${ph.wide ? 'aspect-[4/3] lg:aspect-[8/5]' : 'aspect-[3/4] lg:aspect-[4/5]'}`}
                  />
                  <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink backdrop-blur-md">{ph.caption}</figcaption>
                </figure>
              </ParallaxItem>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="rounded-[2rem] bg-night p-8 text-white lg:p-10">
          <h2 className="display-3">Obras sociales y prepagas</h2>
          <p className="mt-3 text-white/70">Trabajamos con {insurers.length} coberturas, entre ellas IOMA, PAMI, OSDE, Swiss Medical, Galeno y OSECAC.</p>
          <Link href="/obras-sociales" className="group mt-6 inline-flex items-center gap-2 font-semibold text-aqua">
            Ver todas y buscar la mía
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="rounded-[2rem] bg-foam p-8 lg:p-10">
          <h2 className="display-3 text-ink">Pedidos por WhatsApp</h2>
          <p className="mt-3 text-ink-soft">Armá tu pedido en la web o escribinos directo. Lo preparamos y te lo llevamos a domicilio sin cargo.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {info && (
              <ExternalButton href={waLink(info.whatsapp, '¡Hola! Quiero hacer un pedido.')} icon={<WhatsAppIcon className="size-4" />}>
                Escribinos
              </ExternalButton>
            )}
            {info && (
              <ExternalButton href={info.instagramUrl} variant="secondary" icon={<InstagramIcon className="size-4" />}>
                Instagram
              </ExternalButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
