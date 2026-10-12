import { useQuery } from '@tanstack/react-query';

import { alertsService } from '@/services/alerts.service';
import { queryKeys } from '@/services/query-keys';

/** Alertas activas; las comparten la campana del encabezado y el dashboard (una sola petición). */
export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => alertsService.getActive(),
  });
}
