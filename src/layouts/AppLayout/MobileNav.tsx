import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useSession } from '@/hooks/useSession';
import { visibleNavigation } from '@/utils/navigation';
import type { NavGroup } from '@/types/navigation';

import { ContextPanel } from './ContextPanel';
import { IconRail } from './IconRail';

export interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeGroup: NavGroup | undefined;
}

/**
 * Menú lateral en pantallas menores a lg.
 * Tocar un grupo muestra sus submódulos sin navegar; tocar un submódulo navega y cierra el menú.
 */
export function MobileNav({ open, onOpenChange, activeGroup }: MobileNavProps) {
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const { can } = useSession();
  const groups = visibleNavigation((module) => can(module));

  const shownGroup =
    groups.find((group) => group.id === selectedGroupId) ??
    (activeGroup?.sections.length ? activeGroup : undefined) ??
    groups.find((group) => group.sections.length > 0);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setSelectedGroupId(undefined);
    onOpenChange(nextOpen);
  }

  function handleGroupSelect(group: NavGroup) {
    if (group.sections.length === 0) {
      void navigate(group.path);
      handleOpenChange(false);
      return;
    }
    setSelectedGroupId(group.id);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-primary-950/40 backdrop-blur-[2px] lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed inset-y-0 left-0 z-50 flex max-w-[calc(100vw-2rem)] overflow-hidden bg-white shadow-popover outline-none lg:hidden"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              >
                <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>
                <LayoutGroup id="mobile-nav">
                  <IconRail
                    activeGroupId={shownGroup?.id ?? activeGroup?.id}
                    onGroupSelect={handleGroupSelect}
                  />
                  {shownGroup && (
                    <ContextPanel
                      group={shownGroup}
                      onNavigate={() => {
                        handleOpenChange(false);
                      }}
                      className="min-w-0 shrink"
                    />
                  )}
                </LayoutGroup>
                <Dialog.Close
                  aria-label="Cerrar menú"
                  className="absolute top-4 right-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <X className="size-4" aria-hidden />
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
