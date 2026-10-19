import type { Store } from '../store';

import { fail, isoDate, optionalText, requireDate, requireNumber } from './context';
import {
  pickEnum,
  requireActive,
  requireRecord,
  type RecordInput,
  type ResourceRules,
} from './rules';
import { ensureStockRow, moveStock } from './stock';

function positiveUnits(value: unknown): number {
  const quantity = requireNumber(value, 'La cantidad debe ser un entero mayor que cero.');
  if (!Number.isInteger(quantity) || quantity <= 0)
    fail('La cantidad debe ser un entero mayor que cero.');
  return quantity;
}

// ─── Stock ─────────────────────────────────────────────────────────────────────

/** Las existencias solo cambian con movimientos; aquí únicamente se ajusta el mínimo por almacén. */
const stock: ResourceRules<'stock'> = {
  update(store, _ctx, current, input) {
    const minStock = requireNumber(
      input.minStock ?? current.minStock,
      'El stock mínimo debe ser un entero desde 0.',
    );
    if (!Number.isInteger(minStock)) fail('El stock mínimo debe ser un entero desde 0.');
    return store.update('stock', current.id, { minStock });
  },
};

/** El kardex lo escriben las operaciones; nunca se edita a mano. */
const kardex: ResourceRules<'kardex'> = {};

// ─── Ajustes ───────────────────────────────────────────────────────────────────

const ajustes: ResourceRules<'ajustes'> = {
  create(store, ctx, input) {
    const product = requireActive(store, 'productos', input.productId, 'el producto');
    const warehouse = requireActive(store, 'almacenes', input.warehouseId, 'el almacén');
    const type = pickEnum(input.type, ['increase', 'decrease'], 'Elige si el ajuste suma o resta.');
    const quantity = positiveUnits(input.quantity);
    const reason = pickEnum(
      input.reason,
      ['count', 'damage', 'expired', 'loss', 'other'],
      'Elige el motivo.',
    );
    const notes = optionalText(input.notes);
    if (reason === 'other' && !notes) fail('Explica el motivo del ajuste en las notas.');

    const number = store.nextNumber('ajustes', 'AJ-', 5);
    moveStock(store, ctx, {
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: type === 'increase' ? quantity : -quantity,
      origin: 'adjustment',
      reference: number,
    });
    return store.insert('ajustes', {
      number,
      date: requireDate(input.date, isoDate(ctx.now)),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      type,
      quantity,
      reason,
      notes,
    });
  },
};

// ─── Transferencias ────────────────────────────────────────────────────────────

function transferValues(store: Store, input: RecordInput<'transferencias'>, today: string) {
  const product = requireActive(store, 'productos', input.productId, 'el producto');
  const origin = requireActive(store, 'almacenes', input.originWarehouseId, 'el almacén de origen');
  const destination = requireActive(
    store,
    'almacenes',
    input.destinationWarehouseId,
    'el almacén de destino',
  );
  if (origin.id === destination.id) fail('El origen y el destino deben ser almacenes distintos.');
  const quantity = positiveUnits(input.quantity);
  const available = ensureStockRow(store, product.id, origin.id).quantity;
  if (quantity > available)
    fail(`En ${origin.name} solo hay ${available} ${product.unit} de ${product.name}.`);
  return {
    date: requireDate(input.date, today),
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    originWarehouseId: origin.id,
    originWarehouseName: origin.name,
    destinationWarehouseId: destination.id,
    destinationWarehouseName: destination.name,
    quantity,
    notes: optionalText(input.notes),
  };
}

const transferencias: ResourceRules<'transferencias'> = {
  create(store, ctx, input) {
    return store.insert('transferencias', {
      number: store.nextNumber('transferencias', 'TR-', 5),
      ...transferValues(store, input, isoDate(ctx.now)),
      status: 'pending',
    });
  },
  update(store, ctx, current, input) {
    if (current.status !== 'pending') fail('Solo se editan transferencias pendientes.');
    return store.update(
      'transferencias',
      current.id,
      transferValues(store, { ...current, ...input }, isoDate(ctx.now)),
    );
  },
  actions: {
    complete: {
      label: 'Completó',
      run(store, ctx, current) {
        if (current.status !== 'pending') fail('La transferencia ya está cerrada.');
        requireActive(store, 'almacenes', current.destinationWarehouseId, 'el almacén de destino');
        const origin = requireRecord(
          store,
          'stock',
          `stk-${current.productId}-${current.originWarehouseId}`,
          'el stock de origen',
        );
        moveStock(store, ctx, {
          productId: current.productId,
          warehouseId: current.originWarehouseId,
          quantity: -current.quantity,
          origin: 'transfer',
          reference: current.number,
        });
        moveStock(store, ctx, {
          productId: current.productId,
          warehouseId: current.destinationWarehouseId,
          quantity: current.quantity,
          origin: 'transfer',
          reference: current.number,
          unitCost: origin.unitCost,
        });
        store.update('transferencias', current.id, { status: 'completed' });
      },
    },
    cancel: {
      label: 'Anuló',
      run(store, _ctx, current) {
        if (current.status !== 'pending') fail('Solo se anulan transferencias pendientes.');
        store.update('transferencias', current.id, { status: 'cancelled' });
      },
    },
  },
};

export const inventarioRules = { stock, kardex, ajustes, transferencias };
