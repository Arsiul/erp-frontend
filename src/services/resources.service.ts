import { RESOURCE_MODULE, type ResourceKey, type ResourceMap } from '@/types/resources';

import * as business from './mocks/business';
import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';
import type { Store } from './mocks/store';
import { sessionService } from './session.service';

/** Valores que la interfaz envía al registrar o editar: las reglas completan y validan el resto. */
export type ResourceValues<K extends ResourceKey> = business.RecordInput<K>;

export type ResourceCapabilities = business.ResourceCapabilities;

/** Ejecuta una escritura con la sesión actual, verificando antes que su rol pueda escribir en el módulo. */
function write<T>(
  resource: ResourceKey,
  fn: (store: Store, ctx: business.BusinessContext) => T,
): Promise<T> {
  return withLatency(() => {
    const session = sessionService.assertAccess(RESOURCE_MODULE[resource], 'write');
    const ctx = sessionService.contextFor(session);
    return mockDb.transaction((store) => fn(store, ctx));
  });
}

/**
 * Lectura, registro y acciones de proceso de cada recurso.
 * Hoy resuelve todo sobre la base simulada del navegador; con la API cada llamada pasa a su endpoint
 * (ej.: ventas → POST /api/v1/sales/{id}/invoice) sin cambiar estas firmas.
 */
export const resourcesService = {
  list<K extends ResourceKey>(resource: K): Promise<ResourceMap[K][]> {
    return withLatency(() => {
      sessionService.assertAccess(RESOURCE_MODULE[resource], 'read');
      return mockDb.read((store) => store.list(resource));
    });
  },

  /** Ids de los registros nuevos que el usuario todavía no abrió. */
  unseen(resource: ResourceKey): Promise<string[]> {
    return withLatency(() => {
      sessionService.assertAccess(RESOURCE_MODULE[resource], 'read');
      return mockDb.read((store) => store.unseen(resource));
    });
  },

  /** Quita la marca de nuevo al abrir el registro; no cuenta como cambio de los datos. */
  markSeen(resource: ResourceKey, id: string): Promise<void> {
    return withLatency(() => {
      sessionService.assertAccess(RESOURCE_MODULE[resource], 'read');
      mockDb.transaction(
        (store) => {
          store.markSeen(resource, id);
        },
        { bookkeeping: true },
      );
    });
  },

  get<K extends ResourceKey>(resource: K, id: string): Promise<ResourceMap[K] | null> {
    return withLatency(() => {
      sessionService.assertAccess(RESOURCE_MODULE[resource], 'read');
      return mockDb.read((store) => store.get(resource, id) ?? null);
    });
  },

  create<K extends ResourceKey>(resource: K, values: ResourceValues<K>): Promise<ResourceMap[K]> {
    return write(resource, (store, ctx) => business.createRecord(store, ctx, resource, values));
  },

  update<K extends ResourceKey>(
    resource: K,
    id: string,
    values: ResourceValues<K>,
  ): Promise<ResourceMap[K]> {
    return write(resource, (store, ctx) => business.updateRecord(store, ctx, resource, id, values));
  },

  remove(resource: ResourceKey, id: string): Promise<void> {
    return write(resource, (store, ctx) => {
      business.removeRecord(store, ctx, resource, id);
    });
  },

  /** Acción de proceso sobre un registro (aprobar, anular, completar…). */
  runAction<K extends ResourceKey>(
    resource: K,
    id: string,
    actionId: string,
  ): Promise<ResourceMap[K]> {
    return write(resource, (store, ctx) => business.runAction(store, ctx, resource, id, actionId));
  },

  /** Lo que el recurso admite y el rol actual puede hacer; sin permiso de escritura todo queda en falso. */
  capabilities(resource: ResourceKey): ResourceCapabilities {
    const allowed = business.capabilities(resource);
    if (sessionService.can(RESOURCE_MODULE[resource], 'write')) return allowed;
    return { create: false, update: false, remove: false, actions: [] };
  },
};
