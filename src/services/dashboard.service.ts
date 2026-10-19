import { LOCALE } from '@/config/app';
import type {
  DashboardSummary,
  Kpi,
  MonthlyTotals,
  RecentSale,
  TopProduct,
} from '@/types/dashboard';
import { isOverdue, toIsoDate } from '@/utils/dates';

import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';
import type { Store } from './mocks/store';
import { sessionService } from './session.service';

interface Period {
  from: string;
  to: string;
}

const COST_ORIGINS = new Set(['sale', 'sale_cancel', 'credit_note']);

function inPeriod(iso: string, { from, to }: Period): boolean {
  const day = iso.slice(0, 10);
  return day >= from && day <= to;
}

function sum<T>(rows: T[], value: (row: T) => number): number {
  return Math.round(rows.reduce((total, row) => total + value(row), 0) * 100) / 100;
}

function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Del 1 del mes a hoy, y los mismos días del mes anterior para comparar. */
function periods(now: Date): { current: Period; previous: Period } {
  const day = now.getDate();
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  return {
    current: {
      from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: toIsoDate(now),
    },
    previous: {
      from: toIsoDate(previousStart),
      to: toIsoDate(
        new Date(
          previousStart.getFullYear(),
          previousStart.getMonth(),
          Math.min(day, previousLastDay),
        ),
      ),
    },
  };
}

function salesIn(store: Store, period: Period): number {
  return sum(
    store
      .list('ventas')
      .filter((row) => row.status !== 'cancelled' && inPeriod(row.issuedAt, period)),
    (row) => row.subtotal,
  );
}

function costOfSalesIn(store: Store, period: Period): number {
  return sum(
    store
      .list('kardex')
      .filter((row) => COST_ORIGINS.has(row.origin) && inPeriod(row.date, period)),
    (row) => -row.quantity * row.unitCost,
  );
}

