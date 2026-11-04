'use client';

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { cn } from '@/lib/cn';
import { StatusPill } from './status-pill';

/* Secuencia de cuadros del timelapse día → noche (Kling 3.0, cámara fija) */
const FRAMES = 48;
const SEQ = {
  desktop: { dir: '/media/nosotros/seq/d', focusX: 0.6 },
  mobile: { dir: '/media/nosotros/seq/m', focusX: 0.5 },
};
const frameUrl = (dir: string, i: number) => `${dir}/${String(i + 1).padStart(3, '0')}.webp`;
/** Orden de carga: extremos y después cada 8, 4, 2 y 1 cuadros (el scroll funciona enseguida y se va afinando) */
const loadOrder = () => {
  const seen = new Set<number>([0, FRAMES - 1]);
  const out = [0, FRAMES - 1];
  for (const step of [8, 4, 2, 1])
    for (let i = 0; i < FRAMES; i += step)
      if (!seen.has(i)) {
        seen.add(i);
        out.push(i);
      }
  return out;
};

/** Minutos desde 08:30 (510) hasta 21:00 (1260) */
const toClock = (p: number) => {
  const m = Math.round((510 + (1260 - 510) * p) / 5) * 5;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const STEPS = [
  { at: 0, heading: 'h1' as const, title: 'Más de 60 años cuidándote en Villa Gesell', text: 'Atención cercana, profesional y de confianza en Paseo 106 y Boulevard. Medicamentos, perfumería, dermocosmética y herboristería.' },
  { at: 0.34, heading: 'h2' as const, title: 'Abrimos temprano, cerramos tarde', text: 'De lunes a sábado, con horario extendido en verano. Estacionás en la puerta y te atendemos enseguida.' },
  { at: 0.72, heading: 'h2' as const, title: 'Y de noche, la cruz encendida', text: 'Cuando se prende el verde, estamos. Por WhatsApp te respondemos dentro del horario.' },
];

function useFrameSequence(canvasRef: RefObject<HTMLCanvasElement | null>, progress: MotionValue<number>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const { dir, focusX } = mobile ? SEQ.mobile : SEQ.desktop;
    const imgs: (HTMLImageElement | null)[] = Array(FRAMES).fill(null);
    let alive = true;
    let raf = 0;

    const nearest = (i: number, step: 1 | -1) => {
      for (let k = i; k >= 0 && k < FRAMES; k += step) if (imgs[k]) return k;
      return -1;
    };
    const cover = (img: HTMLImageElement, alpha: number) => {
      const W = cv.width;
      const H = cv.height;
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (W - w) * focusX, (H - h) / 2, w, h);
    };
    const draw = () => {
      raf = 0;
      const f = progress.get() * (FRAMES - 1);
      const a = nearest(Math.floor(f), -1);
      const b = nearest(Math.ceil(f), 1);
      if (a < 0 && b < 0) return;
      cover(imgs[a < 0 ? b : a]!, 1);
      // fundido entre cuadros vecinos para que el scroll se sienta continuo
      if (a >= 0 && b > a) {
        const t = (f - a) / (b - a);
        if (t > 0.01) cover(imgs[b]!, t);
      }
      ctx.globalAlpha = 1;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      schedule();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const unsub = progress.on('change', schedule);

    const queue = loadOrder();
    let loaded = 0;
    const next = () => {
      const i = queue.shift();
      if (i === undefined || !alive) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!alive) return;
        imgs[i] = img;
        loaded++;
        if (loaded === 2) setReady(true);
        schedule();
        next();
      };
      img.onerror = next;
      img.src = frameUrl(dir, i);
    };
    for (let k = 0; k < 4; k++) next();

    return () => {
      alive = false;
      ro.disconnect();
      unsub();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [canvasRef, progress]);
  return ready;
}

/**
 * Portada de "La farmacia": la fachada pasa de día a noche con el scroll
 * (timelapse cuadro a cuadro sobre canvas) y el reloj recorre el horario.
 */
