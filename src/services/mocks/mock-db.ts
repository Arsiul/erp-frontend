import type { BusinessAlert } from '@/types/alerts';
import type { DashboardSummary } from '@/types/dashboard';
import type { ResourceKey, ResourceMap, ResourceRecords } from '@/types/resources';

import { ALERTS_MOCK } from './alerts.mock';
import { DASHBOARD_SUMMARY_MOCK } from './dashboard.mock';
import { RESOURCE_MOCKS } from './records';

/**
 * Base de datos simulada del frontend.
 *
 * Vive en memoria y se guarda en localStorage para que los cambios sobrevivan a una recarga.
 * Es un reemplazo temporal de la API: cuando exista el backend, los servicios dejan de usarla.
 *
 * Si cambia la forma de los datos de demostración, sube STORAGE_VERSION para descartar lo guardado.
 */
const STORAGE_KEY = 'erp.mock-db';
const STORAGE_VERSION = 1;

export type DatasetState = 'demo' | 'modified' | 'empty';

interface MockDatabase {
  version: number;
  state: DatasetState;
  records: ResourceRecords;
  dashboard: DashboardSummary;
  alerts: BusinessAlert[];
}

function demoDatabase(): MockDatabase {
  return structuredClone({
    version: STORAGE_VERSION,
    state: 'demo',
    records: RESOURCE_MOCKS,
    dashboard: DASHBOARD_SUMMARY_MOCK,
    alerts: ALERTS_MOCK,
  });
}

/** Panel general sin movimientos: mismos indicadores, en cero. */
function emptyDashboard(): DashboardSummary {
  const blank = structuredClone(DASHBOARD_SUMMARY_MOCK);
  return {
    periodLabel: blank.periodLabel,
    primaryKpis: blank.primaryKpis.map((kpi) => ({
      ...kpi,
      value: 0,
      changePercent: null,
      caption: 'Sin movimientos',
    })),
    operationalKpis: blank.operationalKpis.map((kpi) => ({
      ...kpi,
      value: 0,
      changePercent: null,
      caption: 'Sin movimientos',
    })),
    monthlyTotals: blank.monthlyTotals.map((month) => ({ ...month, sales: 0, purchases: 0 })),
    recentSales: [],
    topProducts: [],
  };
}

function emptyDatabase(): MockDatabase {
  const records = Object.fromEntries(
    Object.keys(RESOURCE_MOCKS).map((resource) => [resource, []]),
  ) as unknown as ResourceRecords;
  return {
    version: STORAGE_VERSION,
    state: 'empty',
    records,
    dashboard: emptyDashboard(),
    alerts: [],
  };
}

function isStoredDatabase(value: unknown): value is MockDatabase {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<MockDatabase>;
  return (
    candidate.version === STORAGE_VERSION &&
    typeof candidate.records === 'object' &&
    Object.keys(RESOURCE_MOCKS).every((resource) =>
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
  return demoDatabase();
}

let db = load();

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Sin almacenamiento: los cambios duran solo esta sesión.
  }
}

function touch(): void {
  if (db.state === 'demo') db.state = 'modified';
  persist();
}

function rowsOf<K extends ResourceKey>(resource: K): ResourceMap[K][] {
  return db.records[resource];
}

function setRows<K extends ResourceKey>(resource: K, rows: ResourceMap[K][]): void {
  // TypeScript no relaciona la clave genérica con su tipo al escribir en el mapa (sí al leer).
  (db.records as Record<ResourceKey, unknown[]>)[resource] = rows;
}

export const mockDb = {
  state(): DatasetState {
    return db.state;
  },

  list<K extends ResourceKey>(resource: K): ResourceMap[K][] {
    return structuredClone(rowsOf(resource));
  },

  insert<K extends ResourceKey>(resource: K, values: Omit<ResourceMap[K], 'id'>): ResourceMap[K] {
    const row = { ...values, id: crypto.randomUUID() } as ResourceMap[K];
    setRows(resource, [row, ...rowsOf(resource)]);
    touch();
    return structuredClone(row);
  },

  update<K extends ResourceKey>(
    resource: K,
    id: string,
    patch: Partial<Omit<ResourceMap[K], 'id'>>,
  ): ResourceMap[K] {
    const current = rowsOf(resource).find((row) => row.id === id);
    if (!current) throw new Error('El registro ya no existe.');
    const updated: ResourceMap[K] = { ...current, ...patch, id };
    setRows(
      resource,
      rowsOf(resource).map((row) => (row.id === id ? updated : row)),
    );
    touch();
    return structuredClone(updated);
  },

  remove(resource: ResourceKey, id: string): void {
    setRows(
      resource,
      rowsOf(resource).filter((row) => row.id !== id),
    );
    touch();
  },

  dashboard(): DashboardSummary {
    return structuredClone(db.dashboard);
  },

  alerts(): BusinessAlert[] {
    return structuredClone(db.alerts);
  },

  /** Vuelve a los datos de demostración originales. */
  reset(): void {
    db = demoDatabase();
    persist();
  },

  /** Deja el sistema sin ningún registro. */
  clear(): void {
    db = emptyDatabase();
    persist();
  },
};
