import { ArrowRight, Download, Pencil, Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import { toast } from 'sonner';

import { DataCell } from '@/components/data-table/DataCell';
import type { Column } from '@/components/data-table/types';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { isServerFile, saveServerFile } from '@/services/resources.service';
import type { DocumentLine } from '@/types/comercial';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDecimal } from '@/utils/format';

import type { FlowAction, ProcessAction } from './list-definition';
import { hasAnyAction, type RecordActions } from './record-actions';

export interface RecordDetailSheetProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityLabel: string;
  row: T | undefined;
  columns: readonly Column<T>[];
  actions: RecordActions<T> | undefined;
  onEdit: () => void;
  onRemove: () => void;
  onProcess: (action: ProcessAction<T>) => void;
  onFlow: (action: FlowAction<T>) => void;
}

function isLine(value: unknown): value is DocumentLine {
  return (
    typeof value === 'object' &&
    value !== null &&
    'productName' in value &&
    'quantity' in value &&
    'unitPrice' in value
  );
}

/** Líneas del documento, si el registro las tiene (ventas, comprobantes, órdenes, recepciones…). */
function linesOf(row: unknown): DocumentLine[] {
  if (typeof row !== 'object' || row === null || !('lines' in row)) return [];
  const { lines } = row;
  return Array.isArray(lines) ? lines.filter(isLine) : [];
}

/** Archivo descargable, si el registro es un documento con contenido guardado. */
/** Un archivo del servidor se descarga con el token; un data URL local, con el enlace directo. */
function downloadFile(event: MouseEvent<HTMLAnchorElement>, file: { name: string; content: string }) {
  if (!isServerFile(file.content)) return;
  event.preventDefault();
  saveServerFile(file.content, file.name).catch((error: unknown) => {
    toast.error(error instanceof Error ? error.message : 'No se pudo descargar el archivo.');
  });
}

function fileOf(row: unknown): { name: string; content: string } | undefined {
  if (typeof row !== 'object' || row === null) return undefined;
  if (!('content' in row) || !('fileName' in row)) return undefined;
  const { content, fileName } = row;
  if (typeof content !== 'string' || !content || typeof fileName !== 'string') return undefined;
  return { name: fileName, content };
}

function LinesTable({ lines }: { lines: DocumentLine[] }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
        Productos
      </h3>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs text-ink-subtle">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Producto</th>
              <th className="px-3 py-2 text-right font-semibold">Cant.</th>
              <th className="px-3 py-2 text-right font-semibold">P. unit.</th>
              <th className="px-3 py-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lines.map((line, index) => (
              <tr key={`${line.productId}-${String(index)}`}>
                <td className="px-3 py-2">
                  <p className="font-medium text-ink">{line.productName}</p>
                  <p className="text-xs text-ink-subtle">{line.sku}</p>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatDecimal(line.quantity)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(line.unitPrice)}
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {formatCurrency(line.quantity * line.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Ficha de un registro: todos sus datos, sus líneas y sus acciones. Desde aquí también se pasa al paso
 * siguiente del ciclo con el registro ya cargado.
 */
export function RecordDetailSheet<T>({
  open,
  onOpenChange,
  title,
  entityLabel,
  row,
  columns,
  actions,
  onEdit,
  onRemove,
  onProcess,
  onFlow,
}: RecordDetailSheetProps<T>) {
  const lines = linesOf(row);
  const file = fileOf(row);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      size={lines.length > 0 ? 'lg' : 'md'}
      title={title}
      description={`Detalle de ${entityLabel}`}
      footer={
        row && actions && (hasAnyAction(actions) || file) ? (
          <>
            {actions.canRemove && (
              <Button
                variant="ghost"
                onClick={onRemove}
                className="mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </Button>
            )}
            {file && (
              <a
                href={file.content}
                download={file.name}
                onClick={(event) => {
                  downloadFile(event, file);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <Download className="size-4" aria-hidden />
                Descargar
              </a>
            )}
            {actions.process.map((action) => (
              <Button
                key={action.id}
                variant={action.tone === 'danger' ? 'ghost' : 'soft'}
                onClick={() => {
                  onProcess(action);
                }}
                className={cn(action.tone === 'danger' && 'text-rose-600 hover:bg-rose-50')}
              >
                {action.label}
              </Button>
            ))}
            {actions.canEdit && (
              <Button variant="soft" onClick={onEdit}>
                <Pencil className="size-4" aria-hidden />
                Editar
              </Button>
            )}
            {actions.flow.map((action) => {
              const Icon = action.icon ?? ArrowRight;
              return (
                <Button
                  key={action.id}
                  onClick={() => {
                    onFlow(action);
                  }}
                >
                  <Icon className="size-4" aria-hidden />
                  {action.label}
                </Button>
              );
            })}
          </>
        ) : undefined
      }
    >
      {row ? (
        <>
          <dl className="divide-y divide-line">
            {columns.map((column) => (
              <div key={column.id} className="grid grid-cols-[9rem_1fr] items-center gap-4 py-3">
                <dt className="text-xs font-semibold text-ink-subtle">{column.header}</dt>
                <dd className="min-w-0 text-sm">
                  <DataCell column={column} row={row} layout="detail" />
                </dd>
              </div>
            ))}
          </dl>
          {lines.length > 0 && <LinesTable lines={lines} />}
        </>
      ) : (
        <p className="text-sm text-ink-muted">Este registro ya no existe.</p>
      )}
    </Sheet>
  );
}
