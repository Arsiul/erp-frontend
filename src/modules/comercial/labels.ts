import type { BadgeValue } from '@/components/data-table/types';
import type {
  CustomerStatus,
  QuotationStatus,
  SaleDocumentType,
  SaleStatus,
  SalesOrderStatus,
} from '@/types/comercial';

export const CUSTOMER_STATUS: Record<CustomerStatus, BadgeValue> = {
  active: { label: 'Activo', tone: 'success', appearance: 'soft' },
  inactive: { label: 'Inactivo', tone: 'neutral', appearance: 'soft' },
  blocked: { label: 'Bloqueado', tone: 'danger', appearance: 'soft' },
};

export const QUOTATION_STATUS: Record<QuotationStatus, BadgeValue> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  sent: { label: 'Enviada', tone: 'info' },
  approved: { label: 'Aprobada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
  expired: { label: 'Vencida', tone: 'warning' },
};

export const SALES_ORDER_STATUS: Record<SalesOrderStatus, BadgeValue> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  partial: { label: 'Atendido parcial', tone: 'info' },
  fulfilled: { label: 'Atendido', tone: 'success' },
  voided: { label: 'Anulado', tone: 'neutral' },
};

export const SALE_STATUS: Record<SaleStatus, BadgeValue> = {
  paid: { label: 'Pagada', tone: 'success' },
  partial: { label: 'Pago parcial', tone: 'info' },
  pending: { label: 'Pendiente', tone: 'warning' },
  overdue: { label: 'Vencida', tone: 'danger' },
  voided: { label: 'Anulada', tone: 'neutral' },
};

export const SALE_DOCUMENT_TYPE: Record<SaleDocumentType, BadgeValue> = {
  invoice: { label: 'Factura', tone: 'primary', appearance: 'soft' },
  receipt: { label: 'Boleta', tone: 'info', appearance: 'soft' },
};
