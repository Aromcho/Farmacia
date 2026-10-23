'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { statusText, useStore } from './store-provider';

/** Pastilla "Abierto ahora" con un LED que late (verde-teal abierto, ámbar cerrado) */
export function StatusPill({ tone = 'light', className, detailed }: { tone?: 'light' | 'dark'; className?: string; detailed?: boolean }) {
  const { hours } = useStore();
  const s = statusText(hours);
  return (
    <Link
      href="/farmacia#horarios"
      className={cn(
        'group inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-3 text-[0.8rem] font-semibold transition-colors',
        tone === 'dark' ? 'bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-white/15' : 'bg-white text-ink ring-1 ring-line hover:ring-teal/40',
        className,
      )}
      aria-label={`${s.long}. Ver horarios`}
    >
      <LedDot on={s.open} warn={s.soon} />
      <span className="tabular">{detailed ? s.long : s.short}</span>
    </Link>
  );
}

export function LedDot({ on, warn, className }: { on: boolean; warn?: boolean; className?: string }) {
  const color = on ? (warn ? '#f5b83d' : '#22c7b8') : '#e0884f';
  return (
    <span className={cn('relative inline-flex size-2.5', className)} aria-hidden="true">
      {on && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} />}
      <span className="relative inline-flex size-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
    </span>
  );
}
