import type { Settings } from '@/types/administracion';
import type { ResourceKey, ResourceMap, ResourceRecords } from '@/types/resources';

export type DatasetState = 'demo' | 'modified' | 'empty';

/** Forma de lo que se guarda en localStorage. */
export interface MockDatabase {
  version: number;
  state: DatasetState;
  records: ResourceRecords;
  settings: Settings;
  /** Último correlativo usado por cada serie (COT-, VTA-, F001…). */
  sequences: Record<string, number>;
  /** Registros creados que aún no se abrieron, por recurso; la tabla los marca como nuevos. */
  unseen?: Partial<Record<ResourceKey, string[]>>;
}

/** Registros que el sistema genera solo: no se marcan como nuevos. */
const AUTOMATIC: readonly ResourceKey[] = ['auditoria', 'kardex'];

export type RecordValues<K extends ResourceKey> = Omit<ResourceMap[K], 'id'>;

/**
 * Acceso a las tablas para la capa de negocio. Trabaja sobre una copia de la base dentro de una
 * transacción: si una regla falla a mitad de camino, no queda nada a medias.
 */
export interface Store {
  list<K extends ResourceKey>(resource: K): ResourceMap[K][];
  get<K extends ResourceKey>(resource: K, id: string): ResourceMap[K] | undefined;
  insert<K extends ResourceKey>(resource: K, values: RecordValues<K>, id?: string): ResourceMap[K];
  update<K extends ResourceKey>(
    resource: K,
    id: string,
    patch: Partial<RecordValues<K>>,
  ): ResourceMap[K];
  remove(resource: ResourceKey, id: string): void;
  /** Ids de los registros nuevos que todavía no se abrieron. */
  unseen(resource: ResourceKey): string[];
  markSeen(resource: ResourceKey, id: string): void;
  settings(): Settings;
  saveSettings(settings: Settings): void;
  /** Siguiente número de una serie: nextNumber('ventas', 'VTA-', 5) → VTA-00042. */
  nextNumber(key: string, prefix: string, pad: number): string;
}

export function createStore(db: MockDatabase): Store {
  // TypeScript no relaciona la clave genérica con su tipo al escribir en el mapa (sí al leer).
  const tables = db.records as Record<ResourceKey, { id: string }[]>;
  const unseen = (db.unseen ??= {});

  function markSeen(resource: ResourceKey, id: string) {
    const ids = unseen[resource];
    if (ids?.includes(id)) unseen[resource] = ids.filter((other) => other !== id);
  }

  return {
    list(resource) {
      return db.records[resource];
    },

    get(resource, id) {
      return db.records[resource].find((row) => row.id === id);
    },

    insert(resource, values, id = crypto.randomUUID()) {
      const row = { ...values, id } as ResourceMap[typeof resource];
      tables[resource] = [row, ...tables[resource]];
      if (!AUTOMATIC.includes(resource)) unseen[resource] = [id, ...(unseen[resource] ?? [])];
      return row;
    },

    update(resource, id, patch) {
      const current = db.records[resource].find((row) => row.id === id);
      if (!current) throw new Error('El registro ya no existe.');
      const updated = { ...current, ...patch, id } as ResourceMap[typeof resource];
      tables[resource] = tables[resource].map((row) => (row.id === id ? updated : row));
      return updated;
    },

    remove(resource, id) {
      tables[resource] = tables[resource].filter((row) => row.id !== id);
      markSeen(resource, id);
    },

    unseen(resource) {
      return unseen[resource] ?? [];
    },

    markSeen,

    settings() {
      return db.settings;
    },

    saveSettings(settings) {
      db.settings = settings;
    },

    nextNumber(key, prefix, pad) {
      const next = (db.sequences[key] ?? 0) + 1;
      db.sequences[key] = next;
      return `${prefix}${String(next).padStart(pad, '0')}`;
    },
  };
}
