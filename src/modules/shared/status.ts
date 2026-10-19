import type { BadgeValue } from '@/components/data-table/types';
import type { AccessLevel, ModuleId } from '@/types/administracion';
import type {
  BalanceStatus,
  CreditNoteReason,
  InvoiceKind,
  InvoiceStatus,
  PaymentTerm,
  QuoteStatus,
  SaleStatus,
} from '@/types/comercial';
import type { PurchaseOrderStatus, ReceiptStatus, SupplierInvoiceStatus } from '@/types/compras';
import type { DocumentCategory } from '@/types/documentos';
import type {
  AdjustmentReason,
  AdjustmentType,
  KardexOrigin,
  TransferStatus,
} from '@/types/inventario';
import type { ActiveStatus, CustomerDocumentType } from '@/types/maestros';
import type {
  MovementConcept,
  MovementStatus,
  MovementType,
  PaymentMethod,
} from '@/types/tesoreria';
import { isOverdue } from '@/utils/dates';

import type { SelectOption } from './list-definition';

/** Convierte un mapa de etiquetas (o insignias) en opciones de una lista desplegable. */
export function optionsOf(map: Record<string, string | BadgeValue>): SelectOption[] {
  return Object.entries(map).map(([value, label]) => ({
    value,
    label: typeof label === 'string' ? label : label.label,
  }));
}

export function valuesAsOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

export const RUC_PATTERN = { regex: /^\d{11}$/, message: 'El RUC debe tener 11 dígitos.' };

export const EMAIL_PATTERN = {
  regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Escribe un correo válido.',
};

export const UNIT_OPTIONS = valuesAsOptions(['UND', 'BOLSA', 'ROLLO', 'CAJA', 'GALÓN', 'METRO']);

// ─── Estados ──────────────────────────────────────────────────────────────────

export const ACTIVE_STATUS: Record<ActiveStatus, BadgeValue> = {
  active: { label: 'Activo', tone: 'success' },
  inactive: { label: 'Inactivo', tone: 'neutral' },
};

export const QUOTE_STATUS: Record<QuoteStatus, BadgeValue> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  sent: { label: 'Enviada', tone: 'info' },
  accepted: { label: 'Aceptada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
  converted: { label: 'Convertida en venta', tone: 'primary' },
};

export const SALE_STATUS: Record<SaleStatus, BadgeValue> = {
  pending_invoice: { label: 'Por facturar', tone: 'warning' },
  invoiced: { label: 'Facturada', tone: 'success' },
  cancelled: { label: 'Anulada', tone: 'neutral' },
};

export const INVOICE_STATUS: Record<InvoiceStatus, BadgeValue> = {
  issued: { label: 'Emitido', tone: 'success' },
  cancelled: { label: 'Anulado', tone: 'neutral' },
};

const BALANCE_STATUS: Record<BalanceStatus, BadgeValue> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  partial: { label: 'Parcial', tone: 'info' },
  paid: { label: 'Pagada', tone: 'success' },
  cancelled: { label: 'Anulada', tone: 'neutral' },
};

/** Estado de una cuenta por cobrar o por pagar; "Vencida" se calcula con la fecha de vencimiento. */
export function balanceBadge(row: {
  status: BalanceStatus;
  dueAt: string;
  balance: number;
}): BadgeValue {
  if (row.status !== 'cancelled' && isOverdue(row.dueAt, row.balance)) {
    return { label: 'Vencida', tone: 'danger' };
  }
  return BALANCE_STATUS[row.status];
}

export const PURCHASE_ORDER_STATUS: Record<PurchaseOrderStatus, BadgeValue> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  approved: { label: 'Aprobada', tone: 'info' },
  partial: { label: 'Recibida en parte', tone: 'warning' },
  received: { label: 'Recibida', tone: 'success' },
  cancelled: { label: 'Anulada', tone: 'neutral' },
};

export const RECEIPT_STATUS: Record<ReceiptStatus, BadgeValue> = {
  pending_bill: { label: 'Por facturar', tone: 'warning' },
  billed: { label: 'Facturada', tone: 'success' },
  cancelled: { label: 'Anulada', tone: 'neutral' },
};

