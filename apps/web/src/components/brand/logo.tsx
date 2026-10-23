import { cn } from '@/lib/cn';

/**
 * Isotipo de la farmacia: cruz tritono + sonrisa (redibujado en SVG a partir del logo).
 * - brazo superior: aqua · brazo derecho: menta · resto: teal
 */
export function LogoMark({ className, mono }: { className?: string; mono?: 'white' | 'ink' }) {
  const teal = mono === 'white' ? '#ffffff' : mono === 'ink' ? '#0e3b3f' : '#009cac';
  const aqua = mono === 'white' ? 'rgba(255,255,255,.72)' : mono === 'ink' ? '#3d6468' : '#54c4cf';
  const mint = mono === 'white' ? 'rgba(255,255,255,.86)' : mono === 'ink' ? '#5b7f82' : '#6cc4c0';
  return (
    <svg viewBox="0 0 108 140" className={cn('shrink-0', className)} aria-hidden="true">
      {/* brazo izquierdo + centro + brazo inferior */}
      <path d="M35 32h38v68.6a4 4 0 0 1-4 4H39a4 4 0 0 1-4-4V70H4a4 4 0 0 1-4-4V36a4 4 0 0 1 4-4h31Z" fill={teal} />
      {/* brazo superior */}
      <path d="M39 0h30a4 4 0 0 1 4 4v28H35V4a4 4 0 0 1 4-4Z" fill={aqua} />
      {/* brazo derecho */}
      <path d="M73 32h31a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H73Z" fill={mint} />
      {/* sonrisa */}
      <path d="M8 104.5c10 34 82 34 92 0" fill="none" stroke={teal} strokeWidth="12.5" strokeLinecap="round" />
    </svg>
  );
}

/** Logotipo horizontal: isotipo + "Amancio Fernández" + bajada */
export function Logo({
  className,
  tone = 'color',
  compact,
}: {
  className?: string;
  tone?: 'color' | 'white';
  compact?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="h-9 w-auto" mono={tone === 'white' ? 'white' : undefined} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'text-[0.95rem] font-extrabold tracking-[0.06em] uppercase',
              tone === 'white' ? 'text-white' : 'text-teal-strong',
            )}
          >
            Amancio Fernández
          </span>
          <span className={cn('mt-1 text-[0.72rem] font-medium tracking-[0.02em]', tone === 'white' ? 'text-white/70' : 'text-ink-soft')}>
            farmacia &amp; bienestar
          </span>
        </span>
      )}
    </span>
  );
}
