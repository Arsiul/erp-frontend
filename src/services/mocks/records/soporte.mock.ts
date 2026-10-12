import type { DocumentFile } from '@/types/documentos';
import type { ReportEntry } from '@/types/reportes';

/** Datos de demostración para Documentos y Reportes. Nombres ficticios. */

export const DOCUMENTS_MOCK: DocumentFile[] = [
  {
    id: 'doc-001',
    name: 'F001-002341.pdf',
    kind: 'receipt',
    linkedTo: 'Venta F001-002341',
    uploadedBy: 'Carla Mendoza',
    uploadedAt: '2026-10-10',
    sizeKb: 84,
  },
  {
    id: 'doc-002',
    name: 'F002-004518-ColorTotal.pdf',
    kind: 'supplier-invoice',
    linkedTo: 'Factura de proveedor F002-004518',
    uploadedBy: 'Ana Villanueva',
    uploadedAt: '2026-10-09',
    sizeKb: 310,
  },
  {
    id: 'doc-003',
    name: 'B001-000874.pdf',
    kind: 'receipt',
    linkedTo: 'Venta B001-000874',
    uploadedBy: 'Lucía Torres',
    uploadedAt: '2026-10-09',
    sizeKb: 76,
  },
  {
    id: 'doc-004',
    name: 'Contrato-marco-Los-Cedros-2026.pdf',
    kind: 'contract',
    linkedTo: 'Cliente Constructora Los Cedros S.A.C.',
    uploadedBy: 'Patricia Gómez',
    uploadedAt: '2026-09-30',
    sizeKb: 1240,
  },
  {
    id: 'doc-005',
    name: 'Ficha-tecnica-cemento-tipo-I.pdf',
    kind: 'datasheet',
    linkedTo: 'Producto CEM-001',
    uploadedBy: 'Miguel Rojas',
    uploadedAt: '2026-09-15',
    sizeKb: 560,
  },
];

const PDF_EXCEL = 'PDF · Excel';

export const COMMERCIAL_REPORTS_MOCK: ReportEntry[] = [
  {
    id: 'rc-001',
    name: 'Ventas por período',
    description: 'Ventas diarias, semanales o mensuales con comparación al período anterior.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-11',
  },
  {
    id: 'rc-002',
    name: 'Ventas por cliente',
    description: 'Ranking de clientes por monto comprado y número de comprobantes.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-08',
  },
  {
    id: 'rc-003',
    name: 'Conversión de cotizaciones',
    description: 'Cotizaciones emitidas frente a las aprobadas, por vendedor.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-05',
  },
  {
    id: 'rc-004',
    name: 'Utilidad por producto',
    description: 'Margen bruto por producto y categoría.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-09-30',
  },
];

export const PURCHASE_REPORTS_MOCK: ReportEntry[] = [
  {
    id: 'rp-001',
    name: 'Compras por proveedor',
    description: 'Monto comprado a cada proveedor en el período.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-10',
  },
  {
    id: 'rp-002',
    name: 'Órdenes pendientes de recibir',
    description: 'Órdenes aprobadas o parciales con su fecha de entrega esperada.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-12',
  },
  {
    id: 'rp-003',
    name: 'Comparativo de precios',
    description: 'Precio de compra de un mismo producto entre proveedores.',
    formats: 'Excel',
    lastGeneratedAt: '2026-09-28',
  },
];

export const INVENTORY_REPORTS_MOCK: ReportEntry[] = [
  {
    id: 'ri-001',
    name: 'Stock valorizado por almacén',
    description: 'Cantidades y valor del inventario a costo promedio.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-11',
  },
  {
    id: 'ri-002',
    name: 'Productos bajo stock mínimo',
    description: 'Productos que necesitan reposición, por almacén.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-12',
  },
  {
    id: 'ri-003',
    name: 'Productos sin movimiento',
    description: 'Productos sin ventas en los últimos 90 días.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-01',
  },
  {
    id: 'ri-004',
    name: 'Rotación de inventario',
    description: 'Veces que rota el inventario por categoría.',
    formats: 'Excel',
    lastGeneratedAt: '2026-09-30',
  },
];

export const FINANCIAL_REPORTS_MOCK: ReportEntry[] = [
  {
    id: 'rf-001',
    name: 'Antigüedad de cuentas por cobrar',
    description: 'Deuda de clientes agrupada en 0–30, 31–60, 61–90 y más de 90 días.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-12',
  },
  {
    id: 'rf-002',
    name: 'Morosidad por cliente',
    description: 'Clientes con facturas vencidas y días de atraso.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-09',
  },
  {
    id: 'rf-003',
    name: 'Calendario de pagos',
    description: 'Vencimientos de cuentas por pagar de las próximas semanas.',
    formats: PDF_EXCEL,
    lastGeneratedAt: '2026-10-11',
  },
  {
    id: 'rf-004',
    name: 'Flujo de caja',
    description: 'Ingresos frente a egresos por cuenta de tesorería.',
    formats: 'Excel',
    lastGeneratedAt: '2026-10-06',
  },
];
