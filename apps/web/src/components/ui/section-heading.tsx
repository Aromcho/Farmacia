import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function SectionHeading({
  title,
  text,
  href,
  linkLabel = 'Ver todo',
  className,
  tone = 'light',
  id,
}: {
  title: string;
  text?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  tone?: 'light' | 'dark';
  id?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-6', className)}>
      <div className="max-w-2xl">
        <h2 id={id} className={cn('display-2 text-balance', tone === 'dark' ? 'text-white' : 'text-ink')}>
          {title}
        </h2>
        {text && <p className={cn('mt-3 max-w-[52ch] text-[1.02rem] leading-relaxed', tone === 'dark' ? 'text-white/70' : 'text-ink-soft')}>{text}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            'group hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:inline-flex',
            tone === 'dark' ? 'text-white hover:bg-white/10' : 'text-teal-strong hover:bg-foam',
          )}
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
