import type { ActiveStatus } from '@/types/maestros';
import type { ResourceKey, ResourceMap } from '@/types/resources';

import type { RecordValues, Store } from '../store';

import { fail, type BusinessContext } from './context';

/** Lo que llega de un formulario: cualquier subconjunto de campos, aún sin validar. */
export type RecordInput<K extends ResourceKey> = Partial<RecordValues<K>>;

export interface RecordAction<K extends ResourceKey> {
  /** Verbo que queda en la auditoría ("Aprobó", "Anuló"…). */
  label: string;
  run: (store: Store, ctx: BusinessContext, current: ResourceMap[K]) => void;
}

/**
 * Reglas de un recurso. Lo que no se define no se permite: un comprobante, por ejemplo, no tiene
 * `update` porque se corrige con una nota de crédito.
 */
export interface ResourceRules<K extends ResourceKey> {
  create?: (store: Store, ctx: BusinessContext, input: RecordInput<K>) => ResourceMap[K];
  update?: (
    store: Store,
    ctx: BusinessContext,
    current: ResourceMap[K],
    input: RecordInput<K>,
  ) => ResourceMap[K];
  remove?: (store: Store, ctx: BusinessContext, current: ResourceMap[K]) => void;
  actions?: Record<string, RecordAction<K>>;
}

type WithStatus = {
  [K in ResourceKey]: ResourceMap[K] extends { status: ActiveStatus } ? K : never;
}[ResourceKey];

/** Acciones Activar/Desactivar para los maestros con estado activo/inactivo. */
export function activationActions<K extends WithStatus>(
  resource: K,
): { activate: RecordAction<K>; deactivate: RecordAction<K> } {
  const setStatus = (store: Store, id: string, status: ActiveStatus) =>
    (store.update as (r: ResourceKey, id: string, patch: { status: ActiveStatus }) => unknown)(
      resource,
      id,
      { status },
    );

  return {
    activate: {
      label: 'Activó',
      run(store, _ctx, current) {
        if (current.status === 'active') fail('El registro ya está activo.');
        setStatus(store, current.id, 'active');
      },
    },
    deactivate: {
      label: 'Desactivó',
      run(store, _ctx, current) {
        if (current.status === 'inactive') fail('El registro ya está inactivo.');
        setStatus(store, current.id, 'inactive');
      },
    },
  };
}

/** Falla si otro registro ya usa el mismo valor (sin distinguir mayúsculas). */
export function assertUnique<T extends { id: string }>(
  rows: readonly T[],
  value: string,
  pick: (row: T) => string,
  message: string,
  exceptId?: string,
): void {
  const normalized = value.trim().toLowerCase();
  if (rows.some((row) => row.id !== exceptId && pick(row).trim().toLowerCase() === normalized)) {
    fail(message);
  }
}

export function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  message: string,
  fallback?: T,
): T {
  if ((value === undefined || value === '') && fallback !== undefined) return fallback;
  if (!allowed.includes(value as T)) fail(message);
  return value as T;
}

export function activeStatus(value: unknown): ActiveStatus {
  return pickEnum(value, ['active', 'inactive'], 'El estado no es válido.', 'active');
}

/** Busca un registro activo o falla con un mensaje claro. */
export function requireActive<K extends WithStatus>(
  store: Store,
  resource: K,
  id: unknown,
  label: string,
): ResourceMap[K] {
  const record = typeof id === 'string' && id ? store.get(resource, id) : undefined;
  if (!record) fail(`Selecciona ${label}.`);
  if (record.status !== 'active') fail(`No puedes usar ${label} porque está en estado inactivo.`);
  return record;
}

export function requireRecord<K extends ResourceKey>(
  store: Store,
  resource: K,
  id: unknown,
  label: string,
): ResourceMap[K] {
  const record = typeof id === 'string' && id ? store.get(resource, id) : undefined;
  if (!record) fail(`Selecciona ${label}.`);
  return record;
}
