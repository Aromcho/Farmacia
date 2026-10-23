import { ParallaxBg } from '@/components/ui/parallax';
import { LinkButton } from '@/components/ui/button';
import { DropIcon } from '@/components/ui/icons';

const STEPS = [
  { title: 'Elegí la fragancia', text: 'De diseñador o árabe, entre las que tenemos disponibles en decant.' },
  { title: 'La fraccionamos del frasco original', text: 'Con jeringa y guantes, frente a vos, en un atomizador limpio.' },
  { title: 'Llevala a todos lados', text: 'Un formato chico y práctico para probarla antes de comprar el frasco grande.' },
];

/** Decants: explicar el servicio, que es nuevo para mucha gente */
export function DecantsFeature() {
  return (
    <section className="relative isolate overflow-hidden bg-night text-white" aria-labelledby="decants-title">
      <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div className="relative order-2 aspect-[4/5] overflow-hidden rounded-[2rem] lg:order-1">
          <ParallaxBg strength={0.12}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/decants.webp" alt="" className="size-full object-cover" loading="lazy" decoding="async" />
          </ParallaxBg>
          <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10" />
        </div>
        <div className="order-1 lg:order-2">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 text-aqua ring-1 ring-white/15">
            <DropIcon className="size-6" />
          </span>
          <h2 id="decants-title" className="display-2 mt-6 text-balance">
            Tu perfume favorito, ahora también en decant
          </h2>
          <p className="mt-4 max-w-[46ch] text-[1.05rem] leading-relaxed text-white/70">
            Una forma práctica de probar perfumes originales, llevar tus favoritos siempre con vos y descubrir cuál va realmente con tu estilo.
          </p>
          <ol className="mt-9 space-y-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="tabular grid size-9 shrink-0 place-items-center rounded-full border border-aqua/40 font-serif text-lg text-aqua">{i + 1}</span>
                <span>
                  <span className="block font-semibold text-white">{s.title}</span>
                  <span className="mt-1 block text-[0.95rem] leading-relaxed text-white/65">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <LinkButton href="/catalogo?decant=true" variant="light" size="lg" className="mt-10">
            Ver perfumes con decant
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
