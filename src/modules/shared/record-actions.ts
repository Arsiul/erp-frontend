import type { ResourceKey, ResourceMap } from '@/types/resources';

import type { ListDefinition, StatusAction } from './list-definition';

/** Qué se puede hacer con un registro según su definición y su estado actual. */
export interface RecordCapabilities<T> {
  canEdit: boolean;
  canDelete: boolean;
  statusActions: StatusAction<T>[];
}

export function getCapabilities<K extends ResourceKey>(
  definition: ListDefinition<K>,
  row: ResourceMap[K],
): RecordCapabilities<ResourceMap[K]> {
  return {
    canEdit: Boolean(definition.form && definition.canEdit?.(row)),
    canDelete: Boolean(definition.canDelete?.(row)),
    statusActions: (definition.statusActions ?? []).filter((action) => action.when(row)),
  };
}
