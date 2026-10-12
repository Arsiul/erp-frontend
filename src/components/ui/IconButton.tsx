import { type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Texto accesible obligatorio: el botón solo muestra un ícono. */
  label: string;
  icon: ReactNode;
  /** Número a mostrar en la esquina; 0 o undefined lo ocultan. */
  badge?: number;
}

export function IconButton({
  label,
  icon,
  badge,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const hasBadge = badge !== undefined && badge > 0;

  return (
    <button
      type={type}
      aria-label={hasBadge ? `${label} (${badge})` : label}
      className={cn(
        'relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-ink-muted transition-colors duration-150 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 data-[state=open]:border-primary-200 data-[state=open]:bg-primary-50 data-[state=open]:text-primary-700',
        className,
      )}
      {...props}
    >
      {icon}
      {hasBadge && (
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-white"
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
