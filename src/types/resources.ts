import type { AuditEntry, ModuleId, Role, User } from './administracion';
import type { CreditNote, Invoice, Quote, Receivable, Sale } from './comercial';
import type { Payable, PurchaseOrder, Receipt, SupplierInvoice } from './compras';
import type { StoredDocument } from './documentos';
import type { KardexEntry, StockAdjustment, StockItem, Transfer } from './inventario';
import type { Category, Customer, Product, Supplier, Warehouse } from './maestros';
import type { BankAccount, CashMovement } from './tesoreria';

/**
 * Registro de cada pantalla de listado. La clave es el id del submódulo en la navegación,
 * así una pantalla, su definición y su fuente de datos quedan unidas por el tipo.
 */
export interface ResourceMap {
  clientes: Customer;
  proveedores: Supplier;
  productos: Product;
  categorias: Category;
  almacenes: Warehouse;
  cotizaciones: Quote;
  ventas: Sale;
  comprobantes: Invoice;
  'notas-credito': CreditNote;
  'cuentas-cobrar': Receivable;
  'ordenes-compra': PurchaseOrder;
  recepciones: Receipt;
  'facturas-proveedor': SupplierInvoice;
  'cuentas-pagar': Payable;
  stock: StockItem;
  kardex: KardexEntry;
  ajustes: StockAdjustment;
  transferencias: Transfer;
  'cuentas-bancarias': BankAccount;
  movimientos: CashMovement;
  documentos: StoredDocument;
  usuarios: User;
  roles: Role;
  auditoria: AuditEntry;
}

export type ResourceKey = keyof ResourceMap;

export type ResourceRecords = { [K in ResourceKey]: ResourceMap[K][] };

export const RESOURCE_KEYS = [
  'clientes',
  'proveedores',
  'productos',
  'categorias',
  'almacenes',
  'cotizaciones',
  'ventas',
  'comprobantes',
  'notas-credito',
  'cuentas-cobrar',
  'ordenes-compra',
  'recepciones',
  'facturas-proveedor',
  'cuentas-pagar',
  'stock',
  'kardex',
  'ajustes',
  'transferencias',
  'cuentas-bancarias',
  'movimientos',
  'documentos',
  'usuarios',
  'roles',
  'auditoria',
] as const satisfies readonly ResourceKey[];

/** Grupo de menú (y permiso) al que pertenece cada recurso. */
export const RESOURCE_MODULE = {
  clientes: 'maestros',
  proveedores: 'maestros',
  productos: 'maestros',
  categorias: 'maestros',
  almacenes: 'maestros',
  'cuentas-bancarias': 'maestros',
  cotizaciones: 'comercial',
  ventas: 'comercial',
  comprobantes: 'comercial',
  'notas-credito': 'comercial',
  'cuentas-cobrar': 'comercial',
  'ordenes-compra': 'compras',
  recepciones: 'compras',
  'facturas-proveedor': 'compras',
  'cuentas-pagar': 'compras',
  stock: 'inventario',
  kardex: 'inventario',
  ajustes: 'inventario',
  transferencias: 'inventario',

  movimientos: 'tesoreria',
  documentos: 'documentos',
  usuarios: 'administracion',
  roles: 'administracion',
  auditoria: 'administracion',
} as const satisfies Record<ResourceKey, ModuleId>;
