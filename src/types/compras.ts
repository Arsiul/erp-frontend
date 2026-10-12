import type { PaymentTerm } from './comercial';

export interface Supplier {
  id: string;
  name: string;
  ruc: string;
  contact: string;
  phone: string;
  /** Condición de pago que el proveedor nos otorga. */
  paymentTerm: PaymentTerm;
  balance: number;
  status: 'active' | 'inactive';
}

export interface ReplenishmentItem {
  id: string;
  productCode: string;
  product: string;
  warehouse: string;
  stock: number;
  minStock: number;
  suggestedQuantity: number;
  supplier: string;
}

export type PurchaseOrderStatus = 'draft' | 'approved' | 'partial' | 'received' | 'voided';

export interface PurchaseOrder {
  id: string;
  number: string;
  supplier: string;
  /** Fechas ISO (YYYY-MM-DD). */
  issuedAt: string;
  expectedAt: string;
  warehouse: string;
  total: number;
  status: PurchaseOrderStatus;
}

export interface Reception {
  id: string;
  number: string;
  purchaseOrder: string;
  supplier: string;
  receivedAt: string;
  warehouse: string;
  receivedBy: string;
  itemCount: number;
  status: 'complete' | 'partial' | 'voided';
}

export interface SupplierInvoice {
  id: string;
  number: string;
  supplier: string;
  purchaseOrder: string;
  issuedAt: string;
  dueAt: string;
  total: number;
  status: 'registered' | 'observed' | 'voided';
}

export interface PurchaseReturn {
  id: string;
  number: string;
  supplier: string;
  purchaseOrder: string;
  reason: string;
  returnedAt: string;
  total: number;
  status: 'registered' | 'voided';
}
