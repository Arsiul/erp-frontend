import { useQuery } from '@tanstack/react-query';

import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/services/query-keys';

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => dashboardService.getSummary(),
  });
}
