import { useMutation, useQueryClient } from '@tanstack/react-query';

import { resourcesService, type ResourceValues } from '@/services/resources.service';
import type { ResourceKey } from '@/types/resources';

/**
 * Crear, actualizar, eliminar y ejecutar procesos sobre un recurso. Un proceso (facturar, recibir, cobrar…)
 * toca varios recursos a la vez, así que tras cada cambio se recarga todo lo cacheado.
 */
export function useResourceMutations<K extends ResourceKey>(resource: K) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries();

  const create = useMutation({
    mutationFn: (values: ResourceValues<K>) => resourcesService.create(resource, values),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ResourceValues<K> }) =>
      resourcesService.update(resource, id, values),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => resourcesService.remove(resource, id),
    onSuccess: refresh,
  });

  const runAction = useMutation({
    mutationFn: ({ id, actionId }: { id: string; actionId: string }) =>
      resourcesService.runAction(resource, id, actionId),
    onSuccess: refresh,
  });

  return { create, update, remove, runAction };
}
