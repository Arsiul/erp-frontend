import type { ActiveStatus } from './maestros';

/** Grupos del menú sujetos a permisos (Inicio siempre es visible). */
export type ModuleId =
  | 'maestros'
  | 'comercial'
  | 'compras'
  | 'inventario'
  | 'tesoreria'
  | 'documentos'
  | 'reportes'
  | 'administracion';

export const MODULE_IDS = [
  'maestros',
  'comercial',
  'compras',
  'inventario',
  'tesoreria',
  'documentos',
  'reportes',
  'administracion',
] as const satisfies readonly ModuleId[];

/** none = no ve el módulo; read = solo consulta; write = puede registrar y ejecutar acciones. */
export type AccessLevel = 'none' | 'read' | 'write';

export type Permissions = Record<ModuleId, AccessLevel>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permissions;
  /** Los roles del sistema no se editan ni eliminan. */
  system: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  status: ActiveStatus;
  lastAccessAt: string;
}

/** Registro automático de cada operación. */
export interface AuditEntry {
  id: string;
  date: string;
  userName: string;
  module: ModuleId;
  resource: string;
  action: string;
  reference: string;
}

export interface Settings {
  companyName: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  /** Tasa del IGV (0.18 = 18 %). */
  igvRate: number;
  invoiceSeries: string;
  receiptSeries: string;
  creditNoteSeries: string;
  quoteValidityDays: number;
}
