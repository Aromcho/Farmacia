import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ParallaxBg } from '@/components/ui/parallax';
import type { Insurer } from '@/lib/types';

/** Obras sociales: la pregunta más frecuente antes de venir con una receta */
export function InsurersTeaser({ insurers }: { insurers: Insurer[] }) {
  if (!insurers.length) return null;
  return (
    <section className="relative isolate overflow-hidden py-16 lg:py-24" aria-labelledby="obras-title">
      <ParallaxBg strength={0.12} className="-z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/botanica.webp" alt="" className="size-full object-cover opacity-70" loading="lazy" decoding="async" />
      </ParallaxBg>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/85 to-white/40" />
      <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <h2 id="obras-title" className="display-2 text-balance text-ink">
            Atendemos {insurers.length} obras sociales y prepagas
          </h2>
          <p className="mt-4 max-w-[44ch] text-[1.05rem] leading-relaxed text-ink-soft">
            Traé tu receta y tu credencial. Si no encontrás tu obra social en la lista, escribinos por WhatsApp y te decimos cómo hacemos.
          </p>
          <Link href="/obras-sociales" className="group mt-7 inline-flex items-center gap-2 font-semibold text-teal-strong">
            Buscar mi obra social
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Obras sociales">
          {insurers.map((x) => (
            <li key={x.id} title={x.fullName ?? undefined} className="rounded-full bg-white/90 px-3.5 py-2 text-[0.86rem] font-semibold text-ink shadow-[0_1px_2px_rgb(14_59_63/0.08)] ring-1 ring-line backdrop-blur">
              {x.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
