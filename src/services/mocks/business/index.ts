import { RESOURCE_MODULE, type ResourceKey, type ResourceMap } from '@/types/resources';

import type { Store } from '../store';

import { administracionRules } from './administracion';
import { comercialRules } from './comercial';
import { comprasRules } from './compras';
import { fail, isoDateTime, type BusinessContext } from './context';
import { documentosRules } from './documentos';
import { inventarioRules } from './inventario';
import { maestrosRules } from './maestros';
import type { RecordInput, ResourceRules } from './rules';
import { tesoreriaRules } from './tesoreria';

export { BusinessError, type BusinessContext } from './context';
export type { RecordInput } from './rules';

const RULES: { [K in ResourceKey]: ResourceRules<K> } = {
  ...maestrosRules,
  ...comercialRules,
  ...comprasRules,
  ...inventarioRules,
  ...tesoreriaRules,
  ...documentosRules,
  ...administracionRules,
};

/** Qué permite cada recurso; la interfaz lo usa para mostrar u ocultar botones. */
export interface ResourceCapabilities {
  create: boolean;
  update: boolean;
  remove: boolean;
  actions: { id: string; label: string }[];
}

export function capabilities(resource: ResourceKey): ResourceCapabilities {
  const rules = RULES[resource] as ResourceRules<ResourceKey>;
  return {
    create: Boolean(rules.create),
    update: Boolean(rules.update),
    remove: Boolean(rules.remove),
    actions: Object.entries(rules.actions ?? {}).map(([id, action]) => ({
      id,
      label: action.label,
    })),
  };
}

const REFERENCE_FIELDS = ['number', 'documentNumber', 'code', 'sku', 'name', 'id'] as const;

function referenceOf(record: object): string {
  for (const field of REFERENCE_FIELDS) {
    const value = (record as Record<string, unknown>)[field];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

function audit(
  store: Store,
  ctx: BusinessContext,
  resource: ResourceKey,
  action: string,
  record: object,
): void {
  store.insert('auditoria', {
    date: isoDateTime(ctx.now),
    userName: ctx.userName,
    module: RESOURCE_MODULE[resource],
    resource,
    action,
    reference: referenceOf(record),
  });
}

function rulesFor<K extends ResourceKey>(resource: K): ResourceRules<K> {
  return RULES[resource];
}

function currentRecord<K extends ResourceKey>(
  store: Store,
  resource: K,
  id: string,
): ResourceMap[K] {
  return store.get(resource, id) ?? fail('El registro ya no existe.');
}

export function createRecord<K extends ResourceKey>(
  store: Store,
  ctx: BusinessContext,
  resource: K,
  input: RecordInput<K>,
): ResourceMap[K] {
  const create = rulesFor(resource).create ?? fail('Este registro no se crea manualmente.');
  const created = create(store, ctx, input);
  audit(store, ctx, resource, 'Registró', created);
  return created;
}

export function updateRecord<K extends ResourceKey>(
  store: Store,
  ctx: BusinessContext,
  resource: K,
  id: string,
  input: RecordInput<K>,
): ResourceMap[K] {
  const update = rulesFor(resource).update ?? fail('Este registro no se puede editar.');
  const updated = update(store, ctx, currentRecord(store, resource, id), input);
  audit(store, ctx, resource, 'Actualizó', updated);
  return updated;
}

export function removeRecord(
  store: Store,
  ctx: BusinessContext,
  resource: ResourceKey,
  id: string,
): void {
  const rules = rulesFor(resource);
  const remove = rules.remove ?? fail('Este registro no se puede eliminar.');
  const current = currentRecord(store, resource, id);
  remove(store, ctx, current);
  audit(store, ctx, resource, 'Eliminó', current);
}

/** Ejecuta una acción de proceso (aprobar, anular, completar…) y devuelve el registro actualizado. */
export function runAction<K extends ResourceKey>(
  store: Store,
  ctx: BusinessContext,
  resource: K,
  id: string,
  actionId: string,
): ResourceMap[K] {
  const action =
    rulesFor(resource).actions?.[actionId] ?? fail('La acción no existe para este registro.');
  action.run(store, ctx, currentRecord(store, resource, id));
  const updated = currentRecord(store, resource, id);
  audit(store, ctx, resource, action.label, updated);
  return updated;
}
