import type { ResourceRecords } from '@/types/resources';

import {
  CREDIT_NOTES_MOCK,
  CUSTOMERS_MOCK,
  QUOTATIONS_MOCK,
  SALES_MOCK,
  SALES_ORDERS_MOCK,
} from './comercial.mock';
import {
  PURCHASE_ORDERS_MOCK,
  PURCHASE_RETURNS_MOCK,
  RECEPTIONS_MOCK,
  REPLENISHMENT_MOCK,
  SUPPLIER_INVOICES_MOCK,
  SUPPLIERS_MOCK,
} from './compras.mock';
import { PAYABLES_MOCK, RECEIVABLES_MOCK, TREASURY_ACCOUNTS_MOCK } from './finanzas.mock';
import {
  ADJUSTMENTS_MOCK,
  CATALOG_MOCK,
  KARDEX_MOCK,
  PRODUCTS_MOCK,
  STOCK_MOCK,
  TRANSFERS_MOCK,
  WAREHOUSES_MOCK,
} from './inventario.mock';
import {
  AUDIT_MOCK,
  COMPANY_MOCK,
  PARAMETERS_MOCK,
  ROLES_MOCK,
  SERIES_MOCK,
  USERS_MOCK,
} from './sistema.mock';
import {
  COMMERCIAL_REPORTS_MOCK,
  DOCUMENTS_MOCK,
  FINANCIAL_REPORTS_MOCK,
  INVENTORY_REPORTS_MOCK,
  PURCHASE_REPORTS_MOCK,
} from './soporte.mock';

/** Datos de demostración de todas las pantallas de listado. El tipo exige que no falte ninguna. */
export const RESOURCE_MOCKS: ResourceRecords = {
  clientes: CUSTOMERS_MOCK,
  cotizaciones: QUOTATIONS_MOCK,
  pedidos: SALES_ORDERS_MOCK,
  ventas: SALES_MOCK,
  'notas-credito': CREDIT_NOTES_MOCK,
  proveedores: SUPPLIERS_MOCK,
  reposicion: REPLENISHMENT_MOCK,
  'ordenes-compra': PURCHASE_ORDERS_MOCK,
  recepciones: RECEPTIONS_MOCK,
  'facturas-proveedor': SUPPLIER_INVOICES_MOCK,
  'devoluciones-proveedor': PURCHASE_RETURNS_MOCK,
  productos: PRODUCTS_MOCK,
  catalogos: CATALOG_MOCK,
  almacenes: WAREHOUSES_MOCK,
  stock: STOCK_MOCK,
  kardex: KARDEX_MOCK,
  transferencias: TRANSFERS_MOCK,
  ajustes: ADJUSTMENTS_MOCK,
  'cuentas-cobrar': RECEIVABLES_MOCK,
  'cuentas-pagar': PAYABLES_MOCK,
  tesoreria: TREASURY_ACCOUNTS_MOCK,
  repositorio: DOCUMENTS_MOCK,
  'reportes-comerciales': COMMERCIAL_REPORTS_MOCK,
  'reportes-compras': PURCHASE_REPORTS_MOCK,
  'reportes-inventario': INVENTORY_REPORTS_MOCK,
  'reportes-financieros': FINANCIAL_REPORTS_MOCK,
  usuarios: USERS_MOCK,
  roles: ROLES_MOCK,
  auditoria: AUDIT_MOCK,
  empresa: COMPANY_MOCK,
  series: SERIES_MOCK,
  parametros: PARAMETERS_MOCK,
};
