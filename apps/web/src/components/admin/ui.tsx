'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Check, Loader2, Trash2, X } from 'lucide-react';
import { forwardRef, useEffect, useId, useState, type ComponentProps, type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/cn';

export function PageHeader({ title, text, actions }: { title: string; text?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div>
        <h1 className="font-serif text-[1.9rem] leading-tight text-ink lg:text-[2.3rem]">{title}</h1>
        {text && <p className="mt-1 max-w-2xl text-ink-soft">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, title, actions }: { className?: string; children: ReactNode; title?: string; actions?: ReactNode }) {
  return (
    <section className={cn('rounded-[1.5rem] bg-white p-5 shadow-[0_1px_2px_rgb(14_59_63/0.05)] ring-1 ring-line lg:p-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[1.02rem] font-semibold text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-[#b42318]">{error}</span>}
    </label>
  );
}

const control = 'w-full rounded-xl bg-white px-3.5 text-[0.95rem] text-ink outline-none ring-1 ring-line transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-teal-strong disabled:bg-mist';

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, 'h-11', className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(control, 'py-2.5 leading-relaxed', className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(control, 'h-11 pr-8', className)} {...p} />;
});

/** Precio en pesos: muestra con separador de miles y guarda número entero */
export function MoneyInput({ value, onChange, placeholder }: { value: number | null | undefined; onChange: (v: number | null) => void; placeholder?: string }) {
  const [text, setText] = useState(value != null ? value.toLocaleString('es-AR') : '');
  useEffect(() => {
    setText(value != null ? value.toLocaleString('es-AR') : '');
  }, [value]);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">$</span>
      <input
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          setText(digits ? Number(digits).toLocaleString('es-AR') : '');
          onChange(digits ? Number(digits) : null);
        }}
        className={cn(control, 'tabular h-11 pl-7')}
      />
    </div>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl py-2 text-left">
      <span>
        <span className="block text-[0.95rem] font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-teal-strong' : 'bg-line')}>
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 35 }} className={cn('absolute top-1 size-5 rounded-full bg-white shadow', checked ? 'right-1' : 'left-1')} />
      </span>
    </button>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'sun' | 'red' | 'ink'; className?: string }) {
  const tones = {
    neutral: 'bg-foam text-ink-soft',
    teal: 'bg-[#d5efef] text-teal-deep',
    sun: 'bg-sun-soft text-[#7a5200]',
    red: 'bg-[#fde8e6] text-[#912018]',
    ink: 'bg-ink text-white',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-ink-soft', className)} aria-label="Cargando" />;
}

export function LoadingBlock() {
  return (
    <div className="grid place-items-center py-24">
      <Spinner className="size-7" />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <p className="font-serif text-xl text-ink">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Botón de borrar en dos pasos: el primer toque pide confirmación */
export function DeleteButton({ onConfirm, label = 'Eliminar', pending, compact }: { onConfirm: () => void; label?: string; pending?: boolean; compact?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) onConfirm();
        else setArmed(true);
      }}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors',
        compact ? 'w-10' : 'px-4',
        armed ? 'bg-[#b42318] text-white' : 'text-[#b42318] hover:bg-[#fde8e6]',
        compact && armed && 'w-auto px-3',
      )}
      aria-label={armed ? '¿Confirmás? Tocá de nuevo para eliminar' : label}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      {(!compact || armed) && <span>{armed ? '¿Seguro?' : label}</span>}
    </button>
  );
}

/** Panel lateral (escritorio) / hoja inferior (móvil) para editar */
export function EditorDrawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const fn = () => setDesktop(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} direction={desktop ? 'right' : 'bottom'}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-night/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            'fixed z-[61] flex flex-col bg-white outline-none',
            desktop ? 'inset-y-3 right-3 w-[min(36rem,calc(100vw-1.5rem))] rounded-[1.75rem] shadow-lift' : 'inset-x-0 bottom-0 max-h-[94dvh] rounded-t-[1.75rem]',
          )}
          data-lenis-prevent
        >
          {!desktop && <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-line" />}
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <Drawer.Title className="font-serif text-xl text-ink">{title}</Drawer.Title>
            <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-mist" aria-label="Cerrar">
              <X className="size-5" />
            </button>
          </div>
          <Drawer.Description className="sr-only">{title}</Drawer.Description>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="border-t border-line px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function SaveBar({ dirty, saving, onSave, onReset, label = 'Guardar cambios' }: { dirty: boolean; saving?: boolean; onSave: () => void; onReset?: () => void; label?: string }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl items-center justify-end gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-white shadow-lift sm:justify-between lg:left-[calc(16rem+1.5rem)]"
        >
          <span className="text-sm font-medium max-sm:hidden">Tenés cambios sin guardar</span>
          <span className="flex gap-1.5">
            {onReset && (
              <button type="button" onClick={onReset} className="h-10 rounded-full px-4 text-sm font-semibold text-white/80 hover:text-white">
                Descartar
              </button>
            )}
            <button type="button" onClick={onSave} disabled={saving} className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-sm font-semibold text-ink disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {label}
            </button>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SegmentedTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  const id = useId();
  return (
    <div className="scroll-x gap-1.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('relative shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors', value === o.value ? 'text-white' : 'bg-white text-ink-soft ring-1 ring-line hover:text-ink')}
        >
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}
          <span className="relative">
            {o.label}
            {o.count !== undefined && <span className={cn('tabular ml-1.5', value === o.value ? 'text-white/70' : 'text-ink-soft/70')}>{o.count}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
