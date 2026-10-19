/** Estado de un registro maestro: los inactivos se conservan, pero no se ofrecen en operaciones nuevas. */
export type ActiveStatus = 'active' | 'inactive';

export type CustomerDocumentType = 'RUC' | 'DNI' | 'CE';

export interface Customer {
  id: string;
  code: string;
  name: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  /** Días de crédito; 0 = solo contado. */
  creditDays: number;
  creditLimit: number;
  status: ActiveStatus;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  ruc: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  /** Plazo de pago que da el proveedor. */
  paymentDays: number;
  status: ActiveStatus;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ActiveStatus;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  salePrice: number;
  /** Costo de referencia (promedio ponderado tras cada recepción). */
  costPrice: number;
  /** Debajo de este stock el producto se marca para reponer. */
  minStock: number;
  status: ActiveStatus;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  manager: string;
  status: ActiveStatus;
}
