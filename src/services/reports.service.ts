import type {
  ReportColumn,
  ReportFilterSpec,
  ReportFilters,
  ReportId,
  ReportKpi,
  ReportResult,
  ReportRow,
} from '@/types/reports';
import { daysBetween, todayIso } from '@/utils/dates';

import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';
import type { Store } from './mocks/store';
import { sessionService } from './session.service';

const CHART_LIMIT = 8;

const SALE_STATUS: Record<string, string> = {
  pending_invoice: 'Por facturar',
  invoiced: 'Facturada',
  cancelled: 'Anulada',
};

const AGING_BUCKETS = [
  'Por vencer',
  '1 a 30 días',
  '31 a 60 días',
  '61 a 90 días',
  'Más de 90 días',
] as const;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function sum<T>(rows: readonly T[], value: (row: T) => number): number {
  return round(rows.reduce((total, row) => total + value(row), 0));
}

function inRange(iso: string, { from, to }: ReportFilters): boolean {
  const day = iso.slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
}

/** Suma por etiqueta y deja las mayores para el gráfico. */
function topBy<T>(rows: readonly T[], label: (row: T) => string, value: (row: T) => number) {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(label(row), (totals.get(label(row)) ?? 0) + value(row));
  return [...totals]
    .map(([name, total]) => ({ label: name, value: round(total) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, CHART_LIMIT);
}

function agingBucket(dueAt: string, today: string): (typeof AGING_BUCKETS)[number] {
  const late = daysBetween(dueAt, today);
  if (late <= 0) return AGING_BUCKETS[0];
  if (late <= 30) return AGING_BUCKETS[1];
  if (late <= 60) return AGING_BUCKETS[2];
  if (late <= 90) return AGING_BUCKETS[3];
  return AGING_BUCKETS[4];
}

const DOCUMENT_COLUMNS = (party: string): ReportColumn[] => [
  { id: 'number', header: 'Documento', kind: 'code' },
  { id: 'issuedAt', header: 'Fecha', kind: 'date' },
  { id: 'party', header: party, kind: 'text' },
  { id: 'reference', header: 'Referencia', kind: 'text' },
  { id: 'subtotal', header: 'Subtotal', kind: 'money' },
  { id: 'igv', header: 'IGV', kind: 'money' },
  { id: 'total', header: 'Total', kind: 'money' },
];

function documentKpis(
  rows: readonly { subtotal: number; igv: number; total: number }[],
  noun: string,
): ReportKpi[] {
  const total = sum(rows, (row) => row.total);
  return [
    { id: 'count', label: noun, value: rows.length, kind: 'number' },
    { id: 'subtotal', label: 'Subtotal', value: sum(rows, (row) => row.subtotal), kind: 'money' },
    { id: 'total', label: 'Total con IGV', value: total, kind: 'money' },
    {
      id: 'average',
      label: 'Promedio por documento',
      value: rows.length ? round(total / rows.length) : 0,
      kind: 'money',
    },
  ];
}

function salesReport(store: Store, filters: ReportFilters): ReportResult {
  const sales = store
    .list('ventas')
    .filter((row) => row.status !== 'cancelled' && inRange(row.issuedAt, filters))
    .filter((row) => !filters.party || row.customerId === filters.party)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  return {
    title: 'Ventas del periodo',
    columns: DOCUMENT_COLUMNS('Cliente').map((column) =>
      column.id === 'reference' ? { ...column, header: 'Estado' } : column,
    ),
    rows: sales.map<ReportRow>((row) => ({
      number: row.number,
      issuedAt: row.issuedAt,
      party: row.customerName,
      reference: SALE_STATUS[row.status] ?? row.status,
      subtotal: row.subtotal,
      igv: row.igv,
      total: row.total,
    })),
    kpis: documentKpis(sales, 'Ventas'),
    chart: topBy(
      sales,
      (row) => row.customerName,
      (row) => row.total,
    ),
  };
}

function purchasesReport(store: Store, filters: ReportFilters): ReportResult {
  const bills = store
    .list('facturas-proveedor')
    .filter((row) => row.status !== 'cancelled' && inRange(row.issuedAt, filters))
    .filter((row) => !filters.party || row.supplierId === filters.party)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  return {
    title: 'Compras facturadas del periodo',
    columns: DOCUMENT_COLUMNS('Proveedor').map((column) =>
      column.id === 'reference' ? { ...column, header: 'Recepción' } : column,
    ),
    rows: bills.map<ReportRow>((row) => ({
      number: row.documentNumber,
      issuedAt: row.issuedAt,
      party: row.supplierName,
      reference: row.receiptNumber,
      subtotal: row.subtotal,
      igv: row.igv,
      total: row.total,
    })),
    kpis: documentKpis(bills, 'Facturas'),
    chart: topBy(
      bills,
      (row) => row.supplierName,
      (row) => row.total,
    ),
  };
}

function inventoryReport(store: Store, filters: ReportFilters): ReportResult {
  const items = store
    .list('stock')
    .filter((row) => !filters.party || row.warehouseId === filters.party)
    .sort((a, b) => a.productName.localeCompare(b.productName));
  const value = (row: (typeof items)[number]) => row.quantity * row.unitCost;
  return {
    title: 'Inventario valorizado al día',
    columns: [
      { id: 'sku', header: 'SKU', kind: 'code' },
      { id: 'product', header: 'Producto', kind: 'text' },
      { id: 'category', header: 'Categoría', kind: 'text' },
      { id: 'warehouse', header: 'Almacén', kind: 'text' },
      { id: 'quantity', header: 'Existencia', kind: 'number' },
      { id: 'minStock', header: 'Mínimo', kind: 'number' },
      { id: 'unitCost', header: 'Costo unit.', kind: 'money' },
      { id: 'value', header: 'Valor', kind: 'money' },
    ],
    rows: items.map<ReportRow>((row) => ({
      sku: row.sku,
      product: row.productName,
      category: row.categoryName,
      warehouse: row.warehouseName,
      quantity: row.quantity,
      minStock: row.minStock,
      unitCost: row.unitCost,
      value: round(value(row)),
    })),
    kpis: [
      { id: 'items', label: 'Productos en almacén', value: items.length, kind: 'number' },
      { id: 'units', label: 'Unidades', value: sum(items, (row) => row.quantity), kind: 'number' },
      { id: 'value', label: 'Valor del inventario', value: sum(items, value), kind: 'money' },
      {
        id: 'low',
        label: 'Bajo el mínimo',
        value: items.filter((row) => row.quantity < row.minStock).length,
        kind: 'number',
      },
    ],
    chart: topBy(items, (row) => row.categoryName, value),
  };
}

interface OpenBalance {
  side: 'cobrar' | 'pagar';
  documentNumber: string;
  party: string;
  issuedAt: string;
  dueAt: string;
  balance: number;
}

function balancesReport(store: Store, filters: ReportFilters): ReportResult {
  const today = todayIso();
  const open = (status: string, balance: number) => status !== 'cancelled' && balance > 0;
  const balances: OpenBalance[] = [
    ...store
      .list('cuentas-cobrar')
      .filter((row) => open(row.status, row.balance))
      .map((row) => ({ side: 'cobrar' as const, party: row.customerName, ...row })),
    ...store
      .list('cuentas-pagar')
      .filter((row) => open(row.status, row.balance))
      .map((row) => ({ side: 'pagar' as const, party: row.supplierName, ...row })),
  ]
    .filter(
      (row) => (!filters.party || row.side === filters.party) && inRange(row.issuedAt, filters),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const overdue = (side: OpenBalance['side']) =>
    sum(
      balances.filter((row) => row.side === side && daysBetween(row.dueAt, today) > 0),
      (row) => row.balance,
    );
  const total = (side: OpenBalance['side']) =>
    sum(
      balances.filter((row) => row.side === side),
      (row) => row.balance,
    );

  return {
    title: `Antigüedad de saldos al ${today}`,
    columns: [
      { id: 'side', header: 'Tipo', kind: 'text' },
      { id: 'documentNumber', header: 'Documento', kind: 'code' },
      { id: 'party', header: 'Cliente o proveedor', kind: 'text' },
      { id: 'dueAt', header: 'Vence', kind: 'date' },
      { id: 'late', header: 'Días vencido', kind: 'number' },
      { id: 'bucket', header: 'Tramo', kind: 'text' },
      { id: 'balance', header: 'Saldo', kind: 'money' },
    ],
    rows: balances.map<ReportRow>((row) => ({
      side: row.side === 'cobrar' ? 'Por cobrar' : 'Por pagar',
      documentNumber: row.documentNumber,
      party: row.party,
      dueAt: row.dueAt,
      late: Math.max(0, daysBetween(row.dueAt, today)),
      bucket: agingBucket(row.dueAt, today),
      balance: row.balance,
    })),
    kpis: [
      { id: 'receivable', label: 'Por cobrar', value: total('cobrar'), kind: 'money' },
      {
        id: 'receivableOverdue',
        label: 'Por cobrar vencido',
        value: overdue('cobrar'),
        kind: 'money',
      },
      { id: 'payable', label: 'Por pagar', value: total('pagar'), kind: 'money' },
      { id: 'payableOverdue', label: 'Por pagar vencido', value: overdue('pagar'), kind: 'money' },
    ],
    chart: AGING_BUCKETS.map((bucket) => ({
      label: bucket,
      value: sum(
        balances.filter((row) => agingBucket(row.dueAt, today) === bucket),
        (row) => row.balance,
      ),
    })),
  };
}

const BUILDERS: Record<ReportId, (store: Store, filters: ReportFilters) => ReportResult> = {
  ventas: salesReport,
  compras: purchasesReport,
  inventario: inventoryReport,
  saldos: balancesReport,
};

function filterSpec(store: Store, report: ReportId): ReportFilterSpec {
  const options = (rows: readonly { id: string; name: string }[]) =>
    rows
      .map((row) => ({ value: row.id, label: row.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  switch (report) {
    case 'ventas':
      return { dates: true, party: { label: 'Cliente', options: options(store.list('clientes')) } };
    case 'compras':
      return {
        dates: true,
        party: { label: 'Proveedor', options: options(store.list('proveedores')) },
      };
    case 'inventario':
      return {
        dates: false,
        party: { label: 'Almacén', options: options(store.list('almacenes')) },
      };
    case 'saldos':
      return {
        dates: true,
        party: {
          label: 'Tipo de saldo',
          options: [
            { value: 'cobrar', label: 'Por cobrar' },
            { value: 'pagar', label: 'Por pagar' },
          ],
        },
      };
  }
}

/** Reportes calculados al momento desde los mismos registros que los listados. */
export const reportsService = {
  filters(report: ReportId): Promise<ReportFilterSpec> {
    return withLatency(() => {
      sessionService.assertAccess('reportes', 'read');
      return mockDb.read((store) => filterSpec(store, report));
    });
  },

  run(report: ReportId, filters: ReportFilters): Promise<ReportResult> {
    return withLatency(() => {
      sessionService.assertAccess('reportes', 'read');
      return mockDb.read((store) => BUILDERS[report](store, filters));
    });
  },
};
