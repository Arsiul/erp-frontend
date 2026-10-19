import type { Sale } from './comercial';

export type KpiId =
  | 'monthly-sales'
  | 'gross-profit'
  | 'receivables'
  | 'payables'
  | 'monthly-purchases'
  | 'critical-stock'
  | 'inventory-turnover';

export type KpiFormat = 'currency' | 'integer' | 'decimal';

export interface Kpi {
  id: KpiId;
  label: string;
  value: number;
  format: KpiFormat;
  /** Sufijo opcional del valor (ej.: "veces"). */
  unit?: string;
  /** Variación porcentual frente al período anterior; null si no aplica. */
  changePercent: number | null;
  /** true si un aumento es positivo para el negocio (ventas); false si es negativo (deudas). */
  higherIsBetter: boolean;
  caption: string;
}

export interface MonthlyTotals {
  month: string;
  sales: number;
  purchases: number;
}

/** Venta tal como la muestra el dashboard. */
export type RecentSale = Pick<
  Sale,
  'id' | 'number' | 'customerName' | 'issuedAt' | 'total' | 'status' | 'invoiceNumber'
>;

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
}

export interface DashboardSummary {
  periodLabel: string;
  primaryKpis: Kpi[];
  operationalKpis: Kpi[];
  monthlyTotals: MonthlyTotals[];
  recentSales: RecentSale[];
  topProducts: TopProduct[];
}
