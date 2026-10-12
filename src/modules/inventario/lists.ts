import type { BadgeValue } from '@/components/data-table/types';
import { ACTIVE_STATUS } from '@/modules/shared/labels';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import { CATEGORY_OPTIONS, fromLabels, UNIT_OPTIONS } from '@/modules/shared/options';
import type { Adjustment, CatalogEntry, Transfer } from '@/types/inventario';

const CATALOG_TYPE: Record<CatalogEntry['type'], BadgeValue> = {
  category: { label: 'Categoría', tone: 'primary', appearance: 'soft' },
  brand: { label: 'Marca', tone: 'info', appearance: 'soft' },
  unit: { label: 'Unidad', tone: 'neutral', appearance: 'soft' },
};

const TRANSFER_STATUS: Record<Transfer['status'], BadgeValue> = {
  'in-transit': { label: 'En tránsito', tone: 'warning' },
  received: { label: 'Recibida', tone: 'success' },
  voided: { label: 'Anulada', tone: 'neutral' },
};

const ADJUSTMENT_STATUS: Record<Adjustment['status'], BadgeValue> = {
  pending: { label: 'Por aprobar', tone: 'warning' },
  approved: { label: 'Aprobado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
};

/** Estado de existencias frente al mínimo configurado. */
function stockLevel(quantity: number, minStock: number): BadgeValue {
  return quantity < minStock
    ? { label: 'Bajo mínimo', tone: 'danger', appearance: 'soft' }
    : { label: 'Normal', tone: 'success', appearance: 'soft' };
}

export const INVENTARIO_LISTS: ListDefinitionsFor<
  'productos' | 'catalogos' | 'almacenes' | 'stock' | 'kardex' | 'transferencias' | 'ajustes'
> = {
  productos: {
    entity: { singular: 'producto', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre, código, categoría o marca...',
    searchFields: (row) => [row.name, row.code, row.category, row.brand],
    columns: [
      {
        id: 'name',
        header: 'Producto',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: `${row.code} · ${row.brand}` }),
      },
      {
        id: 'category',
        header: 'Categoría',
        kind: 'muted',
        value: (row) => row.category,
        hideBelow: 'lg',
      },
      { id: 'unit', header: 'Unidad', kind: 'muted', value: (row) => row.unit, hideBelow: 'xl' },
      { id: 'cost', header: 'Costo', kind: 'money', value: (row) => row.cost, hideBelow: 'xl' },
      { id: 'price', header: 'Precio', kind: 'money', value: (row) => row.price },
      { id: 'stock', header: 'Stock', kind: 'number', value: (row) => row.stock },
      {
        id: 'level',
        header: 'Nivel',
        kind: 'badge',
        value: (row) => stockLevel(row.stock, row.minStock),
      },
    ],
    form: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, fullWidth: true },
      { key: 'code', label: 'Código', type: 'text', required: true, placeholder: 'CEM-001' },
      { key: 'brand', label: 'Marca', type: 'text' },
      { key: 'category', label: 'Categoría', type: 'select', options: CATEGORY_OPTIONS },
      {
        key: 'unit',
        label: 'Unidad de medida',
        type: 'select',
        options: UNIT_OPTIONS,
        hint: 'Una sola unidad por producto.',
      },
      { key: 'price', label: 'Precio de venta', type: 'money', min: 0, required: true },
      { key: 'cost', label: 'Costo', type: 'money', min: 0 },
      {
        key: 'minStock',
        label: 'Stock mínimo',
        type: 'number',
        min: 0,
        hint: 'Por debajo de esta cantidad el sistema avisa.',
      },
      { key: 'status', label: 'Estado', type: 'select', options: fromLabels(ACTIVE_STATUS) },
    ],
    createDefaults: () => ({
      code: '',
      name: '',
      category: 'Construcción',
      brand: '',
      unit: 'UND',
      price: 0,
      cost: 0,
      // El stock nunca se escribe a mano: un producto nuevo empieza en cero.
      stock: 0,
      minStock: 0,
      status: 'active',
    }),
    canEdit: () => true,
    // Un producto con existencias no se puede eliminar.
    canDelete: (row) => row.stock === 0,
  },
  catalogos: {
    entity: { singular: 'elemento del catálogo', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar categoría, marca o unidad...',
    searchFields: (row) => [row.name, CATALOG_TYPE[row.type].label],
    columns: [
      { id: 'name', header: 'Nombre', kind: 'code', value: (row) => row.name },
      { id: 'type', header: 'Tipo', kind: 'badge', value: (row) => CATALOG_TYPE[row.type] },
      { id: 'products', header: 'Productos', kind: 'number', value: (row) => row.productCount },
    ],
    form: [
      { key: 'type', label: 'Tipo', type: 'select', options: fromLabels(CATALOG_TYPE) },
      { key: 'name', label: 'Nombre', type: 'text', required: true },
    ],
    createDefaults: () => ({ type: 'category', name: '', productCount: 0 }),
    canEdit: () => true,
    canDelete: (row) => row.productCount === 0,
  },
  almacenes: {
    entity: { singular: 'almacén', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre, dirección o responsable...',
    searchFields: (row) => [row.name, row.code, row.address, row.manager],
    columns: [
      {
        id: 'name',
        header: 'Almacén',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: row.code }),
      },
      {
        id: 'address',
        header: 'Dirección',
        kind: 'muted',
        value: (row) => row.address,
        hideBelow: 'lg',
      },
      { id: 'manager', header: 'Responsable', kind: 'person', value: (row) => row.manager },
      {
        id: 'products',
        header: 'Productos',
        kind: 'number',
        value: (row) => row.productCount,
        hideBelow: 'md',
      },
      { id: 'value', header: 'Valor del stock', kind: 'money', value: (row) => row.value },
    ],
    form: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'code', label: 'Código', type: 'text', required: true, placeholder: 'ALM-03' },
      { key: 'address', label: 'Dirección', type: 'text', fullWidth: true },
      { key: 'manager', label: 'Responsable', type: 'text' },
    ],
    createDefaults: () => ({
      code: '',
      name: '',
      address: '',
      manager: '',
      productCount: 0,
      value: 0,
    }),
    canEdit: () => true,
    canDelete: (row) => row.productCount === 0,
  },
  stock: {
    entity: { singular: 'existencia', gender: 'f' },
    rowTitle: (row) => `${row.product} · ${row.warehouse}`,
    searchPlaceholder: 'Buscar por producto, código o almacén...',
    searchFields: (row) => [row.product, row.productCode, row.warehouse],
    columns: [
      {
        id: 'product',
        header: 'Producto',
        kind: 'title',
        value: (row) => ({ title: row.product, subtitle: row.productCode }),
      },
      { id: 'warehouse', header: 'Almacén', kind: 'muted', value: (row) => row.warehouse },
      { id: 'quantity', header: 'Cantidad', kind: 'number', value: (row) => row.quantity },
      {
        id: 'min',
        header: 'Mínimo',
        kind: 'number',
        value: (row) => row.minStock,
        hideBelow: 'md',
      },
      {
        id: 'cost',
        header: 'Costo unit.',
        kind: 'money',
        value: (row) => row.unitCost,
        hideBelow: 'xl',
      },
      {
        id: 'value',
        header: 'Valorizado',
        kind: 'money',
        value: (row) => row.quantity * row.unitCost,
        hideBelow: 'lg',
      },
      {
        id: 'level',
        header: 'Nivel',
        kind: 'badge',
        value: (row) => stockLevel(row.quantity, row.minStock),
      },
    ],
    // La cantidad no se edita (solo cambia con movimientos); el mínimo por almacén sí.
    form: [
      {
        key: 'minStock',
        label: 'Stock mínimo en este almacén',
        type: 'number',
        min: 0,
        required: true,
      },
    ],
    canEdit: () => true,
  },
  kardex: {
    entity: { singular: 'movimiento', gender: 'm' },
    rowTitle: (row) => `${row.movement} · ${row.document}`,
    searchPlaceholder: 'Buscar por movimiento o documento...',
    searchFields: (row) => [row.movement, row.document, row.product],
    columns: [
      { id: 'date', header: 'Fecha', kind: 'datetime', value: (row) => row.date },
      {
        id: 'movement',
        header: 'Movimiento',
        kind: 'title',
        value: (row) => ({ title: row.movement, subtitle: row.document }),
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: 'xl',
      },
      {
        id: 'quantity',
        header: 'Entrada / salida',
        kind: 'number',
        value: (row) => row.quantity,
        signed: true,
      },
      { id: 'balance', header: 'Saldo', kind: 'number', value: (row) => row.balance },
      {
        id: 'cost',
        header: 'Costo unit.',
        kind: 'money',
        value: (row) => row.unitCost,
        hideBelow: 'md',
      },
      {
        id: 'value',
        header: 'Saldo valorizado',
        kind: 'money',
        value: (row) => row.balance * row.unitCost,
        hideBelow: 'lg',
      },
    ],
  },
  transferencias: {
    entity: { singular: 'transferencia', gender: 'f' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número o almacén...',
    searchFields: (row) => [row.number, row.from, row.to, row.createdBy],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'from', header: 'Origen', kind: 'muted', value: (row) => row.from },
      { id: 'to', header: 'Destino', kind: 'muted', value: (row) => row.to },
      { id: 'date', header: 'Fecha', kind: 'date', value: (row) => row.createdAt, hideBelow: 'md' },
      {
        id: 'items',
        header: 'Productos',
        kind: 'number',
        value: (row) => row.itemCount,
        hideBelow: 'lg',
      },
      {
        id: 'by',
        header: 'Registró',
        kind: 'person',
        value: (row) => row.createdBy,
        hideBelow: 'xl',
      },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => TRANSFER_STATUS[row.status],
      },
    ],
    statusActions: [
      {
        id: 'receive',
        label: 'Confirmar recepción',
        when: (row) => row.status === 'in-transit',
        patch: () => ({ status: 'received' }),
        confirm: {
          title: '¿Confirmar la recepción?',
          description: (row) => `La mercadería de ${row.number} entrará al stock de ${row.to}.`,
          confirmLabel: 'Confirmar recepción',
        },
        success: (row) => `${row.number} recibida en ${row.to}.`,
      },
      {
        id: 'void',
        label: 'Anular',
        tone: 'danger',
        when: (row) => row.status === 'in-transit',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular la transferencia?',
          description: (row) => `La mercadería de ${row.number} vuelve a ${row.from}.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} anulada.`,
      },
    ],
  },
  ajustes: {
    entity: { singular: 'ajuste', gender: 'm' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, producto o motivo...',
    searchFields: (row) => [row.number, row.product, row.reason, row.warehouse],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'product', header: 'Producto', kind: 'muted', value: (row) => row.product },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: '2xl',
      },
      {
        id: 'quantity',
        header: 'Cantidad',
        kind: 'number',
        value: (row) => row.quantity,
        signed: true,
      },
      {
        id: 'reason',
        header: 'Motivo',
        kind: 'muted',
        value: (row) => row.reason,
        hideBelow: 'lg',
      },
      {
        id: 'by',
        header: 'Solicitó',
        kind: 'person',
        value: (row) => row.requestedBy,
        hideBelow: 'md',
      },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => ADJUSTMENT_STATUS[row.status],
      },
    ],
    statusActions: [
      {
        id: 'approve',
        label: 'Aprobar',
        when: (row) => row.status === 'pending',
        patch: () => ({ status: 'approved' }),
        confirm: {
          title: '¿Aprobar el ajuste?',
          description: (row) =>
            `El stock de ${row.product} en ${row.warehouse} cambiará en ${row.quantity > 0 ? '+' : ''}${String(row.quantity)} unidades.`,
          confirmLabel: 'Aprobar ajuste',
        },
        success: (row) => `${row.number} aprobado. El kardex se actualizó.`,
      },
      {
        id: 'reject',
        label: 'Rechazar',
        tone: 'danger',
        when: (row) => row.status === 'pending',
        patch: () => ({ status: 'rejected' }),
        success: (row) => `${row.number} rechazado.`,
      },
    ],
  },
};
