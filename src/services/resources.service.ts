import type { ResourceKey, ResourceMap } from '@/types/resources';

import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';

export type ResourceValues<K extends ResourceKey> = Omit<ResourceMap[K], 'id'>;

/**
 * Lectura y escritura de los registros de cada pantalla.
 * Hoy trabaja sobre la base simulada del navegador. Con la API (Fase 6) cada recurso se resolverá con su
 * endpoint (estructura.md §11, ej.: clientes → /api/v1/customers) sin cambiar estas firmas.
 */
export const resourcesService = {
  list<K extends ResourceKey>(resource: K): Promise<ResourceMap[K][]> {
    return withLatency(() => mockDb.list(resource));
  },

  create<K extends ResourceKey>(resource: K, values: ResourceValues<K>): Promise<ResourceMap[K]> {
    return withLatency(() => mockDb.insert(resource, values));
  },

  update<K extends ResourceKey>(
    resource: K,
    id: string,
    patch: Partial<ResourceValues<K>>,
  ): Promise<ResourceMap[K]> {
    return withLatency(() => mockDb.update(resource, id, patch));
  },

  remove(resource: ResourceKey, id: string): Promise<void> {
    return withLatency(() => {
      mockDb.remove(resource, id);
    });
  },
};
