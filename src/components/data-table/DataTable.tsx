import { motion } from 'motion/react';
import { type ReactNode } from 'react';

import { EASE_OUT_SOFT } from '@/components/motion-presets';
import { cn } from '@/utils/cn';

import { DataCell } from './DataCell';
import type { Column, ColumnBreakpoint } from './types';

/** Container queries sobre el ancho de la tabla. Clases completas para que Tailwind las detecte. */
const RESPONSIVE_CELL: Record<ColumnBreakpoint, string> = {
  sm: 'hidden @2xl:table-cell',
  md: 'hidden @3xl:table-cell',
  lg: 'hidden @4xl:table-cell',
  xl: 'hidden @5xl:table-cell',
  '2xl': 'hidden @6xl:table-cell',
};

const CELL = 'px-3 py-3.5 first:pl-5 last:pr-5';

function isNumeric<T>(column: Column<T>): boolean {
  return column.kind === 'money' || column.kind === 'number';
}

export interface DataTableProps<T extends { id: string }> {
  columns: readonly Column<T>[];
  rows: readonly T[];
  /** Nombre accesible de la tabla. */
  label: string;
  /** Clic en la fila (ej.: abrir el detalle). Para teclado, ofrecer la misma acción en `renderRowActions`. */
  onRowClick?: (row: T) => void;
  /** Última columna con las acciones del registro. */
  renderRowActions?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  label,
  onRowClick,
  renderRowActions,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('@container scrollbar-thin overflow-x-auto', className)}>
      <table className="w-full min-w-[560px] text-left text-sm" aria-label={label}>
        <thead className="border-y border-line bg-surface/70">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  CELL,
                  'py-3 text-xs font-semibold whitespace-nowrap text-ink-subtle',
                  isNumeric(column) && 'text-right',
                  column.hideBelow && RESPONSIVE_CELL[column.hideBelow],
                )}
              >
                {column.header}
              </th>
            ))}
            {renderRowActions && (
              <th scope="col" className={cn(CELL, 'w-px py-3')}>
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, index) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT_SOFT, delay: Math.min(index, 10) * 0.03 }}
              onClick={
                onRowClick
                  ? () => {
                      onRowClick(row);
                    }
                  : undefined
              }
              className={cn(
                'transition-colors duration-150 hover:bg-surface/70',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    CELL,
                    isNumeric(column) && 'text-right',
                    column.hideBelow && RESPONSIVE_CELL[column.hideBelow],
                  )}
                >
                  <DataCell column={column} row={row} />
                </td>
              ))}
              {renderRowActions && (
                <td
                  className={cn(CELL, 'w-px py-2 text-right')}
                  // Las acciones tienen su propio comportamiento: no deben abrir el detalle de la fila.
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  {renderRowActions(row)}
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
