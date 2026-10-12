import { ChevronRight, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router';

import { EASE_OUT_SOFT, SPRING_SNAPPY } from '@/components/motion-presets';
import { COMPANY_INFO } from '@/config/app';
import type { NavGroup, NavItem } from '@/types/navigation';
import { cn } from '@/utils/cn';

export interface ContextPanelProps {
  group: NavGroup;
  /** Se llama al elegir un submódulo (el menú móvil lo usa para cerrarse). */
  onNavigate?: () => void;
  className?: string;
}

export function ContextPanel({ group, onNavigate, className }: ContextPanelProps) {
  const GroupIcon = group.icon;

  return (
    <motion.div
      key={group.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT_SOFT }}
      className={cn('flex h-full w-64 flex-col bg-white', className)}
    >
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <GroupIcon className="size-5 text-ink-muted" aria-hidden />
          <h2 className="text-base font-bold text-ink">{group.label}</h2>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-subtle">{group.description}</p>
      </div>

      <nav
        aria-label={`Submódulos de ${group.label}`}
        className="flex-1 scrollbar-thin overflow-y-auto px-3 pb-4"
      >
        {group.sections.map((section, index) => (
          <div key={section.id} className={cn(index > 0 && 'mt-3 border-t border-line pt-4')}>
            {section.title && (
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-ink-subtle uppercase">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <PanelLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <footer className="border-t border-line p-4">
        <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-700 shadow-card">
            <Store className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">{COMPANY_INFO.shortName}</p>
            <p className="truncate text-[11px] text-ink-subtle">{COMPANY_INFO.branch}</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

function PanelLink({ item, onNavigate }: { item: NavItem; onNavigate: (() => void) | undefined }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150',
          isActive ? 'font-semibold text-primary-700' : 'font-medium text-ink-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId="panel-active"
              transition={SPRING_SNAPPY}
              className="absolute inset-0 rounded-xl bg-primary-50"
            />
          ) : (
            <span className="absolute inset-0 rounded-xl transition-colors duration-150 group-hover:bg-surface" />
          )}
          <Icon
            className={cn(
              'relative size-4 shrink-0',
              isActive ? 'text-primary-600' : 'text-ink-subtle group-hover:text-ink-muted',
            )}
            aria-hidden
          />
          <span className="relative flex-1 truncate">{item.label}</span>
          {isActive && <ChevronRight className="relative size-4 text-primary-500" aria-hidden />}
        </>
      )}
    </NavLink>
  );
}
