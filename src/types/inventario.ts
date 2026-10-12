export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  cost: number;
  /** Stock total sumando todos los almacenes. */
  stock: number;
  minStock: number;
  status: 'active' | 'inactive';
}

export interface CatalogEntry {
  id: string;
  type: 'category' | 'brand' | 'unit';
  name: string;
  productCount: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  manager: string;
  productCount: number;
  value: number;
}

export interface StockEntry {
  id: string;
  productCode: string;
  product: string;
  warehouse: string;
  quantity: number;
  minStock: number;
  unitCost: number;
}

export interface KardexEntry {
  id: string;
  /** Fecha y hora ISO local (YYYY-MM-DDTHH:mm). */
  date: string;
  product: string;
  warehouse: string;
  movement: string;
  document: string;
  /** Positivo = entrada, negativo = salida. */
  quantity: number;
  balance: number;
  unitCost: number;
}

export interface Transfer {
  id: string;
  number: string;
  from: string;
  to: string;
  /** Fecha ISO (YYYY-MM-DD). */
  createdAt: string;
  itemCount: number;
  createdBy: string;
  status: 'in-transit' | 'received' | 'voided';
}

export interface Adjustment {
  id: string;
  number: string;
  product: string;
  warehouse: string;
  /** Positivo = sobrante, negativo = faltante. */
  quantity: number;
  reason: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
}
