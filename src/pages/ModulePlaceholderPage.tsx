import { motion } from 'motion/react';
import { Link } from 'react-router';

import { SPRING_SNAPPY } from '@/components/motion-presets';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { BUILD_STEPS_TOTAL } from '@/config/navigation';
import type { NavGroup, NavItem } from '@/types/navigation';
import { cn } from '@/utils/cn';
import { getGroupEntryPath, getGroupItems } from '@/utils/navigation';

export interface ModulePlaceholderPageProps {
  group: NavGroup;
  item: NavItem;
}

/** Pantalla provisional de un submódulo cuya funcionalidad aún no se implementa. */
export function ModulePlaceholderPage({ group, item }: ModulePlaceholderPageProps) {
  const Icon = item.icon;
  const siblings = getGroupItems(group).filter((sibling) => sibling.id !== item.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.label}
        description={item.description}
        breadcrumbs={[
          { label: 'Inicio', to: '/' },
          { label: group.label, to: getGroupEntryPath(group) },
          { label: item.label },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="relative flex flex-col items-center overflow-hidden px-6 py-14 text-center">
          <div
            aria-hidden
            className="absolute inset-0 [background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] [background-size:20px_20px]"
          />

          <div className="relative">
            {[0, 1].map((ring) => (
              <motion.span
                key={ring}
                aria-hidden
                className="absolute inset-0 rounded-3xl border-2 border-primary-200"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.55, opacity: 0 }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: ring * 1.3 }}
              />
            ))}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_SNAPPY}
              className="relative flex size-16 items-center justify-center rounded-3xl bg-primary-50 text-primary-600 shadow-card"
            >
              <Icon className="size-7" aria-hidden />
            </motion.span>
          </div>

          <Badge tone="primary" className="relative mt-7">
            Paso {item.buildStep} de {BUILD_STEPS_TOTAL} del plan de construcción
          </Badge>
          <h2 className="relative mt-3 text-lg font-bold text-ink">Módulo en preparación</h2>
          <p className="relative mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            La navegación y el diseño de esta pantalla ya están listos. Las funciones y los datos se
            incorporarán cuando el plan llegue a este paso.
          </p>

          <ol aria-hidden className="relative mt-6 flex items-center gap-1.5">
            {Array.from({ length: BUILD_STEPS_TOTAL }, (_, index) => index + 1).map((step) => (
              <li
                key={step}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  step === item.buildStep ? 'w-8 bg-primary-600' : 'w-4 bg-line',
                )}
              />
            ))}
          </ol>
        </div>

        {siblings.length > 0 && (
          <div className="border-t border-line bg-surface/60 px-6 py-5">
            <p className="text-[11px] font-semibold tracking-wider text-ink-subtle uppercase">
              También en {group.label}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {siblings.map((sibling) => {
                const SiblingIcon = sibling.icon;
                return (
                  <li key={sibling.id}>
                    <Link
                      to={sibling.path}
                      className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:border-primary-200 hover:text-primary-700"
                    >
                      <SiblingIcon className="size-4" aria-hidden />
                      {sibling.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
