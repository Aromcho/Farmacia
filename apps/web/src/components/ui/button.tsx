import Link from 'next/link';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'light' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-out-expo active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary: 'bg-teal-strong text-white shadow-[0_1px_0_rgb(255_255_255/0.2)_inset,0_6px_18px_-6px_rgb(0_119_131/0.6)] hover:bg-teal-deep',
  secondary: 'bg-white text-ink ring-1 ring-line hover:ring-teal/40 hover:bg-mist',
  ghost: 'text-ink hover:bg-foam',
  glass: 'bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/18',
  light: 'bg-white text-ink hover:bg-foam shadow-float',
  danger: 'bg-[#b42318] text-white hover:bg-[#912018]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-13 px-7 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size; icon?: ReactNode };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, icon, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
});

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function LinkButton({ variant = 'primary', size = 'md', className, icon, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

/** Enlace externo con estilo de botón (WhatsApp, Maps, Instagram) */
export function ExternalButton({
  variant = 'primary',
  size = 'md',
  className,
  icon,
  children,
  ...rest
}: ComponentProps<'a'> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <a target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </a>
  );
}
