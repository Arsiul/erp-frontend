import { PackageSearch } from 'lucide-react';
import { motion } from 'motion/react';

import { EASE_OUT_SOFT } from '@/components/motion-presets';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TopProduct } from '@/types/dashboard';
import { formatCurrency, formatInteger } from '@/utils/format';

export function TopProductsCard({ products }: { products: TopProduct[] }) {
  const maxRevenue = Math.max(...products.map((product) => product.revenue), 1);

  return (
    <Card className="h-full">
      <CardHeader title="Productos más vendidos" description="Por facturación del mes" />
      {products.length === 0 && (
        <EmptyState
          icon={PackageSearch}
          title="Aún no hay ventas"
          description="El ranking se arma con las ventas del mes."
        />
      )}
      <ol className="space-y-4 p-5">
        {products.map((product, index) => (
          <li key={product.id}>
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-bold text-ink-muted tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                  <p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  {product.category} · {formatInteger(product.units)} unidades
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <motion.div
                    className="h-full origin-left rounded-full bg-primary-500"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: product.revenue / maxRevenue }}
                    transition={{ duration: 0.9, ease: EASE_OUT_SOFT, delay: 0.15 + index * 0.08 }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
