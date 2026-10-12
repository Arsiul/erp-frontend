import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  HandCoins,
  PackageX,
  PiggyBank,
  Receipt,
  RefreshCw,
  Truck,
  type LucideIcon,
} from 'lucide-react';

import { AnimatedNumber } from '@/components/AnimatedNumber';
import { Card } from '@/components/ui/Card';
import type { Kpi, KpiId } from '@/types/dashboard';
import { cn } from '@/utils/cn';
import { formatChange, formatCurrency, formatDecimal, formatInteger } from '@/utils/format';

const KPI_VISUALS: Record<KpiId, { icon: LucideIcon; tone: string }> = {
  'monthly-sales': { icon: Receipt, tone: 'bg-primary-50 text-primary-600' },
  'gross-profit': { icon: PiggyBank, tone: 'bg-emerald-50 text-emerald-600' },
  receivables: { icon: HandCoins, tone: 'bg-amber-50 text-amber-600' },
  payables: { icon: CreditCard, tone: 'bg-rose-50 text-rose-600' },
  'monthly-purchases': { icon: Truck, tone: 'bg-indigo-50 text-indigo-600' },
  'critical-stock': { icon: PackageX, tone: 'bg-rose-50 text-rose-600' },
  'inventory-turnover': { icon: RefreshCw, tone: 'bg-sky-50 text-sky-600' },
};

const FORMATTERS: Record<Kpi['format'], (value: number) => string> = {
  currency: formatCurrency,
  integer: (value) => formatInteger(Math.round(value)),
  decimal: formatDecimal,
};

export interface KpiCardProps {
  kpi: Kpi;
  variant?: 'default' | 'compact';
}

export function KpiCard({ kpi, variant = 'default' }: KpiCardProps) {
  const { icon: Icon, tone } = KPI_VISUALS[kpi.id];
  const value = (
    <span className="flex items-baseline gap-1.5">
      <AnimatedNumber
        value={kpi.value}
        format={FORMATTERS[kpi.format]}
        className={cn(
          'font-bold tracking-tight text-ink tabular-nums',
          variant === 'compact' ? 'text-xl' : 'text-2xl',
        )}
      />
      {kpi.unit && <span className="text-xs font-medium text-ink-subtle">{kpi.unit}</span>}
    </span>
  );

  if (variant === 'compact') {
    return (
      <Card className="flex h-full items-center gap-4 p-4 transition-shadow duration-200 hover:shadow-md">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-muted">{kpi.label}</p>
          {value}
          <p className="mt-0.5 truncate text-xs text-ink-subtle">{kpi.caption}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{kpi.label}</p>
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <div className="mt-2">{value}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {kpi.changePercent !== null && (
          <ChangeChip change={kpi.changePercent} higherIsBetter={kpi.higherIsBetter} />
        )}
        <span className="text-ink-subtle">{kpi.caption}</span>
      </div>
    </Card>
  );
}

function ChangeChip({ change, higherIsBetter }: { change: number; higherIsBetter: boolean }) {
  const isIncrease = change >= 0;
  const isFavorable = higherIsBetter ? isIncrease : !isIncrease;
  const Arrow = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold tabular-nums',
        isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      )}
    >
      <Arrow className="size-3.5" aria-hidden />
      {formatChange(change)}
      <span className="sr-only">{isFavorable ? '(favorable)' : '(desfavorable)'}</span>
    </span>
  );
}
