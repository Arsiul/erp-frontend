export type PaymentTerm = 'cash' | 'credit30' | 'credit60';

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
  id: string;
  name: string;
  documentType: 'RUC' | 'DNI';
  documentNumber: string;
  contact: string;
  phone: string;
  seller: string;
  paymentTerm: PaymentTerm;
  creditLimit: number;
  balance: number;
  status: CustomerStatus;
}

export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export interface Quotation {
  id: string;
  number: string;
  customer: string;
  seller: string;
  /** Fechas ISO (YYYY-MM-DD). */
  issuedAt: string;
  validUntil: string;
  total: number;
  status: QuotationStatus;
}

export type SalesOrderStatus = 'pending' | 'partial' | 'fulfilled' | 'voided';

export interface SalesOrder {
  id: string;
  number: string;
  customer: string;
  /** Cotización de origen; null si el pedido se registró directo. */
  quotation: string | null;
  issuedAt: string;
  warehouse: string;
  total: number;
  status: SalesOrderStatus;
}

export type SaleDocumentType = 'invoice' | 'receipt';

export type SaleStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'voided';

export interface Sale {
  id: string;
  document: string;
  documentType: SaleDocumentType;
  customer: string;
  seller: string;
  issuedAt: string;
  dueAt: string;
  total: number;
  status: SaleStatus;
}

export interface CreditNote {
  id: string;
  number: string;
  /** Comprobante que modifica. */
  sale: string;
  customer: string;
  reason: string;
  issuedAt: string;
  total: number;
  status: 'issued' | 'voided';
}
