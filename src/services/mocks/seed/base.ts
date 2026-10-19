import {
  MODULE_IDS,
  type AccessLevel,
  type Permissions,
  type Role,
  type Settings,
  type User,
} from '@/types/administracion';
import { RESOURCE_KEYS, type ResourceRecords } from '@/types/resources';

import type { MockDatabase } from '../store';

export const DB_VERSION = 2;

export const ADMIN_USER_ID = 'usr-admin';
export const ADMIN_ROLE_ID = 'role-admin';

export const DEFAULT_SETTINGS: Settings = {
  companyName: 'Andes Tech Distribuciones S.A.C.',
  ruc: '20612345671',
  address: 'Av. Nicolás Ayllón 2480, Ate, Lima',
  phone: '01 715 2040',
  email: 'contacto@andestech.demo',
  igvRate: 0.18,
  invoiceSeries: 'F001',
  receiptSeries: 'B001',
  creditNoteSeries: 'FC01',
  quoteValidityDays: 15,
};

function permissions(defaultLevel: AccessLevel, overrides: Partial<Permissions> = {}): Permissions {
  return {
    ...Object.fromEntries(MODULE_IDS.map((module) => [module, defaultLevel])),
    ...overrides,
  } as Permissions;
}

export const BASE_ROLES: Role[] = [
  {
    id: ADMIN_ROLE_ID,
    name: 'Administrador',
    description: 'Acceso total, incluida la administración de usuarios y la configuración.',
    permissions: permissions('write'),
    system: true,
  },
  {
    id: 'role-ventas',
    name: 'Ventas',
    description: 'Cotiza, vende, factura y consulta el stock y las cuentas por cobrar.',
    permissions: permissions('none', {
      maestros: 'read',
      comercial: 'write',
      inventario: 'read',
      documentos: 'write',
      reportes: 'read',
    }),
    system: false,
  },
  {
    id: 'role-compras',
    name: 'Compras y almacén',
    description: 'Gestiona órdenes, recepciones, facturas de proveedor e inventario.',
    permissions: permissions('none', {
      maestros: 'write',
      compras: 'write',
      inventario: 'write',
      documentos: 'write',
      reportes: 'read',
    }),
    system: false,
  },
  {
    id: 'role-tesoreria',
    name: 'Tesorería',
    description: 'Registra cobros y pagos y concilia las cuentas bancarias.',
    permissions: permissions('none', {
      maestros: 'read',
      comercial: 'read',
      compras: 'read',
      tesoreria: 'write',
      documentos: 'read',
      reportes: 'read',
    }),
    system: false,
  },
  {
    id: 'role-consulta',
    name: 'Consulta',
    description: 'Solo lectura de todos los módulos operativos.',
    permissions: permissions('read', { administracion: 'none' }),
    system: false,
  },
];

export const BASE_USERS: User[] = [
  {
    id: ADMIN_USER_ID,
    name: 'Administrador Demo',
    email: 'admin@andestech.demo',
    roleId: ADMIN_ROLE_ID,
    roleName: 'Administrador',
    status: 'active',
    lastAccessAt: '',
  },
  {
    id: 'usr-ventas',
    name: 'Lucía Paredes',
    email: 'ventas@andestech.demo',
    roleId: 'role-ventas',
    roleName: 'Ventas',
    status: 'active',
    lastAccessAt: '',
  },
  {
    id: 'usr-compras',
    name: 'Jorge Salazar',
    email: 'compras@andestech.demo',
    roleId: 'role-compras',
    roleName: 'Compras y almacén',
    status: 'active',
    lastAccessAt: '',
  },
  {
    id: 'usr-tesoreria',
    name: 'Carmen Quispe',
    email: 'tesoreria@andestech.demo',
    roleId: 'role-tesoreria',
    roleName: 'Tesorería',
    status: 'active',
    lastAccessAt: '',
  },
  {
    id: 'usr-consulta',
    name: 'Gerencia',
    email: 'gerencia@andestech.demo',
    roleId: 'role-consulta',
    roleName: 'Consulta',
    status: 'active',
    lastAccessAt: '',
  },
];

export function emptyRecords(): ResourceRecords {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, []])) as unknown as ResourceRecords;
}

/** Base sin operaciones: solo los usuarios, roles y la configuración por defecto. */
export function baseDatabase(): MockDatabase {
  const records = emptyRecords();
  records.roles = structuredClone(BASE_ROLES);
  records.usuarios = structuredClone(BASE_USERS);
  return {
    version: DB_VERSION,
    state: 'empty',
    records,
    settings: { ...DEFAULT_SETTINGS },
    sequences: {},
    unseen: {},
  };
}
