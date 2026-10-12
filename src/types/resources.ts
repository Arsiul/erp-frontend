import type { CreditNote, Customer, Quotation, Sale, SalesOrder } from './comercial';
import type {
  PurchaseOrder,
  PurchaseReturn,
  Reception,
  ReplenishmentItem,
  Supplier,
  SupplierInvoice,
} from './compras';
import type { DocumentFile } from './documentos';
import type { Payable, Receivable, TreasuryAccount } from './finanzas';
import type {
  Adjustment,
  CatalogEntry,
  KardexEntry,
  Product,
  StockEntry,
  Transfer,
  Warehouse,
} from './inventario';
import type { ReportEntry } from './reportes';
import type {
  AuditEntry,
  BusinessParameter,
  CompanyField,
  DocumentSeries,
  Role,
  SystemUser,
} from './sistema';

/**
 * Registro que muestra cada pantalla de listado. La clave es el id del submódulo en la navegación,
 * así una pantalla, su definición de columnas y su fuente de datos quedan unidas por el tipo.
 */
export interface ResourceMap {
  clientes: Customer;
  cotizaciones: Quotation;
  pedidos: SalesOrder;
  ventas: Sale;
  'notas-credito': CreditNote;
  proveedores: Supplier;
  reposicion: ReplenishmentItem;
  'ordenes-compra': PurchaseOrder;
  recepciones: Reception;
  'facturas-proveedor': SupplierInvoice;
  'devoluciones-proveedor': PurchaseReturn;
  productos: Product;
  catalogos: CatalogEntry;
  almacenes: Warehouse;
  stock: StockEntry;
  kardex: KardexEntry;
  transferencias: Transfer;
  ajustes: Adjustment;
  'cuentas-cobrar': Receivable;
  'cuentas-pagar': Payable;
  tesoreria: TreasuryAccount;
  repositorio: DocumentFile;
  'reportes-comerciales': ReportEntry;
  'reportes-compras': ReportEntry;
  'reportes-inventario': ReportEntry;
  'reportes-financieros': ReportEntry;
  usuarios: SystemUser;
  roles: Role;
  auditoria: AuditEntry;
  empresa: CompanyField;
  series: DocumentSeries;
  parametros: BusinessParameter;
}

export type ResourceKey = keyof ResourceMap;

export type ResourceRecords = { [K in ResourceKey]: ResourceMap[K][] };
