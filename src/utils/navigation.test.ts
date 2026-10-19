import { describe, expect, it } from 'vitest';

import { NAVIGATION } from '@/config/navigation';
import type { ModuleId } from '@/types/administracion';

import {
  ALL_NAV_MATCHES,
  findGroupByPath,
  findNavMatchByPath,
  getGroupEntryPath,
  searchNavigation,
  visibleNavigation,
} from './navigation';

const canReadAll = () => true;

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

  it('separa maestros, comercial y compras, y deja tesorería para cobros y pagos', () => {
    expect(NAVIGATION.map((g) => g.id)).toEqual([
      'inicio',
      'maestros',
      'comercial',
      'compras',
      'inventario',
      'tesoreria',
      'documentos',
      'reportes',
      'administracion',
    ]);
  });

  it('cierra Comercial con cuentas por cobrar y Compras con cuentas por pagar', () => {
    const last = (groupId: string) =>
      ALL_NAV_MATCHES.filter((m) => m.group.id === groupId).at(-1)?.item.id;
    expect(last('comercial')).toBe('cuentas-cobrar');
    expect(last('compras')).toBe('cuentas-pagar');
  });

  it('asocia a un módulo de permisos todo grupo salvo Inicio', () => {
    expect(NAVIGATION.filter((g) => g.module === undefined).map((g) => g.id)).toEqual(['inicio']);
  });
});

describe('visibleNavigation', () => {
  it('oculta los grupos que el rol no puede consultar', () => {
    const ids = visibleNavigation((module: ModuleId) => module === 'comercial').map((g) => g.id);
    expect(ids).toEqual(['inicio', 'comercial']);
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
    expect(findNavMatchByPath('/compras/ordenes-compra/')?.item.id).toBe('ordenes-compra');
  });
});

describe('getGroupEntryPath', () => {
  it('lleva a la primera pantalla del grupo', () => {
    const comercial = NAVIGATION.find((g) => g.id === 'comercial');
    expect(comercial && getGroupEntryPath(comercial)).toBe('/comercial/cotizaciones');
  });
});

describe('searchNavigation', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(searchNavigation('ORDENES', canReadAll)[0]?.item.id).toBe('ordenes-compra');
  });

  it('prioriza coincidencias en el nombre sobre la descripción', () => {
    expect(searchNavigation('stock', canReadAll)[0]?.item.id).toBe('stock');
  });

  it('exige que coincidan todos los términos', () => {
    expect(searchNavigation('cuentas cobrar', canReadAll).map((m) => m.item.id)).toEqual([
      'cuentas-cobrar',
    ]);
  });

  it('no ofrece pantallas de grupos sin permiso', () => {
    expect(searchNavigation('ordenes', (module) => module !== 'compras')).toEqual([]);
  });

  it('devuelve vacío sin texto', () => {
    expect(searchNavigation('   ', canReadAll)).toEqual([]);
  });
});
