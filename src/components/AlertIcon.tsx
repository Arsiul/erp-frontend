import { CircleAlert, Info, TriangleAlert } from 'lucide-react';

import type { AlertSeverity } from '@/types/alerts';
import { cn } from '@/utils/cn';

const SEVERITY_STYLES: Record<AlertSeverity, { icon: typeof Info; className: string }> = {
  critical: { icon: CircleAlert, className: 'bg-rose-50 text-rose-600' },
  warning: { icon: TriangleAlert, className: 'bg-amber-50 text-amber-600' },
  info: { icon: Info, className: 'bg-primary-50 text-primary-600' },
};

export function AlertIcon({
  severity,
  className,
}: {
  severity: AlertSeverity;
  className?: string;
}) {
  const { icon: Icon, className: tone } = SEVERITY_STYLES[severity];
  return (
    <span
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tone, className)}
    >
      <Icon className="size-[18px]" aria-hidden />
    </span>
  );
}
