import * as Dialog from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { FileDown, FileUp, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { buttonClassName } from '@/components/ui/button-styles';
import { transferService, type ImportError } from '@/services/transfer.service';
import type { ResourceKey } from '@/types/resources';

const MAX_BYTES = 4_000_000;

export interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: ResourceKey;
  label: string;
  onTemplate: () => void;
}

/**
 * Importa un CSV al módulo. El backend valida todas las filas y guarda todo o nada: si una falla,
 * se listan los errores por línea y no se guarda ninguna.
 */
export function ImportCsvDialog({
  open,
  onOpenChange,
  resource,
  label,
  onTemplate,
}: ImportCsvDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File>();
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isWorking, setIsWorking] = useState(false);

  function reset(next: boolean) {
    if (isWorking) return;
    if (!next) {
      setFile(undefined);
      setErrors([]);
    }
    onOpenChange(next);
  }

  async function runImport() {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setErrors([{ line: 0, message: 'El archivo supera 4 MB.' }]);
      return;
    }
    setIsWorking(true);
    setErrors([]);
    try {
      const result = await transferService.importCsv(resource, await file.text());
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      // Los documentos mueven stock y cuentas: se refresca todo lo cacheado.
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success(
        `Importación lista: ${String(result.created)} nuevos, ${String(result.updated)} actualizados.`,
      );
      setFile(undefined);
      onOpenChange(false);
    } catch (error) {
      setErrors([
        { line: 0, message: error instanceof Error ? error.message : 'No se pudo importar.' },
      ]);
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={reset}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-primary-950/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[60] max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-popover outline-none">
          <Dialog.Title className="text-base font-bold text-ink">Importar {label}</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Sube un CSV con las columnas de la plantilla. Los registros existentes (mismo código o
            número) se actualizan y las relaciones se buscan por código o nombre. Si una fila tiene
            errores, no se guarda nada.
          </Dialog.Description>

          <button
            type="button"
            onClick={onTemplate}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
          >
            <FileDown className="size-4" aria-hidden />
            Descargar plantilla
          </button>

          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted hover:border-primary-300">
            <FileUp className="size-5 text-primary-600" aria-hidden />
            {file ? file.name : 'Elegir archivo .csv'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={isWorking}
              onChange={(event) => {
                setFile(event.target.files?.[0]);
                setErrors([]);
              }}
            />
          </label>

          {errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              <p className="flex items-center gap-1.5 font-semibold">
                <TriangleAlert className="size-4" aria-hidden />
                No se importó nada. Corrige y vuelve a subir:
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {errors.map((error, index) => (
                  <li key={index}>
                    {error.line > 0 && <strong>Línea {error.line}: </strong>}
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close disabled={isWorking} className={buttonClassName({ variant: 'ghost' })}>
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              disabled={!file || isWorking}
              onClick={() => {
                void runImport();
              }}
              className={buttonClassName({})}
            >
              {isWorking && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              Importar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
