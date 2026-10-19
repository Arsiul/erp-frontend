/** Existencias de un producto en un almacén. */
export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minStock: number;
  unitCost: number;
}

export type KardexOrigin =
  | 'initial'
  | 'sale'
  | 'sale_cancel'
  | 'credit_note'
  | 'receipt'
  | 'receipt_cancel'
  | 'adjustment'
  | 'transfer';

/** Movimiento de inventario; lo generan las operaciones, nunca se edita. */
export interface KardexEntry {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  origin: KardexOrigin;
  reference: string;
  /** Positivo = entrada, negativo = salida. */
  quantity: number;
  /** Saldo del producto en el almacén después del movimiento. */
  balance: number;
  unitCost: number;
}

export type AdjustmentType = 'increase' | 'decrease';

export type AdjustmentReason = 'count' | 'damage' | 'expired' | 'loss' | 'other';

export interface StockAdjustment {
  id: string;
  number: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  type: AdjustmentType;
  quantity: number;
  reason: AdjustmentReason;
  notes: string;
}

export type TransferStatus = 'pending' | 'completed' | 'cancelled';

export interface Transfer {
  id: string;
  number: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  originWarehouseId: string;
  originWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  quantity: number;
  status: TransferStatus;
  notes: string;
}
