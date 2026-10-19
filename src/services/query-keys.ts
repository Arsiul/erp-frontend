import type { ReportFilters, ReportId } from '@/types/reports';
import type { ResourceKey } from '@/types/resources';

/** Claves de caché centralizadas para evitar colisiones y facilitar invalidaciones. */
export const queryKeys = {
  session: ['session'] as const,
  settings: ['settings'] as const,
  datasetState: ['dataset', 'state'] as const,
  dashboardSummary: ['dashboard', 'summary'] as const,
  alerts: ['alerts', 'active'] as const,
  report: (report: ReportId, filters: ReportFilters) => ['reports', report, filters] as const,
  reportFilters: (report: ReportId) => ['reports', report, 'filters'] as const,
  /** Prefijo de todo lo cacheado de un recurso. */
  resource: (resource: ResourceKey) => ['resources', resource] as const,
  resourceList: (resource: ResourceKey) => ['resources', resource, 'list'] as const,
  resourceUnseen: (resource: ResourceKey) => ['resources', resource, 'unseen'] as const,
  resourceRecord: (resource: ResourceKey, id: string) =>
    ['resources', resource, 'record', id] as const,
};
