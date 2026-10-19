import { resourcesService, type ResourceCapabilities } from '@/services/resources.service';
import { RESOURCE_MODULE, type ResourceKey, type ResourceMap } from '@/types/resources';
import type { AccessLevel, ModuleId } from '@/types/administracion';

import type { FlowAction, ListDefinition, ProcessAction } from './list-definition';

/** Lo que se puede hacer con un registro concreto, ya cruzado con su estado y el rol de la sesión. */
export interface RecordActions<T> {
  canEdit: boolean;
  canRemove: boolean;
  process: ProcessAction<T>[];
  flow: FlowAction<T>[];
}

export type CanAccess = (module: ModuleId, level?: AccessLevel) => boolean;

export function hasAnyAction<T>(actions: RecordActions<T>): boolean {
  return (
    actions.canEdit || actions.canRemove || actions.process.length > 0 || actions.flow.length > 0
  );
}

/**
 * Una acción de flujo que filtra el listado destino pide poder consultarlo; si abre un formulario,
 * el rol debe poder registrar en ese módulo.
 */
function flowAllowed<T>(action: FlowAction<T>, can: CanAccess): boolean {
  const module = RESOURCE_MODULE[action.target];
  if (action.search !== undefined) return can(module, 'read');
  return can(module, 'write') && resourcesService.capabilities(action.target).create;
}

/** Lo que admite el recurso, recortado a lo que el rol puede hacer en su módulo. */
export function roleCapabilities(resource: ResourceKey, can: CanAccess): ResourceCapabilities {
  const capabilities = resourcesService.capabilities(resource);
  if (can(RESOURCE_MODULE[resource], 'write')) return capabilities;
  return { create: false, update: false, remove: false, actions: [] };
}

export function recordActions<K extends ResourceKey>(
  definition: ListDefinition<K>,
  capabilities: ResourceCapabilities,
  row: ResourceMap[K],
  can: CanAccess,
): RecordActions<ResourceMap[K]> {
  const allowedActions = new Set(capabilities.actions.map((action) => action.id));
  return {
    canEdit:
      Boolean(definition.form) && capabilities.update && (definition.editWhen?.(row) ?? true),
    canRemove: capabilities.remove && (definition.removeWhen?.(row) ?? true),
    process: (definition.processActions ?? []).filter(
      (action) => allowedActions.has(action.id) && action.when(row),
    ),
    flow: (definition.flowActions ?? []).filter(
      (action) => (action.when?.(row) ?? true) && flowAllowed(action, can),
    ),
  };
}
