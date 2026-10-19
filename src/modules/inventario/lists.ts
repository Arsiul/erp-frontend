import { ArrowLeftRight, History, SlidersHorizontal } from 'lucide-react';

import type { BadgeValue } from '@/components/data-table/types';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import {
  ADJUSTMENT_REASON,
  ADJUSTMENT_TYPE,
  KARDEX_ORIGIN,
  optionsOf,
  TRANSFER_STATUS,
} from '@/modules/shared/status';
import type { KardexOrigin, StockItem } from '@/types/inventario';
import type { ResourceKey } from '@/types/resources';
import { todayIso } from '@/utils/dates';

function stockLevel(row: StockItem): BadgeValue {
  if (row.quantity <= 0) return { label: 'Sin stock', tone: 'danger' };
  if (row.quantity < row.minStock) return { label: 'Bajo mínimo', tone: 'warning' };
  return { label: 'Normal', tone: 'success' };
}

const activeProducts = {
  resource: 'productos',
  filter: (row: { status: string }) => row.status === 'active',
} as const;
const activeWarehouses = {
  resource: 'almacenes',
  filter: (row: { status: string }) => row.status === 'active',
} as const;

/** Documento que originó cada movimiento del kardex, para ir a verlo. */
const KARDEX_SOURCES: { origins: KardexOrigin[]; target: ResourceKey; label: string }[] = [
  { origins: ['sale', 'sale_cancel'], target: 'ventas', label: 'Ver venta' },
  { origins: ['credit_note'], target: 'notas-credito', label: 'Ver nota de crédito' },
  { origins: ['receipt', 'receipt_cancel'], target: 'recepciones', label: 'Ver recepción' },
  { origins: ['adjustment'], target: 'ajustes', label: 'Ver ajuste' },
  { origins: ['transfer'], target: 'transferencias', label: 'Ver transferencia' },
];

export const INVENTARIO_LISTS: ListDefinitionsFor<
  'stock' | 'kardex' | 'ajustes' | 'transferencias'
