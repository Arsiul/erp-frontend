import type { ResourceKey } from '@/types/resources';

import { COMERCIAL_LISTS } from './comercial/lists';
import { COMPRAS_LISTS } from './compras/lists';
import { DOCUMENTOS_LISTS } from './documentos/lists';
import { FINANZAS_LISTS } from './finanzas/lists';
import { INVENTARIO_LISTS } from './inventario/lists';
import { REPORTES_LISTS } from './reportes/lists';
import type { ListDefinitions } from './shared/list-definition';
import { SISTEMA_LISTS } from './sistema/lists';

/** Definición de listado de cada recurso. El tipo exige que no falte ninguno. */
export const LIST_DEFINITIONS: ListDefinitions = {
  ...COMERCIAL_LISTS,
  ...COMPRAS_LISTS,
  ...INVENTARIO_LISTS,
  ...FINANZAS_LISTS,
  ...DOCUMENTOS_LISTS,
  ...REPORTES_LISTS,
  ...SISTEMA_LISTS,
};

export function isListResource(id: string): id is ResourceKey {
  return Object.hasOwn(LIST_DEFINITIONS, id);
}
