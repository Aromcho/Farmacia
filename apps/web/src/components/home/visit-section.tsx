'use client';

import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { statusText, useStore } from '@/components/site/store-provider';
import { LedDot } from '@/components/site/status-pill';
import { ExternalButton } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/ui/icons';
import { ParallaxBg } from '@/components/ui/parallax';
import { cn } from '@/lib/cn';
import { groupWeek, prettyPhone, waLink } from '@/lib/format';

/** Visitanos: médanos de la costa en parallax, horarios de hoy y cómo llegar */
export function VisitSection() {
  const { info, hours } = useStore();
  const s = statusText(hours);
  const week = hours?.weeks[hours.season] ?? [];
  return (
    <section id="visitanos" className="relative isolate overflow-hidden pb-16 pt-56 sm:py-20 lg:py-28" aria-labelledby="visit-title">
      <ParallaxBg strength={0.18} className="-z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/costa.webp" alt="" className="size-full object-cover" loading="lazy" decoding="async" />
      </ParallaxBg>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night/30 via-night/10 to-night/55" />
      <div className="container-x">
        <div className="max-w-xl rounded-[2rem] bg-white/92 p-6 shadow-lift ring-1 ring-white/60 backdrop-blur-xl sm:p-8 lg:ml-auto">
          <p className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-ink">
            <LedDot on={s.open} warn={s.soon} />
            <span className="tabular">{s.long}</span>
          </p>
          <h2 id="visit-title" className="display-3 mt-3 text-ink">
            Te esperamos en 106 y Boulevard
          </h2>
          {info && (
            <p className="mt-2 flex items-start gap-2 text-ink-soft">
              <MapPin className="mt-1 size-4 shrink-0 text-teal-strong" aria-hidden="true" />
              {info.address}, {info.city}
            </p>
          )}
          <div className="mt-6 rounded-2xl bg-mist p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock className="size-4 text-teal-strong" aria-hidden="true" />
              Horarios {hours?.season === 'SUMMER' ? 'de verano' : ''}
            </p>
            <dl className="mt-3 space-y-1 text-[0.92rem]">
              {groupWeek(week).map((g) => {
                const today = hours ? g.weekdays.includes(hours.weekday) : false;
                return (
                  <div key={g.label} className={cn('rounded-xl px-3 py-2', today && 'bg-white shadow-sm ring-1 ring-line')}>
                    <dt className={cn('text-[0.8rem]', today ? 'font-semibold text-teal-strong' : 'text-ink-soft')}>
                      {g.label}
                      {today && ' · hoy'}
                    </dt>
                    <dd className="tabular font-semibold text-ink">{g.text}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
          {info && (
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <ExternalButton href={info.mapsUrl} icon={<Navigation className="size-4" />}>
                Cómo llegar
              </ExternalButton>
              <ExternalButton href={waLink(info.whatsapp, '¡Hola! Quería hacer una consulta.')} variant="secondary" icon={<WhatsAppIcon className="size-4" />}>
                WhatsApp
              </ExternalButton>
              <a href={`tel:+54${info.phone.replace(/\D/g, '')}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[0.95rem] font-semibold text-ink ring-1 ring-line transition hover:bg-mist">
                <Phone className="size-4" aria-hidden="true" />
                <span className="tabular">{prettyPhone(info.phone)}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
