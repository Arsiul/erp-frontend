import { type ReactNode } from 'react';

import { cn } from '@/utils/cn';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeAppearance = 'solid' | 'soft';

const TONES: Record<BadgeTone, Record<BadgeAppearance, string>> = {
  success: { solid: 'bg-emerald-500 text-white', soft: 'bg-emerald-50 text-emerald-700' },
  warning: { solid: 'bg-amber-500 text-white', soft: 'bg-amber-50 text-amber-700' },
  danger: { solid: 'bg-rose-500 text-white', soft: 'bg-rose-50 text-rose-700' },
  info: { solid: 'bg-indigo-500 text-white', soft: 'bg-indigo-50 text-indigo-700' },
  neutral: { solid: 'bg-slate-400 text-white', soft: 'bg-slate-100 text-slate-600' },
  primary: { solid: 'bg-primary-600 text-white', soft: 'bg-primary-50 text-primary-700' },
};

export interface BadgeProps {
  tone?: BadgeTone;
  appearance?: BadgeAppearance;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', appearance = 'soft', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] leading-5 font-semibold whitespace-nowrap',
        TONES[tone][appearance],
        className,
      )}
    >
      {children}
    </span>
  );
}