export function DayNight() {
  const ref = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useTransform(scrollYProgress, [0.04, 0.9], [0, 1], { clamp: true });
  const ready = useFrameSequence(canvas, p);

  // respaldo mientras cargan los cuadros (o si fallan): fundido entre las dos fotos
  const night = useTransform(p, [0.4, 0.8], [0, 1]);
  const zoom = useTransform(scrollYProgress, [0, 1], [1.06, 1]);
  const glow = useTransform(p, [0.62, 0.9], [0, 1]);
  const cue = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  const [clock, setClock] = useState('08:30');
  const [step, setStep] = useState(0);
  useMotionValueEvent(p, 'change', (v) => {
    setClock(toClock(v));
    setStep(STEPS.reduce((acc, s, i) => (v >= s.at ? i : acc), 0));
  });
  const isNight = step === 2;

  return (
    <section ref={ref} className="relative h-[300svh] bg-night text-white lg:h-[340svh]" aria-label="La farmacia, de día y de noche">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Imagen */}
        <div className="absolute inset-x-0 top-0 h-[64svh] overflow-hidden md:inset-0 md:h-auto">
          <motion.div style={{ scale: reduce ? 1 : zoom }} className="absolute inset-0 origin-[60%_45%]">
            <div className={cn('absolute inset-0 transition-opacity duration-700', ready && 'opacity-0')}>
              <picture>
                <source media="(max-width: 767px)" srcSet="/media/nosotros/dia-sm.webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/nosotros/dia.webp" alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover object-[64%_50%] md:object-[60%_50%]" />
              </picture>
              <motion.picture style={{ opacity: night }} className="absolute inset-0">
                <source media="(max-width: 767px)" srcSet="/media/nosotros/noche-sm.webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/nosotros/noche.webp" alt="" className="absolute inset-0 size-full object-cover object-[64%_50%] md:object-[60%_50%]" />
              </motion.picture>
            </div>
            <canvas
              ref={canvas}
              role="img"
              aria-label="Fachada de la farmacia en Paseo 106 y Boulevard, que pasa del día a la noche con el cartel verde encendido"
              className={cn('absolute inset-0 size-full transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}
            />
            {/* halo verde del cartel */}
            <motion.div
              style={{ opacity: glow }}
              className="pointer-events-none absolute left-[36%] top-[38%] h-[24%] w-[54%] rounded-full bg-[radial-gradient(closest-side,rgb(60_255_170/0.3),transparent)] mix-blend-screen blur-2xl max-md:left-[10%] max-md:w-[84%]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-night/40 md:bg-[linear-gradient(90deg,rgb(5_42_46/0.9)_0%,rgb(5_42_46/0.5)_36%,transparent_62%),linear-gradient(0deg,rgb(5_42_46/0.6)_0%,transparent_35%),linear-gradient(180deg,rgb(5_42_46/0.45)_0%,transparent_22%)]" />
        </div>

        {/* Texto */}
        <div className="container-x relative flex h-full flex-col justify-end pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.25rem)] md:pb-12 lg:pb-20">
          <div className="flex items-end justify-between gap-8">
            <div className="w-full max-w-xl lg:max-w-[34rem]">
              <div className="flex items-center gap-4">
                <p
                  className={cn(
                    'tabular font-serif text-[2.6rem] leading-none tracking-tight transition-[color,text-shadow] duration-700 lg:text-[4.25rem]',
                    isNight ? 'text-[#8dffcf] [text-shadow:0_0_28px_rgb(60_255_170/0.55)]' : 'text-white',
                  )}
                  aria-hidden="true"
                >
                  {clock}
                </p>
                <StatusPill tone="dark" detailed className="max-sm:hidden" />
              </div>
              <div className="relative mt-3 grid lg:mt-5">
                {STEPS.map((s, i) => {
                  const H = s.heading;
                  return (
                    <motion.div
                      key={s.title}
                      initial={false}
                      animate={{ opacity: step === i ? 1 : 0, y: reduce ? 0 : step === i ? 0 : step > i ? -16 : 16 }}
                      transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={cn('col-start-1 row-start-1', step !== i && 'pointer-events-none')}
                    >
                      <H className={cn('text-balance', 'display-2')}>{s.title}</H>
                      <p className="mt-3 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/80 lg:text-[1.08rem]">{s.text}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* línea del horario */}
            <div className="hidden shrink-0 flex-col items-center gap-3 text-xs font-semibold text-white/60 md:flex" aria-hidden="true">
              <span className="tabular">08:30</span>
              <div className="h-56 w-1 overflow-hidden rounded-full bg-white/15">
                <motion.div style={{ scaleY: p }} className="h-full w-full origin-top rounded-full bg-gradient-to-b from-sun via-[#e38b5a] to-[#3cffaa]" />
              </div>
              <span className="tabular">21:00</span>
            </div>
          </div>
        </div>

        {/* indicador para scrollear */}
        <motion.div style={{ opacity: cue }} className="pointer-events-none absolute inset-x-0 bottom-8 hidden justify-center md:flex" aria-hidden="true">
          <span className="flex h-9 w-6 justify-center rounded-full ring-1 ring-white/50">
            <motion.span animate={reduce ? undefined : { y: [2, 12, 2], opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="mt-1.5 block h-2 w-1 rounded-full bg-white" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
