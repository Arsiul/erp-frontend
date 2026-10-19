import type { KardexOrigin, StockItem } from '@/types/inventario';

import type { Store } from '../store';

import { fail, isoDate, round2, type BusinessContext } from './context';

export function stockId(productId: string, warehouseId: string): string {
  return `stk-${productId}-${warehouseId}`;
}

/** Fila de stock de un producto en un almacén; la crea en cero si aún no existe. */
export function ensureStockRow(store: Store, productId: string, warehouseId: string): StockItem {
  const existing = store.get('stock', stockId(productId, warehouseId));
  if (existing) return existing;

  const product = store.get('productos', productId);
  const warehouse = store.get('almacenes', warehouseId);
  if (!product || !warehouse) fail('El producto o el almacén ya no existe.');
  return store.insert(
    'stock',
    {
      productId,
      productName: product.name,
      sku: product.sku,
      categoryName: product.categoryName,
      unit: product.unit,
      warehouseId,
      warehouseName: warehouse.name,
      quantity: 0,
      minStock: product.minStock,
      unitCost: product.costPrice,
    },
    stockId(productId, warehouseId),
  );
}

export interface StockMovement {
  productId: string;
  warehouseId: string;
  /** Positivo = entrada, negativo = salida. */
  quantity: number;
  origin: KardexOrigin;
  reference: string;
  /** Costo de la entrada; si se omite se usa el costo promedio actual. */
  unitCost?: number;
}

/**
 * Único punto que cambia existencias: valida que alcance el stock, recalcula el costo promedio
 * ponderado en las entradas y deja la línea del kardex con el saldo resultante.
 */
export function moveStock(store: Store, ctx: BusinessContext, movement: StockMovement): StockItem {
  const row = ensureStockRow(store, movement.productId, movement.warehouseId);
  const balance = row.quantity + movement.quantity;
  if (balance < 0) {
    fail(
      `Stock insuficiente de ${row.productName} en ${row.warehouseName}: hay ${row.quantity} ${row.unit}.`,
    );
  }

  let unitCost = row.unitCost;
  if (movement.quantity > 0 && movement.unitCost !== undefined) {
    unitCost =
      balance === 0
        ? movement.unitCost
        : round2((row.quantity * row.unitCost + movement.quantity * movement.unitCost) / balance);
  }

  const updated = store.update('stock', row.id, { quantity: balance, unitCost });
  store.insert('kardex', {
    date: isoDate(ctx.now),
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouseName,
    origin: movement.origin,
    reference: movement.reference,
    quantity: movement.quantity,
    balance,
    unitCost:
      movement.quantity > 0 && movement.unitCost !== undefined ? movement.unitCost : unitCost,
  });
  return updated;
}

/** Stock total de un producto sumando todos los almacenes. */
export function totalStock(store: Store, productId: string): number {
  return store
    .list('stock')
    .filter((row) => row.productId === productId)
    .reduce((sum, row) => sum + row.quantity, 0);
}
