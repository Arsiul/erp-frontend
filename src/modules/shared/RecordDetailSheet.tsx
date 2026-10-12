import { Pencil, Trash2 } from 'lucide-react';

import { DataCell } from '@/components/data-table/DataCell';
import type { Column } from '@/components/data-table/types';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/utils/cn';

import type { StatusAction } from './list-definition';
import type { RecordCapabilities } from './record-actions';

export interface RecordDetailSheetProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityLabel: string;
  row: T | undefined;
  columns: readonly Column<T>[];
  capabilities: RecordCapabilities<T> | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onStatusAction: (action: StatusAction<T>) => void;
}

/** Ficha de un registro: todos sus datos (incluidas las columnas ocultas en la tabla) y sus acciones. */
export function RecordDetailSheet<T>({
  open,
  onOpenChange,
  title,
  entityLabel,
  row,
  columns,
  capabilities,
  onEdit,
  onDelete,
  onStatusAction,
}: RecordDetailSheetProps<T>) {
  const hasActions =
    capabilities &&
    (capabilities.canEdit || capabilities.canDelete || capabilities.statusActions.length > 0);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={`Detalle de ${entityLabel}`}
      footer={
        row && capabilities && hasActions ? (
          <>
            {capabilities.canDelete && (
              <Button
                variant="ghost"
                onClick={onDelete}
                className="mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </Button>
            )}
            {capabilities.statusActions.map((action) => (
              <Button
                key={action.id}
                variant={action.tone === 'danger' ? 'ghost' : 'soft'}
                onClick={() => {
                  onStatusAction(action);
                }}
                className={cn(action.tone === 'danger' && 'text-rose-600 hover:bg-rose-50')}
              >
                {action.label}
              </Button>
            ))}
            {capabilities.canEdit && (
              <Button onClick={onEdit}>
                <Pencil className="size-4" aria-hidden />
                Editar
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      {row ? (
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
      ) : (
        <p className="text-sm text-ink-muted">Este registro ya no existe.</p>
      )}
    </Sheet>
  );
}
