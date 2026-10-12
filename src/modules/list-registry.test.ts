import { describe, expect, it } from 'vitest';

import { RESOURCE_MOCKS } from '@/services/mocks/records';
import { ALL_NAV_MATCHES } from '@/utils/navigation';

import { isListResource, LIST_DEFINITIONS } from './list-registry';

describe('registro de listados', () => {
  it('cubre todos los submódulos de la navegación', () => {
    const missing = ALL_NAV_MATCHES.filter(({ item }) => !isListResource(item.id)).map(
      ({ item }) => item.id,
    );
    expect(missing).toEqual([]);
  });

  it('no define listados para submódulos que no existen en la navegación', () => {
    const navIds = new Set(ALL_NAV_MATCHES.map(({ item }) => item.id));
    expect(Object.keys(LIST_DEFINITIONS).filter((id) => !navIds.has(id))).toEqual([]);
  });

  it('tiene pocos registros de demostración por pantalla, con ids únicos', () => {
    for (const [resource, rows] of Object.entries(RESOURCE_MOCKS)) {
      expect(rows.length, resource).toBeGreaterThanOrEqual(2);
      expect(rows.length, resource).toBeLessThanOrEqual(8);
      const ids = rows.map((row) => row.id);
      expect(new Set(ids).size, resource).toBe(ids.length);
    }
  });

  it('no repite ids de columna dentro de un listado', () => {
    for (const [resource, definition] of Object.entries(LIST_DEFINITIONS)) {
      const ids = definition.columns.map((column) => column.id);
      expect(new Set(ids).size, resource).toBe(ids.length);
    }
  });
});
