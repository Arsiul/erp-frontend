import type { BalanceStatus, DocumentLine, DocumentTotals } from './comercial';

export interface PurchaseLine extends DocumentLine {
  receivedQuantity: number;
}

export type PurchaseOrderStatus = 'draft' | 'approved' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrder extends DocumentTotals {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  issuedAt: string;
  expectedAt: string;
  lines: PurchaseLine[];
  status: PurchaseOrderStatus;
  notes: string;
}

export type ReceiptStatus = 'pending_bill' | 'billed' | 'cancelled';

/** Recepción de mercadería contra una orden de compra. */
export interface Receipt {
  id: string;
  number: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receivedAt: string;
  /** Guía de remisión del proveedor. */
  guideNumber: string;
  lines: DocumentLine[];
  /** Valor de lo recibido sin IGV. */
  subtotal: number;
  status: ReceiptStatus;
  supplierInvoiceNumber: string;
}

export type SupplierInvoiceStatus = 'registered' | 'cancelled';

export interface SupplierInvoice extends DocumentTotals {
  id: string;
  /** Número del comprobante del proveedor: F002-0004512. */
  documentNumber: string;
  supplierId: string;
  supplierName: string;
  receiptId: string;
  receiptNumber: string;
  issuedAt: string;
  dueAt: string;
  status: SupplierInvoiceStatus;
}

export interface Payable {
  id: string;
  supplierInvoiceId: string;
  documentNumber: string;
  supplierId: string;
  supplierName: string;
  issuedAt: string;
  dueAt: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: BalanceStatus;
}
