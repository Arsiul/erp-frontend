import { motion } from 'motion/react';
import { Link } from 'react-router';

import { SPRING_SNAPPY } from '@/components/motion-presets';
import { Tooltip } from '@/components/ui/Tooltip';
import { NAVIGATION } from '@/config/navigation';
import type { NavGroup } from '@/types/navigation';
import { cn } from '@/utils/cn';
import { getGroupEntryPath } from '@/utils/navigation';

export interface IconRailProps {
  activeGroupId: string | undefined;
  /**
   * Si se define, los íconos son botones que solo seleccionan el grupo (menú móvil).
   * Si no, son enlaces que navegan a la primera pantalla del grupo (escritorio).
   */
  onGroupSelect?: (group: NavGroup) => void;
}

const ITEM_CLASS =
  'relative flex size-11 cursor-pointer items-center justify-center rounded-xl text-white/65 transition-colors duration-150 hover:bg-rail-hover hover:text-white focus-visible:outline-white';

export function IconRail({ activeGroupId, onGroupSelect }: IconRailProps) {
  return (
    <nav aria-label="Módulos" className="flex w-18 shrink-0 flex-col items-center bg-rail py-4">
      <ul className="flex flex-col items-center gap-1.5">
        {NAVIGATION.map((group) => {
          const isActive = group.id === activeGroupId;
          const Icon = group.icon;
          const content = (
            <>
              {isActive && (
                <motion.span
                  layoutId="rail-active"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-xl bg-rail-active shadow-[0_6px_16px_-6px_rgb(0_0_0/0.45)]"
                />
              )}
              <Icon className="relative size-5" aria-hidden />
            </>
          );

          // Menú móvil (táctil): sin tooltip, que además taparía el panel al recibir el foco inicial.
          if (onGroupSelect) {
            return (
              <li key={group.id}>
                <button
                  type="button"
                  aria-label={group.label}
                  aria-pressed={isActive}
                  onClick={() => {
                    onGroupSelect(group);
                  }}
                  className={cn(ITEM_CLASS, isActive && 'text-white')}
                >
                  {content}
                </button>
              </li>
            );
          }

          return (
            <li key={group.id}>
              <Tooltip content={group.label} side="right">
                <Link
                  to={getGroupEntryPath(group)}
                  aria-label={group.label}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(ITEM_CLASS, isActive && 'text-white')}
                >
                  {content}
                </Link>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
