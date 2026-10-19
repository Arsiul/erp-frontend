/** Reportes disponibles en el grupo Reportes. */
export const REPORT_IDS = ['ventas', 'compras', 'inventario', 'saldos'] as const;
export type ReportId = (typeof REPORT_IDS)[number];

export type ReportColumnKind = 'text' | 'code' | 'number' | 'money' | 'date' | 'percent';

export interface ReportColumn {
  id: string;
  header: string;
  kind: ReportColumnKind;
}

export type ReportCell = string | number | null;
export type ReportRow = Record<string, ReportCell>;

export interface ReportFilterOption {
  value: string;
  label: string;
}

/** Filtros comunes; cada reporte usa los que le aplican. */
export interface ReportFilters {
  from?: string;
  to?: string;
  /** Cliente, proveedor, almacén o tipo de saldo, según el reporte. */
  party?: string;
}

export interface ReportKpi {
  id: string;
  label: string;
  value: number;
  kind: 'number' | 'money';
}

export interface ReportResult {
  title: string;
  columns: readonly ReportColumn[];
  rows: readonly ReportRow[];
  kpis: readonly ReportKpi[];
  /** Serie para el gráfico: etiqueta y monto. */
  chart: readonly { label: string; value: number }[];
}

/** Lo que muestra la barra de filtros de cada reporte. */
export interface ReportFilterSpec {
  dates: boolean;
  party?: { label: string; options: readonly ReportFilterOption[] };
}