export const SUPPLIER_INVOICE_STATUS: Record<SupplierInvoiceStatus, BadgeValue> = {
  registered: { label: 'Registrada', tone: 'success' },
  cancelled: { label: 'Anulada', tone: 'neutral' },
};

export const TRANSFER_STATUS: Record<TransferStatus, BadgeValue> = {
  pending: { label: 'En tránsito', tone: 'warning' },
  completed: { label: 'Completada', tone: 'success' },
  cancelled: { label: 'Anulada', tone: 'neutral' },
};

export const MOVEMENT_STATUS: Record<MovementStatus, BadgeValue> = {
  posted: { label: 'Registrado', tone: 'success' },
  voided: { label: 'Anulado', tone: 'neutral' },
};

// ─── Etiquetas ────────────────────────────────────────────────────────────────

export const CUSTOMER_DOCUMENT_TYPE: Record<CustomerDocumentType, string> = {
  RUC: 'RUC',
  DNI: 'DNI',
  CE: 'Carné de extranjería',
};

export const PAYMENT_TERM: Record<PaymentTerm, string> = {
  cash: 'Contado',
  credit: 'Crédito',
};

export const INVOICE_KIND: Record<InvoiceKind, string> = {
  factura: 'Factura',
  boleta: 'Boleta',
};

export const CREDIT_NOTE_REASON: Record<CreditNoteReason, string> = {
  return: 'Devolución',
  discount: 'Descuento',
  error: 'Error en el comprobante',
};

export const KARDEX_ORIGIN: Record<KardexOrigin, BadgeValue> = {
  initial: { label: 'Saldo inicial', tone: 'neutral' },
  sale: { label: 'Venta', tone: 'primary' },
  sale_cancel: { label: 'Anulación de venta', tone: 'neutral' },
  credit_note: { label: 'Nota de crédito', tone: 'info' },
  receipt: { label: 'Recepción', tone: 'success' },
  receipt_cancel: { label: 'Anulación de recepción', tone: 'neutral' },
  adjustment: { label: 'Ajuste', tone: 'warning' },
  transfer: { label: 'Transferencia', tone: 'info' },
};

export const ADJUSTMENT_TYPE: Record<AdjustmentType, BadgeValue> = {
  increase: { label: 'Ingreso', tone: 'success' },
  decrease: { label: 'Salida', tone: 'danger' },
};

export const ADJUSTMENT_REASON: Record<AdjustmentReason, string> = {
  count: 'Conteo físico',
  damage: 'Daño',
  expired: 'Vencimiento',
  loss: 'Pérdida',
  other: 'Otro',
};

export const MOVEMENT_TYPE: Record<MovementType, BadgeValue> = {
  income: { label: 'Ingreso', tone: 'success' },
  expense: { label: 'Egreso', tone: 'danger' },
};

export const MOVEMENT_CONCEPT: Record<MovementConcept, string> = {
  collection: 'Cobro a cliente',
  payment: 'Pago a proveedor',
  other: 'Otro',
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  transfer: 'Transferencia',
  deposit: 'Depósito',
  cash: 'Efectivo',
  check: 'Cheque',
  wallet: 'Billetera digital',
};

export const DOCUMENT_CATEGORY: Record<DocumentCategory, BadgeValue> = {
  contract: { label: 'Contrato', tone: 'primary' },
  invoice: { label: 'Comprobante', tone: 'success' },
  guide: { label: 'Guía', tone: 'info' },
  order: { label: 'Orden', tone: 'warning' },
  other: { label: 'Otro', tone: 'neutral' },
};

export const MODULE_LABEL: Record<ModuleId, string> = {
  maestros: 'Maestros',
  comercial: 'Comercial',
  compras: 'Compras',
  inventario: 'Inventario',
  tesoreria: 'Tesorería',
  documentos: 'Documentos',
  reportes: 'Reportes',
  administracion: 'Administración',
};

export const ACCESS_LEVEL: Record<AccessLevel, string> = {
  none: 'Sin acceso',
  read: 'Consulta',
  write: 'Registro',
};
