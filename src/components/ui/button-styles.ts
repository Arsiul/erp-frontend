import { cn } from '@/utils/cn';

const VARIANTS = {
  primary: 'bg-primary-700 text-white shadow-sm hover:bg-primary-800 active:bg-primary-900',
  outline:
    'border-[1.5px] border-primary-700 bg-white text-primary-700 hover:bg-primary-50 active:bg-primary-100',
  soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
} as const;

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

/** Clases de botón reutilizables también en enlaces (<Link>) que deben verse como botón. */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
