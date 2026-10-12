import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/services/query-keys';
import { resourcesService, type ResourceValues } from '@/services/resources.service';
import type { ResourceKey } from '@/types/resources';

/** Crear, actualizar y eliminar registros de un recurso; tras cada cambio se recarga su listado. */
export function useResourceMutations<K extends ResourceKey>(resource: K) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.resource(resource) });

  const create = useMutation({
    mutationFn: (values: ResourceValues<K>) => resourcesService.create(resource, values),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ResourceValues<K>> }) =>
      resourcesService.update(resource, id, patch),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => resourcesService.remove(resource, id),
    onSuccess: refresh,
  });

  return { create, update, remove };
}
