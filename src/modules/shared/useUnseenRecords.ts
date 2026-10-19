import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/services/query-keys';
import { resourcesService } from '@/services/resources.service';
import type { ResourceKey } from '@/types/resources';

/** Registros recién creados que el usuario aún no abrió, y cómo quitarles la marca de nuevo. */
export function useUnseenRecords(resource: ResourceKey) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.resourceUnseen(resource);
  const { data } = useQuery({ queryKey, queryFn: () => resourcesService.unseen(resource) });

  const { mutate } = useMutation({
    mutationFn: (id: string) => resourcesService.markSeen(resource, id),
    // La marca se quita al instante; la base se actualiza detrás.
    onMutate: (id) => {
      queryClient.setQueryData<string[]>(queryKey, (ids) => ids?.filter((other) => other !== id));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const unseen = new Set(data);
  return {
    isNew: (id: string) => unseen.has(id),
    markSeen: (id: string) => {
      if (unseen.has(id)) mutate(id);
    },
  };
}
