import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode } from 'react';

import { EASE_OUT_SOFT } from '@/components/motion-presets';
import { cn } from '@/utils/cn';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Botones fijos al pie del panel. */
  footer?: ReactNode;
  /** Ancho del panel: los formularios con líneas de productos necesitan más espacio. */
  size?: keyof typeof SIZE_CLASS;
}

/** Panel lateral derecho para ver o editar un registro sin salir del listado. */
const SIZE_CLASS = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-primary-950/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              {...(description ? {} : { 'aria-describedby': undefined })}
            >
              <motion.div
                className={cn(
                  'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-popover outline-none',
                  SIZE_CLASS[size],
                )}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.32, ease: EASE_OUT_SOFT }}
              >
                <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-lg font-bold text-ink">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-0.5 text-sm text-ink-muted">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close
                    aria-label="Cerrar"
                    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                  >
                    <X className="size-4" aria-hidden />
                  </Dialog.Close>
                </header>
                <div className="flex-1 scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>
                {footer && (
                  <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/60 px-6 py-4">
                    {footer}
                  </footer>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
