import type { Column } from '@/components/data-table/types';

/** Texto plano de una celda, pensado para hojas de cálculo (números sin formato de moneda). */
export function cellText<T>(column: Column<T>, row: T): string {
  switch (column.kind) {
    case 'title': {
      const { title, subtitle } = column.value(row);
      return subtitle ? `${title} (${subtitle})` : title;
    }
    case 'badge':
      return column.value(row).label;
    case 'money':
      return column.value(row).toFixed(2);
    case 'number':
      return String(column.value(row));
    default:
      return column.value(row);
  }
}

function escapeCsv(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** Arma un CSV separado por punto y coma (lo que espera Excel con configuración regional peruana). */
export function toCsv<T>(columns: readonly Column<T>[], rows: readonly T[]): string {
  const lines = [
    columns.map((column) => escapeCsv(column.header)),
    ...rows.map((row) => columns.map((column) => escapeCsv(cellText(column, row)))),
  ];
  return lines.map((line) => line.join(';')).join('\r\n');
}

/** Descarga el CSV en el navegador. El BOM hace que Excel respete las tildes. */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
