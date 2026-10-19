import { describe, expect, it } from 'vitest';

import { createStore } from '../store';

import { buildDemoDatabase } from './demo';

describe('buildDemoDatabase', () => {
  const today = new Date(2026, 9, 18, 18, 0);
  const db = buildDemoDatabase(today);
  const store = createStore(db);

  it('genera historia en todos los ciclos', () => {
    expect(db.state).toBe('demo');
    for (const resource of [
      'cotizaciones',
      'ventas',
      'comprobantes',
      'notas-credito',
      'cuentas-cobrar',
      'ordenes-compra',
      'recepciones',
      'facturas-proveedor',
      'cuentas-pagar',
      'movimientos',
      'kardex',
      'ajustes',
      'transferencias',
      'documentos',
      'auditoria',
    ] as const) {
      expect(store.list(resource).length, resource).toBeGreaterThan(0);
    }
  });

  it('deja trabajo pendiente para hoy en cada módulo', () => {
    expect(store.list('cotizaciones').some((row) => row.status === 'draft')).toBe(true);
    expect(store.list('ventas').some((row) => row.status === 'pending_invoice')).toBe(true);
    expect(store.list('ordenes-compra').some((row) => row.status === 'approved')).toBe(true);
    expect(store.list('recepciones').some((row) => row.status === 'pending_bill')).toBe(true);
    expect(store.list('transferencias').some((row) => row.status === 'pending')).toBe(true);
    expect(store.list('cuentas-cobrar').some((row) => row.balance > 0)).toBe(true);
    expect(store.list('cuentas-pagar').some((row) => row.balance > 0)).toBe(true);
  });

  it('mantiene la consistencia de stock y saldos', () => {
    expect(store.list('stock').every((row) => row.quantity >= 0)).toBe(true);
    expect(store.list('cuentas-bancarias').every((row) => row.balance >= 0)).toBe(true);
    expect(store.list('cuentas-cobrar').every((row) => row.balance >= 0)).toBe(true);
  });

  it('no registra nada después de hoy', () => {
    expect(store.list('auditoria').every((row) => new Date(row.date) <= today)).toBe(true);
  });

  it('es determinista y cabe en localStorage', () => {
    const again = buildDemoDatabase(today);
    expect(again.records.ventas.map((row) => row.number)).toEqual(
      db.records.ventas.map((row) => row.number),
    );
    expect(JSON.stringify(db).length).toBeLessThan(3_000_000);
  });
});
