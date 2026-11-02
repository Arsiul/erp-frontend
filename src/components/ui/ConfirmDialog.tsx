import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { EASE_OUT_SOFT } from '@/components/motion-presets';
import { cn } from '@/utils/cn';

import { buttonClassName } from './button-styles';

const REASON_MAX_LENGTH = 500;

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'default' | 'danger';
  /** Si se define, pide un motivo obligatorio y lo pasa a `onConfirm`. */
  reason?: { label: string; placeholder?: string | undefined } | undefined;
  /** Puede ser asíncrona: el diálogo muestra "procesando" y se cierra al terminar. */
  onConfirm: (reason?: string) => Promise<void> | void;
}

/** Confirmación accesible para acciones importantes o irreversibles. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'default',
  reason,
  onConfirm,
}: ConfirmDialogProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const reasonId = useId();
  const trimmedReason = reasonText.trim();
  const isMissingReason = Boolean(reason) && trimmedReason === '';

  function close(next: boolean) {
    if (!next) setReasonText('');
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (isMissingReason) return;
    setIsWorking(true);
    try {
      await (reason ? onConfirm(trimmedReason) : onConfirm());
      close(false);
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!isWorking) close(next);
      }}
    >
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[60] bg-primary-950/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </AlertDialog.Overlay>
            <AlertDialog.Content asChild forceMount>
              <motion.div
                className="fixed top-1/2 left-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white p-6 shadow-popover outline-none"
                initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
                transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
              >
                <div className="flex gap-4">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      tone === 'danger'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-primary-50 text-primary-600',
                    )}
                  >
                    <TriangleAlert className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <AlertDialog.Title className="text-base font-bold text-ink">
                      {title}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                      {description}
                    </AlertDialog.Description>
                    {reason && (
                      <div className="mt-4 space-y-1.5">
                        <label htmlFor={reasonId} className="text-xs font-semibold text-ink">
                          {reason.label}
                        </label>
                        <textarea
                          id={reasonId}
                          value={reasonText}
                          onChange={(event) => {
                            setReasonText(event.target.value);
                          }}
                          placeholder={reason.placeholder}
                          maxLength={REASON_MAX_LENGTH}
                          rows={3}
                          required
                          disabled={isWorking}
                          className="block w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                        />
                        <p className="text-right text-xs text-ink-subtle">
                          {reasonText.length}/{REASON_MAX_LENGTH}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <AlertDialog.Cancel
                    disabled={isWorking}
                    className={buttonClassName({ variant: 'ghost' })}
                  >
                    Cancelar
                  </AlertDialog.Cancel>
                  <button
                    type="button"
                    disabled={isWorking || isMissingReason}
                    onClick={() => {
                      void handleConfirm();
                    }}
                    className={buttonClassName({
                      className: cn(
                        tone === 'danger' && 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
                      ),
                    })}
                  >
                    {isWorking && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                    {confirmLabel}
                  </button>
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  );
}
