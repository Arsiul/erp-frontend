/** Línea de un documento comercial o de compra. */
export interface DocumentLine {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface DocumentTotals {
  subtotal: number;
  igv: number;
  total: number;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';

export interface Quote extends DocumentTotals {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  issuedAt: string;
  validUntil: string;
  seller: string;
  lines: DocumentLine[];
  status: QuoteStatus;
  /** Venta generada al convertirla. */
  saleNumber: string;
  notes: string;
}

export type PaymentTerm = 'cash' | 'credit';

export type SaleStatus = 'pending_invoice' | 'invoiced' | 'cancelled';

export interface Sale extends DocumentTotals {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  quoteId: string;
  quoteNumber: string;
  issuedAt: string;
  seller: string;
  paymentTerm: PaymentTerm;
  lines: DocumentLine[];
  status: SaleStatus;
  invoiceId: string;
  invoiceNumber: string;
  notes: string;
}

export type InvoiceKind = 'factura' | 'boleta';

export type InvoiceStatus = 'issued' | 'cancelled';

/** Comprobante de pago emitido (simulado, sin envío a SUNAT). */
export interface Invoice extends DocumentTotals {
  id: string;
  kind: InvoiceKind;
  /** Serie y correlativo: F001-00000123. */
  number: string;
  saleId: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  warehouseId: string;
  issuedAt: string;
  dueAt: string;
  lines: DocumentLine[];
  /** Suma de las notas de crédito emitidas sobre el comprobante. */
  creditedAmount: number;
  status: InvoiceStatus;
}

export type CreditNoteReason = 'return' | 'discount' | 'error';

export interface CreditNote extends DocumentTotals {
  id: string;
  number: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  issuedAt: string;
  reason: CreditNoteReason;
  lines: DocumentLine[];
  notes: string;
}

/** Estado guardado de una cuenta; "vencida" se deriva de la fecha. */
export type BalanceStatus = 'pending' | 'partial' | 'paid' | 'cancelled';

export interface Receivable {
  id: string;
  invoiceId: string;
  documentNumber: string;
  customerId: string;
  customerName: string;
  issuedAt: string;
  dueAt: string;
  amount: number;
  paidAmount: number;
  creditedAmount: number;
  balance: number;
  status: BalanceStatus;
}
