import { RESOURCE_KEYS } from '@/types/resources';

import { baseDatabase, DB_VERSION } from './seed/base';
import { buildDemoDatabase } from './seed/demo';
import { createStore, type DatasetState, type MockDatabase, type Store } from './store';

export type { DatasetState } from './store';

/**
 * Base de datos simulada del frontend.
 *
 * Vive en memoria y se guarda en localStorage para que los cambios sobrevivan a una recarga.
 * Es un reemplazo temporal de la API: cuando exista el backend, los servicios dejan de usarla.
 *
 * Si cambia la forma de los datos, sube DB_VERSION (seed/base.ts) para descartar lo guardado.
 */
const STORAGE_KEY = 'erp.mock-db';

function isStoredDatabase(value: unknown): value is MockDatabase {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { [K in keyof MockDatabase]?: unknown };
  return (
    candidate.version === DB_VERSION &&
    typeof candidate.settings === 'object' &&
    typeof candidate.sequences === 'object' &&
    typeof candidate.records === 'object' &&
    candidate.records !== null &&
    RESOURCE_KEYS.every((resource) =>
      Array.isArray((candidate.records as Record<string, unknown>)[resource]),
    )
  );
}

function load(): MockDatabase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isStoredDatabase(parsed)) return parsed;
    }
  } catch {
    // Almacenamiento no disponible o dañado: se parte de los datos de demostración.
  }
  const fresh = buildDemoDatabase();
  persist(fresh);
  return fresh;
}

function persist(value: MockDatabase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Sin almacenamiento o sin espacio: los cambios duran solo esta sesión.
  }
}

let db: MockDatabase | undefined;

function current(): MockDatabase {
  db ??= load();
  return db;
}

export const mockDb = {
  state(): DatasetState {
    return current().state;
  },

  /** Lectura aislada: lo que devuelve se puede modificar sin tocar la base. */
  read<T>(fn: (store: Store) => T): T {
    return structuredClone(fn(createStore(current())));
  },

  /**
   * Escritura atómica: trabaja sobre una copia y solo la guarda si `fn` termina sin error,
   * así una regla de negocio que falla a mitad de camino no deja datos a medias.
   * `bookkeeping` marca escrituras internas (como el último acceso) que no cuentan como cambio de los datos.
   */
  transaction<T>(fn: (store: Store) => T, { bookkeeping = false } = {}): T {
    const draft = structuredClone(current());
    const result = fn(createStore(draft));
    if (!bookkeeping && draft.state === 'demo') draft.state = 'modified';
    db = draft;
    persist(draft);
    return structuredClone(result);
  },

  /** Vuelve a los datos de demostración, generados hasta hoy. */
  reset(): void {
    db = buildDemoDatabase();
    persist(db);
  },

  /** Deja el sistema sin operaciones; conserva usuarios, roles y configuración. */
  clear(): void {
    const previous = current();
    const empty = baseDatabase();
    empty.records.usuarios = previous.records.usuarios;
    empty.records.roles = previous.records.roles;
    empty.settings = previous.settings;
    db = empty;
    persist(empty);
  },
};
