import type { ResourceKey } from '@/types/resources';

import { ADMINISTRACION_LISTS } from './administracion/lists';
import { COMERCIAL_LISTS } from './comercial/lists';
import { COMPRAS_LISTS } from './compras/lists';
import { DOCUMENTOS_LISTS } from './documentos/lists';
import { INVENTARIO_LISTS } from './inventario/lists';
import { MAESTROS_LISTS } from './maestros/lists';
import type { ListDefinitions } from './shared/list-definition';
import { TESORERIA_LISTS } from './tesoreria/lists';

/** Definición de listado de cada recurso. El tipo exige que no falte ninguno. */
export const LIST_DEFINITIONS: ListDefinitions = {
  ...MAESTROS_LISTS,
  ...COMERCIAL_LISTS,
  ...COMPRAS_LISTS,
  ...INVENTARIO_LISTS,
  ...TESORERIA_LISTS,
  ...DOCUMENTOS_LISTS,
  ...ADMINISTRACION_LISTS,
};

export function isListResource(id: string): id is ResourceKey {
  return Object.hasOwn(LIST_DEFINITIONS, id);
}
