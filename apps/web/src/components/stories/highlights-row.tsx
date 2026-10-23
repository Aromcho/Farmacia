'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Img } from '@/components/ui/img';
import { cn } from '@/lib/cn';
import type { Highlight } from '@/lib/types';
import { StoryViewer } from './story-viewer';

const SEEN_KEY = 'af_historias_vistas';

/** Fila de historias destacadas (círculos como en el perfil de Instagram) */
export function HighlightsRow({ highlights, tone = 'dark', className }: { highlights: Highlight[]; tone?: 'dark' | 'light'; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      setSeen(new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')));
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
      } catch {
        /* sin almacenamiento */
      }
      return next;
    });
  }, []);

  const list = highlights.filter((h) => h.items.length > 0);
  if (!list.length) return null;

  return (
    <>
      <ul className={cn('scroll-x gap-4 pb-1', className)} aria-label="Historias destacadas">
        {list.map((h, i) => {
          const isSeen = seen.has(h.id);
          return (
            <motion.li
              key={h.id}
              className="shrink-0"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <button type="button" onClick={() => setOpen(i)} className="group flex w-[4.6rem] flex-col items-center gap-2 lg:w-20" aria-label={`Ver historias: ${h.title}`}>
                <span
                  className={cn(
                    'relative grid size-[4.4rem] place-items-center rounded-full p-[2.5px] transition-transform duration-300 ease-out-expo group-active:scale-95 lg:size-[4.8rem]',
                    isSeen ? (tone === 'dark' ? 'bg-white/25' : 'bg-line') : 'bg-[conic-gradient(from_200deg,#54c4cf,#009cac,#6cc4c0,#f5b83d,#54c4cf)]',
                  )}
                >
                  <span className={cn('block size-full overflow-hidden rounded-full p-[2.5px]', tone === 'dark' ? 'bg-night' : 'bg-white')}>
                    <Img media={h.cover ?? h.items[0]?.media} sizes="80px" className="size-full rounded-full" imgClassName="transition-transform duration-500 group-hover:scale-110" />
                  </span>
                </span>
                <span className={cn('line-clamp-1 max-w-full text-center text-[0.74rem] font-medium', tone === 'dark' ? 'text-white/80' : 'text-ink-soft')}>
                  {h.title}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      <AnimatePresence>
        {open !== null && <StoryViewer key="viewer" highlights={list} startIndex={open} onClose={() => setOpen(null)} onSeen={markSeen} />}
      </AnimatePresence>
    </>
  );
}
