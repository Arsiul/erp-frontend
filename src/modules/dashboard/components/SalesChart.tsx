import { useReducedMotion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';

import type { MonthlyTotals } from '@/types/dashboard';
import { formatCompactCurrency, formatCurrency } from '@/utils/format';

import { SALES_CHART_SERIES } from './sales-chart-series';

const AXIS_TICK = { fill: 'var(--color-ink-subtle)', fontSize: 12 };

export function SalesChart({ data }: { data: MonthlyTotals[] }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label="Gráfico de ventas y compras de los últimos 12 meses"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {SALES_CHART_SERIES.map((series) => (
              <linearGradient
                key={series.key}
                id={`fill-${series.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={series.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={series.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="4 4" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={8} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            tickFormatter={formatCompactCurrency}
            width={76}
          />
          <Tooltip
            content={ChartTooltip}
            cursor={{ stroke: 'var(--color-primary-200)', strokeWidth: 1.5 }}
          />
          {SALES_CHART_SERIES.map((series) => (
            <Area
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color}
              strokeWidth={2.5}
              fill={`url(#fill-${series.key})`}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
              isAnimationActive={!reduceMotion}
              animationDuration={900}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || payload.length === 0) return null;

  return (
    <div className="min-w-44 rounded-xl border border-line bg-white px-3.5 py-3 shadow-popover">
      <p className="mb-2 text-xs font-semibold text-ink">{String(label)}</p>
      <ul className="space-y-1.5">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="flex items-center gap-2 text-ink-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-ink tabular-nums">
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
