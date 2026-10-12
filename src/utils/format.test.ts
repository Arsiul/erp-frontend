import { describe, expect, it } from 'vitest';

import { formatChange, formatCurrency, formatDate, formatDateTime } from './format';
import { getInitials, matchesSearch, normalizeText } from './text';

describe('formatCurrency', () => {
  it('usa soles con dos decimales', () => {
    const formatted = formatCurrency(1234.5);
    expect(formatted).toContain('S/');
    expect(formatted).toMatch(/1.234.50/);
  });
});

describe('formatChange', () => {
  it('muestra el signo en aumentos y caídas', () => {
    expect(formatChange(8.4)).toMatch(/^\+8.4\s?%$/);
    expect(formatChange(-3.2)).toMatch(/^-3.2\s?%$/);
  });
});

describe('formatDate', () => {
  it('no corre la fecha por la zona horaria', () => {
    expect(formatDate('2026-10-01')).toMatch(/^01/);
  });

  it('devuelve el texto original si no es una fecha ISO', () => {
    expect(formatDate('sin fecha')).toBe('sin fecha');
  });
});

describe('formatDateTime', () => {
  it('muestra fecha y hora', () => {
    expect(formatDateTime('2026-10-12T09:41')).toMatch(/^12 .*2026, 09:41$/);
  });
});

describe('matchesSearch', () => {
  const row = ['Solicitar ajuste', 'Inventario', 'F001-002341'];

  it('coincide por inicio de palabra, no en medio', () => {
    expect(matchesSearch(row, 'ajus')).toBe(true);
    expect(matchesSearch(row, 'venta')).toBe(false);
  });

  it('busca códigos con símbolos en cualquier parte y partes numéricas como palabras', () => {
    expect(matchesSearch(row, 'f001-0023')).toBe(true);
    expect(matchesSearch(row, '002341')).toBe(true);
  });

  it('exige todos los términos e ignora tildes', () => {
    expect(matchesSearch(['Inversiones Pacífico Sur'], 'pacifico sur')).toBe(true);
    expect(matchesSearch(['Inversiones Pacífico Sur'], 'pacifico norte')).toBe(false);
  });

  it('sin texto, todo coincide', () => {
    expect(matchesSearch(row, '  ')).toBe(true);
  });
});

describe('text', () => {
  it('normaliza tildes y mayúsculas', () => {
    expect(normalizeText('  Órdenes de Compra ')).toBe('ordenes de compra');
  });

  it('obtiene hasta dos iniciales', () => {
    expect(getInitials('Carla Mendoza Ruiz')).toBe('CM');
  });
});
