import { Cloud } from 'lucide-react';
import { Link } from 'react-router';

import { APP_INFO, COMPANY_INFO } from '@/config/app';
import { cn } from '@/utils/cn';

export interface BrandProps {
  /** En escritorio, con la barra contraída solo se ve el isotipo. */
  compact: boolean;
}

export function Brand({ compact }: BrandProps) {
  return (
    <Link
      to="/"
      aria-label={`${APP_INFO.name} — ir al inicio`}
      className="flex h-full min-w-0 items-center gap-3 rounded-lg lg:gap-0"
    >
      <span className="flex shrink-0 items-center justify-center lg:w-18">
        <span className="flex size-9 items-center justify-center rounded-xl bg-rail text-white shadow-[0_6px_14px_-6px_var(--color-primary-800)]">
          <Cloud className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
      </span>
      <span
        className={cn(
          'min-w-0 leading-tight whitespace-nowrap transition-opacity duration-200',
          compact && 'lg:pointer-events-none lg:opacity-0',
        )}
      >
        <span className="block text-[15px] font-extrabold tracking-tight text-primary-950">
          {APP_INFO.name}
        </span>
        <span className="block truncate text-[11px] font-medium text-ink-subtle">
          {APP_INFO.tagline} · {COMPANY_INFO.shortName}
        </span>
      </span>
    </Link>
  );
}
