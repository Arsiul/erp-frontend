import { BellOff, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

import { AlertIcon } from '@/components/AlertIcon';
import { fadeInUp, staggerContainer } from '@/components/motion-presets';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAlerts } from '@/hooks/useAlerts';

export function AlertsCard() {
  const { data: alerts, isPending } = useAlerts();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Alertas"
        description="Requieren atención hoy"
        action={
          alerts && alerts.length > 0 ? (
            <Badge tone="danger" appearance="solid">
              {alerts.length}
            </Badge>
          ) : undefined
        }
      />

      <div className="flex-1 p-3">
        {isPending && (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        )}

        {alerts?.length === 0 && (
          <EmptyState icon={BellOff} title="Todo en orden" description="No hay alertas activas." />
        )}

        {alerts && alerts.length > 0 && (
          <motion.ul variants={staggerContainer} initial="hidden" animate="show">
            {alerts.map((alert) => (
              <motion.li key={alert.id} variants={fadeInUp}>
                <Link
                  to={alert.path}
                  className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-150 hover:bg-surface"
                >
                  <AlertIcon severity={alert.severity} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {alert.title}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {alert.description}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-ink-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary-600"
                    aria-hidden
                  />
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </Card>
  );
}
