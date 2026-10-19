import { describe, expect, it } from 'vitest';

import { buildDemoDatabase } from '@/services/mocks/seed/demo';
import { createStore } from '@/services/mocks/store';
import { RESOURCE_KEYS, type ResourceKey } from '@/types/resources';
import { ALL_NAV_MATCHES } from '@/utils/navigation';

import { LIST_DEFINITIONS } from './list-registry';

const definitions = Object.entries(LIST_DEFINITIONS) as [
  ResourceKey,
  (typeof LIST_DEFINITIONS)[ResourceKey],
][];

const navResources = ALL_NAV_MATCHES.flatMap(({ item }) =>
  item.view.kind === 'resource' ? [item.view.resource] : [],
);

describe('registro de listados', () => {
  it('define un listado para cada recurso', () => {
    expect(Object.keys(LIST_DEFINITIONS).sort()).toEqual([...RESOURCE_KEYS].sort());
  });

  it('da a cada recurso una pantalla propia en el menú', () => {
    expect([...navResources].sort()).toEqual([...RESOURCE_KEYS].sort());
  });

  it('no deja pantallas solo de vista: todas registran, ejecutan procesos o derivan a otro módulo', () => {
    const viewOnly = definitions
      .filter(([, d]) => !d.form && !d.processActions?.length && !d.flowActions?.length)
      .map(([resource]) => resource);
    expect(viewOnly).toEqual([]);
  });

  it('cada paso siguiente que abre un formulario llega con el registro de origen cargado', () => {
    const missing = definitions.flatMap(([resource, d]) =>
      (d.flowActions ?? [])
        .filter((flow) => !flow.search)
        .filter((flow) => {
          const target = LIST_DEFINITIONS[flow.target];
          return !target.form || !target.prefill?.[resource];
        })
        .map((flow) => `${resource} → ${flow.target} (${flow.id})`),
    );
    expect(missing).toEqual([]);
  });

  it('no repite ids de columna, procesos ni pasos siguientes dentro de un listado', () => {
    for (const [resource, d] of definitions) {
      for (const ids of [
        d.columns.map((column) => column.id),
        (d.processActions ?? []).map((action) => action.id),
        (d.flowActions ?? []).map((action) => action.id),
      ]) {
        expect(new Set(ids).size, resource).toBe(ids.length);
      }
    }
  });

  it('guarda en cada columna de fecha un valor que la tabla sabe mostrar', () => {
    const store = createStore(buildDemoDatabase(new Date(2026, 9, 18, 18, 0)));
    const formats = { date: /^\d{4}-\d{2}-\d{2}$/, datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/ };
    const invalid = definitions.flatMap(([resource, d]) =>
      d.columns.flatMap((column) => {
        if (column.kind !== 'date' && column.kind !== 'datetime') return [];
        const values = (store.list(resource) as unknown[]).map((row) =>
          (column.value as (r: unknown) => unknown)(row),
        );
        const bad = values.find(
          (value) => value && !(typeof value === 'string' && formats[column.kind].test(value)),
        );
        return bad === undefined ? [] : [`${resource}.${column.id} = ${JSON.stringify(bad)}`];
      }),
    );
    expect(invalid).toEqual([]);
  });
});
