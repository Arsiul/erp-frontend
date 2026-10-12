import { CircleAlert } from 'lucide-react';
import { motion } from 'motion/react';

import { fadeInUp, staggerContainer } from '@/components/motion-presets';
import { DemoDataBadge } from '@/components/DemoDataBadge';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { COMPANY_INFO } from '@/config/app';
import type { DashboardSummary } from '@/types/dashboard';

import { AlertsCard } from '../components/AlertsCard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { KpiCard } from '../components/KpiCard';
import { RecentSalesCard } from '../components/RecentSalesCard';
import { SALES_CHART_SERIES } from '../components/sales-chart-series';
import { SalesChart } from '../components/SalesChart';
import { TopProductsCard } from '../components/TopProductsCard';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

export function DashboardPage() {
  const { data, isPending, isError, refetch, isRefetching } = useDashboardSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel general"
        description={
          data
            ? `Resumen de ${data.periodLabel} · ${COMPANY_INFO.name}`
            : `Resumen del negocio · ${COMPANY_INFO.name}`
        }
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Panel general' }]}
        actions={<DemoDataBadge />}
      />

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <Card>
          <EmptyState
            icon={CircleAlert}
            title="No se pudo cargar el resumen"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button
                disabled={isRefetching}
                onClick={() => {
                  void refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        </Card>
      ) : (
        <DashboardContent summary={data} />
      )}
    </div>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={staggerContainer} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.primaryKpis.map((kpi) => (
          <motion.div key={kpi.id} variants={fadeInUp}>
            <KpiCard kpi={kpi} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={staggerContainer} className="grid gap-4 md:grid-cols-3">
        {summary.operationalKpis.map((kpi) => (
          <motion.div key={kpi.id} variants={fadeInUp}>
            <KpiCard kpi={kpi} variant="compact" />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div variants={fadeInUp} className="min-w-0 xl:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Ventas vs. compras"
              description="Últimos 12 meses"
              action={<ChartLegend />}
            />
            <div className="px-3 pt-4 pb-4">
              <SalesChart data={summary.monthlyTotals} />
            </div>
          </Card>
        </motion.div>
        <motion.div variants={fadeInUp} className="min-w-0">
          <AlertsCard />
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div variants={fadeInUp} className="min-w-0 xl:col-span-2">
          <RecentSalesCard sales={summary.recentSales} />
        </motion.div>
        <motion.div variants={fadeInUp} className="min-w-0">
          <TopProductsCard products={summary.topProducts} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function ChartLegend() {
  return (
    <ul className="flex items-center gap-4">
      {SALES_CHART_SERIES.map((series) => (
        <li key={series.key} className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: series.color }} />
          {series.label}
        </li>
      ))}
    </ul>
  );
}
