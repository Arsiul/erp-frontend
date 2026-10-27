import type { ResourceKey } from '@/types/resources';

import { api, download } from './http/client';
import { USE_API } from './http/config';

/** Recursos que el backend importa desde CSV (cabecera + líneas en los documentos). */
const IMPORTABLE: readonly string[] = [
  'clientes',
  'proveedores',
  'categorias',
  'productos',
  'almacenes',
  'cuentas-bancarias',
  'cotizaciones',
  'ventas',
  'ordenes-compra',
];

/** Recursos que el backend exporta con sus relaciones (códigos de cliente, SKU, almacén…). */
const EXPORTABLE: readonly string[] = [
  ...IMPORTABLE,
  'comprobantes',
  'cuentas-cobrar',
  'cuentas-pagar',
  'stock',
  'kardex',
  'movimientos',
];

export interface ImportError {
  line: number;
  message: string;
}

export type ImportResult =
  | { ok: true; created: number; updated: number }
  | { ok: false; errors: ImportError[] };

const path = (resource: ResourceKey, action: string) => `/transferencia/${resource}/${action}`;

export const transferService = {
  canExport: (resource: ResourceKey) => USE_API && EXPORTABLE.includes(resource),
  canImport: (resource: ResourceKey) => USE_API && IMPORTABLE.includes(resource),
  exportCsv: (resource: ResourceKey) => download(path(resource, 'exportar')),
  template: (resource: ResourceKey) => download(path(resource, 'plantilla')),
  importCsv: (resource: ResourceKey, csv: string) =>
    api.post<ImportResult>(path(resource, 'importar'), { csv }),
};