> = {
  stock: {
    entity: { singular: 'existencia', plural: 'existencias', newLabel: '' },
    rowTitle: (row) => `${row.productName} · ${row.warehouseName}`,
    searchPlaceholder: 'Buscar por SKU, producto, categoría o almacén...',
    searchFields: (row) => [row.sku, row.productName, row.categoryName, row.warehouseName],
    columns: [
      {
        id: 'product',
        header: 'Producto',
        kind: 'title',
        value: (row) => ({ title: row.productName, subtitle: row.sku }),
      },
      { id: 'warehouse', header: 'Almacén', kind: 'muted', value: (row) => row.warehouseName },
      {
        id: 'category',
        header: 'Categoría',
        kind: 'muted',
        value: (row) => row.categoryName,
        hideBelow: 'xl',
      },
      { id: 'quantity', header: 'Existencias', kind: 'number', value: (row) => row.quantity },
      {
        id: 'minStock',
        header: 'Mínimo',
        kind: 'number',
        value: (row) => row.minStock,
        hideBelow: 'lg',
      },
      {
        id: 'unitCost',
        header: 'Costo promedio',
        kind: 'money',
        value: (row) => row.unitCost,
        hideBelow: '2xl',
      },
      {
        id: 'value',
        header: 'Valorizado',
        kind: 'money',
        value: (row) => row.quantity * row.unitCost,
        hideBelow: 'md',
      },
      { id: 'level', header: 'Nivel', kind: 'badge', value: stockLevel },
    ],
    form: [
      {
        key: 'minStock',
        label: 'Stock mínimo en este almacén',
        type: 'number',
        required: true,
        min: 0,
        fullWidth: true,
        hint: 'Debajo de este nivel aparece en alertas y se sugiere reponer.',
      },
    ],
    flowActions: [
      {
        id: 'adjust',
        label: 'Ajustar existencias',
        target: 'ajustes',
        icon: SlidersHorizontal,
      },
      {
        id: 'transfer',
        label: 'Transferir a otro almacén',
        target: 'transferencias',
        icon: ArrowLeftRight,
        when: (row) => row.quantity > 0,
      },
      {
        id: 'kardex',
        label: 'Ver kardex',
        target: 'kardex',
        icon: History,
        search: (row) => row.sku,
      },
      { id: 'order', label: 'Nueva orden de compra', target: 'ordenes-compra' },
    ],
  },

  kardex: {
    entity: { singular: 'movimiento de kardex', plural: 'movimientos de kardex', newLabel: '' },
    rowTitle: (row) => `${row.reference} · ${row.productName}`,
    searchPlaceholder: 'Buscar por SKU, producto, almacén o documento...',
    searchFields: (row) => [row.sku, row.productName, row.warehouseName, row.reference],
    columns: [
      { id: 'date', header: 'Fecha', kind: 'date', value: (row) => row.date },
      {
        id: 'product',
        header: 'Producto',
        kind: 'title',
        value: (row) => ({ title: row.productName, subtitle: row.sku }),
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouseName,
        hideBelow: 'lg',
      },
      { id: 'origin', header: 'Origen', kind: 'badge', value: (row) => KARDEX_ORIGIN[row.origin] },
      {
        id: 'reference',
        header: 'Documento',
        kind: 'code',
        value: (row) => row.reference,
        hideBelow: 'md',
      },
      { id: 'quantity', header: 'Cantidad', kind: 'number', value: (row) => row.quantity },
      { id: 'balance', header: 'Saldo', kind: 'number', value: (row) => row.balance },
      {
        id: 'unitCost',
        header: 'Costo unitario',
        kind: 'money',
        value: (row) => row.unitCost,
        hideBelow: 'xl',
      },
    ],
    flowActions: [
      ...KARDEX_SOURCES.map((source) => ({
        id: `source-${source.target}`,
        label: source.label,
        target: source.target,
        when: (row: { origin: KardexOrigin }) => source.origins.includes(row.origin),
        search: (row: { reference: string }) => row.reference,
      })),
      { id: 'stock', label: 'Ver stock', target: 'stock', search: (row) => row.sku },
    ],
  },

  ajustes: {
    entity: { singular: 'ajuste', plural: 'ajustes', newLabel: 'Nuevo ajuste' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, producto o almacén...',
    searchFields: (row) => [row.number, row.sku, row.productName, row.warehouseName],
    columns: [
      {
        id: 'number',
        header: 'Ajuste',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: ADJUSTMENT_REASON[row.reason] }),
      },
      { id: 'date', header: 'Fecha', kind: 'date', value: (row) => row.date, hideBelow: 'md' },
      { id: 'product', header: 'Producto', kind: 'muted', value: (row) => row.productName },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouseName,
        hideBelow: 'lg',
      },
      { id: 'type', header: 'Tipo', kind: 'badge', value: (row) => ADJUSTMENT_TYPE[row.type] },
      { id: 'quantity', header: 'Cantidad', kind: 'number', value: (row) => row.quantity },
    ],
    form: [
      {
        key: 'productId',
        label: 'Producto',
        type: 'select',
        required: true,
        fullWidth: true,
        optionsFrom: activeProducts,
      },
      {
        key: 'warehouseId',
        label: 'Almacén',
        type: 'select',
        required: true,
        optionsFrom: activeWarehouses,
      },
      { key: 'date', label: 'Fecha', type: 'date', required: true },
      {
        key: 'type',
        label: 'Tipo de ajuste',
        type: 'select',
        required: true,
        options: optionsOf(ADJUSTMENT_TYPE),
      },
      { key: 'quantity', label: 'Cantidad', type: 'number', required: true, min: 1 },
      {
        key: 'reason',
        label: 'Motivo',
        type: 'select',
        required: true,
        fullWidth: true,
        options: optionsOf(ADJUSTMENT_REASON),
      },
      { key: 'notes', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({ date: todayIso(), type: 'increase', reason: 'count' }),
    prefill: {
      stock: (item) => ({ productId: item.productId, warehouseId: item.warehouseId }),
      productos: (product) => ({ productId: product.id }),
    },
    /** Un ajuste ya movió el stock: se corrige con otro ajuste. */
    editWhen: () => false,
    removeWhen: () => false,
    flowActions: [
      {
        id: 'kardex',
        label: 'Ver en kardex',
        target: 'kardex',
        icon: History,
        search: (row) => row.number,
      },
      { id: 'stock', label: 'Ver stock', target: 'stock', search: (row) => row.sku },
    ],
  },

  transferencias: {
    entity: {
      singular: 'transferencia',
      plural: 'transferencias',
      newLabel: 'Nueva transferencia',
    },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, producto o almacén...',
    searchFields: (row) => [
      row.number,
      row.sku,
      row.productName,
      row.originWarehouseName,
      row.destinationWarehouseName,
    ],
    columns: [
      {
        id: 'number',
        header: 'Transferencia',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: row.productName }),
      },
      { id: 'date', header: 'Fecha', kind: 'date', value: (row) => row.date, hideBelow: 'md' },
      {
        id: 'route',
        header: 'Origen → destino',
        kind: 'muted',
        value: (row) => `${row.originWarehouseName} → ${row.destinationWarehouseName}`,
        hideBelow: 'lg',
      },
      { id: 'quantity', header: 'Cantidad', kind: 'number', value: (row) => row.quantity },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => TRANSFER_STATUS[row.status],
      },
    ],
    form: [
      {
        key: 'productId',
        label: 'Producto',
        type: 'select',
        required: true,
        fullWidth: true,
        optionsFrom: activeProducts,
      },
      {
        key: 'originWarehouseId',
        label: 'Almacén de origen',
        type: 'select',
        required: true,
        optionsFrom: activeWarehouses,
      },
      {
        key: 'destinationWarehouseId',
        label: 'Almacén de destino',
        type: 'select',
        required: true,
        optionsFrom: {
          resource: 'almacenes',
          filter: (row, values) => row.status === 'active' && row.id !== values.originWarehouseId,
        },
      },
      { key: 'quantity', label: 'Cantidad', type: 'number', required: true, min: 1 },
      { key: 'date', label: 'Fecha', type: 'date', required: true },
      { key: 'notes', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({ date: todayIso() }),
    prefill: {
      stock: (item) => ({ productId: item.productId, originWarehouseId: item.warehouseId }),
    },
    editWhen: (row) => row.status === 'pending',
    removeWhen: () => false,
    processActions: [
      {
        id: 'complete',
        label: 'Confirmar llegada',
        when: (row) => row.status === 'pending',
        confirm: {
          title: 'Confirmar transferencia',
          description: (row) =>
            `${row.quantity} de ${row.productName} salen de ${row.originWarehouseName} y entran a ${row.destinationWarehouseName}.`,
          confirmLabel: 'Confirmar',
        },
        success: (row) => `${row.number} completada; el stock de ambos almacenes ya está al día.`,
      },
      {
        id: 'cancel',
        label: 'Anular transferencia',
        tone: 'danger',
        when: (row) => row.status === 'pending',
        confirm: {
          title: 'Anular transferencia',
          description: (row) => `${row.number} quedará anulada sin mover stock.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} quedó anulada.`,
      },
    ],
    flowActions: [
      {
        id: 'kardex',
        label: 'Ver en kardex',
        target: 'kardex',
        icon: History,
        when: (row) => row.status === 'completed',
        search: (row) => row.number,
      },
    ],
  },
};
