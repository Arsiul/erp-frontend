import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate, formatDateTime, formatInteger } from '@/utils/format';

import type { Column } from './types';

const EMPTY = <span className="text-ink-subtle">—</span>;

/** En la tabla los textos largos se recortan (…); en el detalle se muestran completos. */
export type DataCellLayout = 'table' | 'detail';

/** Muestra el valor de una columna para un registro; lo usan la tabla y el panel de detalle. */
export function DataCell<T>({
  column,
  row,
  layout = 'table',
}: {
  column: Column<T>;
  row: T;
  layout?: DataCellLayout;
}) {
  const clampTitle = layout === 'table' ? 'max-w-52 truncate @2xl:max-w-60' : 'break-words';
  const clampText = layout === 'table' ? 'block max-w-36 truncate @2xl:max-w-48' : 'break-words';

  switch (column.kind) {
    case 'title': {
      const { title, subtitle } = column.value(row);
      return (
        <div className="min-w-0">
          <p className={cn('font-semibold text-ink', clampTitle)}>{title || '—'}</p>
          {subtitle && <p className={cn('text-xs text-ink-subtle', clampTitle)}>{subtitle}</p>}
        </div>
      );
    }
    case 'text':
      return <span className="text-ink">{column.value(row) || EMPTY}</span>;
    case 'muted':
      return <span className={cn('text-ink-muted', clampText)}>{column.value(row) || EMPTY}</span>;
    case 'code':
      return (
        <span className="font-semibold whitespace-nowrap text-ink tabular-nums">
          {column.value(row) || EMPTY}
        </span>
      );
    case 'person': {
      const name = column.value(row);
      if (!name) return EMPTY;
      return (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Avatar name={name} size="sm" />
          <span className="font-medium text-ink">{name}</span>
        </span>
      );
    }
    case 'date': {
      const value = column.value(row);
      return value ? (
        <span className="whitespace-nowrap text-ink-muted">{formatDate(value)}</span>
      ) : (
        EMPTY
      );
    }
    case 'datetime': {
      const value = column.value(row);
      return value ? (
        <span className="whitespace-nowrap text-ink-muted tabular-nums">
          {formatDateTime(value)}
        </span>
      ) : (
        EMPTY
      );
    }
    case 'money':
      return (
        <span className="font-semibold whitespace-nowrap text-ink tabular-nums">
          {formatCurrency(column.value(row))}
        </span>
      );
    case 'number': {
      const value = column.value(row);
      const sign = column.signed && value > 0 ? '+' : column.signed && value < 0 ? '−' : '';
      return (
        <span
          className={cn(
            'font-semibold whitespace-nowrap tabular-nums',
            column.signed && value > 0 && 'text-emerald-600',
            column.signed && value < 0 && 'text-rose-600',
            !column.signed && 'text-ink',
          )}
        >
          {sign}
          {formatInteger(column.signed ? Math.abs(value) : value)}
          {column.unit && <span className="ml-1 font-normal text-ink-subtle">{column.unit}</span>}
        </span>
      );
    }
    case 'badge': {
      const { label, tone, appearance = 'solid' } = column.value(row);
      return (
        <Badge tone={tone} appearance={appearance}>
          {label}
        </Badge>
      );
    }
  }
}
