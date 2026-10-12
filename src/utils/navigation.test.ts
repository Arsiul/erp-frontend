import { describe, expect, it } from 'vitest';

import { BUILD_STEPS_TOTAL, NAVIGATION } from '@/config/navigation';

import {
  ALL_NAV_MATCHES,
  findGroupByPath,
  findNavMatchByPath,
  getGroupEntryPath,
  searchNavigation,
} from './navigation';

describe('configuración de navegación', () => {
  it('no repite ids ni rutas', () => {
    const ids = [...NAVIGATION.map((g) => g.id), ...ALL_NAV_MATCHES.map((m) => m.item.id)];
    const paths = [...NAVIGATION.map((g) => g.path), ...ALL_NAV_MATCHES.map((m) => m.item.path)];
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('ubica cada submódulo bajo la ruta de su grupo', () => {
    for (const { group, item } of ALL_NAV_MATCHES) {
      expect(item.path.startsWith(`${group.path}/`)).toBe(true);
    }
  });

  it('asigna a cada submódulo un paso válido del plan de construcción', () => {
    for (const { item } of ALL_NAV_MATCHES) {
      expect(item.buildStep).toBeGreaterThanOrEqual(1);
      expect(item.buildStep).toBeLessThanOrEqual(BUILD_STEPS_TOTAL);
    }
  });

  it('respeta la estructura v2: 8 entradas de menú y 32 submódulos además del dashboard', () => {
    expect(NAVIGATION).toHaveLength(8);
    expect(ALL_NAV_MATCHES).toHaveLength(32);
  });
});

describe('findGroupByPath', () => {
  it('reconoce la raíz como Inicio', () => {
    expect(findGroupByPath('/')?.id).toBe('inicio');
  });

  it('reconoce el grupo de una ruta anidada', () => {
    expect(findGroupByPath('/inventario/kardex')?.id).toBe('inventario');
  });

  it('no confunde grupos con prefijos parecidos', () => {
    expect(findGroupByPath('/comercialxyz')).toBeUndefined();
  });
});

describe('findNavMatchByPath', () => {
  it('ignora la barra final', () => {
    expect(findNavMatchByPath('/compras/ordenes/')?.item.id).toBe('ordenes-compra');
  });
});

describe('getGroupEntryPath', () => {
  it('lleva a la primera pantalla del grupo', () => {
    const comercial = NAVIGATION.find((g) => g.id === 'comercial');
    expect(comercial && getGroupEntryPath(comercial)).toBe('/comercial/clientes');
  });
});

describe('searchNavigation', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(searchNavigation('ORDENES')[0]?.item.id).toBe('ordenes-compra');
  });

  it('prioriza coincidencias en el nombre sobre la descripción', () => {
    expect(searchNavigation('stock')[0]?.item.id).toBe('stock');
  });

  it('exige que coincidan todos los términos', () => {
    expect(searchNavigation('cuentas cobrar').map((m) => m.item.id)).toEqual(['cuentas-cobrar']);
  });

  it('devuelve vacío sin texto', () => {
    expect(searchNavigation('   ')).toEqual([]);
  });
});