function purchasesIn(store: Store, period: Period): number {
  return sum(
    store
      .list('facturas-proveedor')
      .filter((row) => row.status !== 'cancelled' && inPeriod(row.issuedAt, period)),
    (row) => row.subtotal,
  );
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function commercialKpis(store: Store, now: Date): Kpi[] {
  const { current, previous } = periods(now);
  const today = toIsoDate(now);
  const sales = salesIn(store, current);
  const previousSales = salesIn(store, previous);
  const profit = sales - costOfSalesIn(store, current);
  const previousProfit = previousSales - costOfSalesIn(store, previous);
  const open = store
    .list('cuentas-cobrar')
    .filter((row) => row.balance > 0 && row.status !== 'cancelled');
  const overdue = open.filter((row) => isOverdue(row.dueAt, row.balance, today));
  return [
    {
      id: 'monthly-sales',
      label: 'Ventas del mes',
      value: sales,
      format: 'currency',
      changePercent: change(sales, previousSales),
      higherIsBetter: true,
      caption: 'Sin IGV, frente a los mismos días del mes anterior',
    },
    {
      id: 'gross-profit',
      label: 'Utilidad bruta',
      value: Math.round(profit * 100) / 100,
      format: 'currency',
      changePercent: change(profit, previousProfit),
      higherIsBetter: true,
      caption:
        sales > 0
          ? `Margen de ${Math.round((profit / sales) * 1000) / 10} %`
          : 'Sin ventas en el mes',
    },
    {
      id: 'receivables',
      label: 'Por cobrar',
      value: sum(open, (row) => row.balance),
      format: 'currency',
      changePercent: null,
      higherIsBetter: false,
      caption: overdue.length
        ? plural(overdue.length, 'comprobante vencido', 'comprobantes vencidos')
        : 'Nada vencido',
    },
  ];
}

function purchasingKpis(store: Store, now: Date): Kpi[] {
  const { current, previous } = periods(now);
  const today = toIsoDate(now);
  const purchases = purchasesIn(store, current);
  const open = store
    .list('cuentas-pagar')
    .filter((row) => row.balance > 0 && row.status !== 'cancelled');
  const overdue = open.filter((row) => isOverdue(row.dueAt, row.balance, today));
  return [
    {
      id: 'payables',
      label: 'Por pagar',
      value: sum(open, (row) => row.balance),
      format: 'currency',
      changePercent: null,
      higherIsBetter: false,
      caption: overdue.length
        ? plural(overdue.length, 'factura vencida', 'facturas vencidas')
        : 'Nada vencido',
    },
    {
      id: 'monthly-purchases',
      label: 'Compras del mes',
      value: purchases,
      format: 'currency',
      changePercent: change(purchases, purchasesIn(store, previous)),
      higherIsBetter: false,
      caption: 'Facturas de proveedor, sin IGV',
    },
  ];
}

function inventoryKpis(store: Store, now: Date): Kpi[] {
  const stock = store.list('stock');
  const critical = stock.filter((row) => row.quantity < row.minStock);
  const inventoryValue = sum(stock, (row) => row.quantity * row.unitCost);
  const lastMonth: Period = {
    from: toIsoDate(new Date(now.getTime() - 29 * 86_400_000)),
    to: toIsoDate(now),
  };
  const annualCost = costOfSalesIn(store, lastMonth) * 12;
  return [
    {
      id: 'critical-stock',
      label: 'Stock crítico',
      value: critical.length,
      format: 'integer',
      changePercent: null,
      higherIsBetter: false,
      caption: critical.length ? 'Productos por almacén bajo el mínimo' : 'Todo sobre el mínimo',
    },
    {
      id: 'inventory-turnover',
      label: 'Rotación de inventario',
      value: inventoryValue > 0 ? Math.round((annualCost / inventoryValue) * 10) / 10 : 0,
      format: 'decimal',
      unit: 'veces/año',
      changePercent: null,
      higherIsBetter: true,
      caption: 'Costo de ventas de 30 días anualizado / valor del stock',
    },
  ];
}

function monthlyTotals(
  store: Store,
  now: Date,
  withSales: boolean,
  withPurchases: boolean,
): MonthlyTotals[] {
  const formatter = new Intl.DateTimeFormat(LOCALE, { month: 'short' });
  return Array.from({ length: 6 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const period: Period = { from: toIsoDate(start), to: toIsoDate(end) };
    return {
      month: formatter.format(start).replace('.', ''),
      sales: withSales ? salesIn(store, period) : 0,
      purchases: withPurchases ? purchasesIn(store, period) : 0,
    };
  });
}

function recentSales(store: Store): RecentSale[] {
  return store
    .list('ventas')
    .toSorted((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    .slice(0, 6)
    .map(({ id, number, customerName, issuedAt, total, status, invoiceNumber }) => ({
      id,
      number,
      customerName,
      issuedAt,
      total,
      status,
      invoiceNumber,
    }));
}

function topProducts(store: Store, now: Date): TopProduct[] {
  const lastMonth: Period = {
    from: toIsoDate(new Date(now.getTime() - 29 * 86_400_000)),
    to: toIsoDate(now),
  };
  const totals = new Map<string, { units: number; revenue: number }>();
  for (const sale of store.list('ventas')) {
    if (sale.status === 'cancelled' || !inPeriod(sale.issuedAt, lastMonth)) continue;
    for (const line of sale.lines) {
      const entry = totals.get(line.productId) ?? { units: 0, revenue: 0 };
      entry.units += line.quantity;
      entry.revenue += line.quantity * line.unitPrice;
      totals.set(line.productId, entry);
    }
  }
  return [...totals.entries()]
    .map(([id, { units, revenue }]) => {
      const product = store.get('productos', id);
      return {
        id,
        name: product?.name ?? id,
        category: product?.categoryName ?? '',
        units,
        revenue: Math.round(revenue * 100) / 100,
      };
    })
    .toSorted((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

/**
 * Resumen del mes calculado desde los registros: cada indicador sale de las mismas tablas que los listados,
 * así una venta o un cobro nuevo se refleja al volver al inicio. Solo incluye lo que el rol puede consultar.
 */
export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    return withLatency(() => {
      const now = new Date();
      const comercial = sessionService.can('comercial');
      const compras = sessionService.can('compras');
      const inventario = sessionService.can('inventario');
      return mockDb.read((store) => ({
        periodLabel: new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(
          now,
        ),
        primaryKpis: [
          ...(comercial ? commercialKpis(store, now) : []),
          ...(compras ? purchasingKpis(store, now).slice(0, 1) : []),
        ],
        operationalKpis: [
          ...(compras ? purchasingKpis(store, now).slice(1) : []),
          ...(inventario ? inventoryKpis(store, now) : []),
        ],
        monthlyTotals: comercial || compras ? monthlyTotals(store, now, comercial, compras) : [],
        recentSales: comercial ? recentSales(store) : [],
        topProducts: comercial ? topProducts(store, now) : [],
      }));
    });
  },
};
