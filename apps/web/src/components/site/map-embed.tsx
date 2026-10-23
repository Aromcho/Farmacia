'use client';

import { MapPin } from 'lucide-react';
import { useState } from 'react';

/** Mapa de Google que se carga recién cuando la persona lo pide (no pesa al abrir la página) */
export function MapEmbed({ lat, lng, label }: { lat?: number; lng?: number; label: string }) {
  const [show, setShow] = useState(false);
  const q = lat && lng ? `${lat},${lng}` : encodeURIComponent(label);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-foam ring-1 ring-line lg:aspect-auto lg:h-full lg:min-h-[22rem]">
      {show ? (
        <iframe title={`Mapa: ${label}`} src={`https://www.google.com/maps?q=${q}&z=16&output=embed`} className="absolute inset-0 size-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <button type="button" onClick={() => setShow(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_45%,#d5efef_0,#eaf7f7_45%,#f5fbfb_100%)]">
          <span className="relative grid size-16 place-items-center rounded-full bg-teal-strong text-white shadow-lift transition-transform group-hover:scale-105">
            <span className="absolute inset-0 animate-ping rounded-full bg-teal/40" />
            <MapPin className="relative size-7" />
          </span>
          <span className="font-semibold text-ink">Ver mapa</span>
          <span className="text-sm text-ink-soft">{label}</span>
        </button>
      )}
    </div>
  );
}
