import type { ResourceKey } from '@/types/resources';

/** Claves de caché centralizadas para evitar colisiones y facilitar invalidaciones. */
export const queryKeys = {
  dashboardSummary: ['dashboard', 'summary'] as const,
  alerts: ['alerts', 'active'] as const,
  /** Prefijo de todo lo cacheado de un recurso (para invalidar tras escribir). */
  resource: (resource: ResourceKey) => ['resources', resource] as const,
  resourceList: (resource: ResourceKey) => ['resources', resource, 'list'] as const,
};
