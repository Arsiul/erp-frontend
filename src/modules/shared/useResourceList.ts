import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/services/query-keys';
import { resourcesService } from '@/services/resources.service';
import type { ResourceKey } from '@/types/resources';

export function useResourceList<K extends ResourceKey>(resource: K) {
  return useQuery({
    queryKey: queryKeys.resourceList(resource),
    queryFn: () => resourcesService.list(resource),
  });
}
