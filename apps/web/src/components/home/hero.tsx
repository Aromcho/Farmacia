'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LedCross } from '@/components/brand/led-cross';
import { statusText, useStore } from '@/components/site/store-provider';
import { LedDot } from '@/components/site/status-pill';
import { HighlightsRow } from '@/components/stories/highlights-row';
import { ExternalButton, LinkButton } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/ui/icons';
import { waLink } from '@/lib/format';
import type { Highlight } from '@/lib/types';

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Hero: la cruz LED encendida sobre luz que cae en el agua (video de Kling),
 * con parallax en tres planos: fondo lento, cruz media, texto rápido.
 */
export function Hero({ highlights, video }: { highlights: Highlight[]; video?: { src: string; poster: string } | null }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { hours, info } = useStore();
  const s = statusText(hours);
  const [videoOk, setVideoOk] = useState(true);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.18]);
  const crossY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    if (!video) setVideoOk(false);
  }, [video]);

  const wa = waLink(info?.whatsapp, '¡Hola! Quiero hacer una consulta 😊');

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-night text-white" aria-labelledby="hero-title">
      {/* plano 1: luz bajo el agua */}
      <motion.div style={reduce ? undefined : { y: bgY, scale: bgScale }} className="absolute inset-0 -z-10 will-change-transform" aria-hidden="true">
        {video && videoOk ? (
          <video
            className="size-full object-cover opacity-80"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={video.poster}
            onError={() => setVideoOk(false)}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        ) : (
          <div className="size-full bg-[radial-gradient(120%_70%_at_50%_0%,#1f7d86_0%,#0a383d_45%,#052a2e_100%)]" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_38%,transparent_0%,rgb(5_42_46/0.55)_70%,rgb(5_42_46/0.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night via-night/80 to-transparent" />
      </motion.div>

      <div className="container-x relative grid min-h-[calc(100svh-var(--tabbar-h))] grid-cols-[minmax(0,1fr)] lg:min-h-[100svh] grid-rows-[1fr_auto] pb-6 pt-[calc(var(--header-h)+env(safe-area-inset-top)+12px)] lg:pb-10">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* plano 2: la cruz */}
          <motion.div style={reduce ? undefined : { y: crossY }} className="mx-auto w-[min(40vw,10.5rem)] sm:w-[14rem] lg:order-2 lg:w-[min(24vw,20rem)]">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease }}>
              <LedCross lit={s.open} />
            </motion.div>
          </motion.div>

          {/* plano 3: el texto */}
          <motion.div style={reduce ? undefined : { y: textY, opacity: fade }} className="text-center lg:order-1 lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7, ease }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[0.82rem] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md"
            >
              <LedDot on={s.open} warn={s.soon} />
              <span className="tabular">{s.long}</span>
            </motion.p>
            <h1 id="hero-title" className="display-1 mt-4 text-balance lg:mt-6">
              {['Más de 60 años', 'cuidándote.'].map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <motion.span className="block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.5 + i * 0.12, duration: 1, ease }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease }}
              className="mx-auto mt-4 max-w-[34ch] text-[1rem] leading-relaxed text-white/75 lg:mx-0 lg:mt-5 lg:text-lg"
            >
              Farmacia, perfumería y herboristería en Villa Gesell. Pedís por WhatsApp y te lo llevamos sin cargo.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.8, ease }}
              className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-center lg:mt-8 lg:justify-start"
            >
              <LinkButton href="/catalogo" size="lg" variant="light" className="group px-5">
                Ver productos
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </LinkButton>
              <ExternalButton href={wa} size="lg" variant="glass" className="px-5" icon={<WhatsAppIcon className="size-5" />}>
                Escribinos
              </ExternalButton>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-7 min-w-0 lg:mt-10">
          <HighlightsRow highlights={highlights} className="-mx-5 px-5 md:mx-0 md:px-0 lg:justify-start" />
        </div>
      </div>
    </section>
  );
}
