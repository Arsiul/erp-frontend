import type { BadgeValue } from '@/components/data-table/types';
import { ACTIVE_STATUS, PAYMENT_TERM_LABEL } from '@/modules/shared/labels';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import { fromLabels, RUC_PATTERN } from '@/modules/shared/options';
import type { PurchaseOrderStatus, Reception, SupplierInvoice } from '@/types/compras';
import { formatCurrency } from '@/utils/format';

const PURCHASE_ORDER_STATUS: Record<PurchaseOrderStatus, BadgeValue> = {
  draft: { label: 'Por aprobar', tone: 'warning' },
  approved: { label: 'Aprobada', tone: 'info' },
  partial: { label: 'Recibida parcial', tone: 'primary' },
  received: { label: 'Recibida', tone: 'success' },
  voided: { label: 'Anulada', tone: 'neutral' },
};

const RECEPTION_STATUS: Record<Reception['status'], BadgeValue> = {
  complete: { label: 'Completa', tone: 'success' },
  partial: { label: 'Parcial', tone: 'info' },
  voided: { label: 'Anulada', tone: 'neutral' },
};

const SUPPLIER_INVOICE_STATUS: Record<SupplierInvoice['status'], BadgeValue> = {
  registered: { label: 'Registrada', tone: 'success' },
  observed: { label: 'Observada', tone: 'warning' },
  voided: { label: 'Anulada', tone: 'neutral' },
};

export const COMPRAS_LISTS: ListDefinitionsFor<
  | 'proveedores'
  | 'reposicion'
  | 'ordenes-compra'
  | 'recepciones'
  | 'facturas-proveedor'
  | 'devoluciones-proveedor'
> = {
  proveedores: {
    entity: { singular: 'proveedor', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por razón social, RUC o contacto...',
    searchFields: (row) => [row.name, row.ruc, row.contact],
    columns: [
      {
        id: 'name',
        header: 'Proveedor',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: `RUC ${row.ruc}` }),
      },
      {
        id: 'contact',
        header: 'Contacto',
        kind: 'muted',
        value: (row) => row.contact,
        hideBelow: 'lg',
      },
      {
        id: 'phone',
        header: 'Teléfono',
        kind: 'muted',
        value: (row) => row.phone,
        hideBelow: 'xl',
      },
      {
        id: 'term',
        header: 'Condición',
        kind: 'muted',
        value: (row) => PAYMENT_TERM_LABEL[row.paymentTerm],
        hideBelow: 'sm',
      },
      { id: 'balance', header: 'Le debemos', kind: 'money', value: (row) => row.balance },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => ACTIVE_STATUS[row.status] },
    ],
    form: [
      { key: 'name', label: 'Razón social', type: 'text', required: true, fullWidth: true },
      { key: 'ruc', label: 'RUC', type: 'text', required: true, pattern: RUC_PATTERN },
      { key: 'contact', label: 'Contacto', type: 'text' },
      { key: 'phone', label: 'Teléfono', type: 'tel' },
      {
        key: 'paymentTerm',
        label: 'Condición de pago que nos dan',
        type: 'select',
        options: fromLabels(PAYMENT_TERM_LABEL),
      },
      { key: 'status', label: 'Estado', type: 'select', options: fromLabels(ACTIVE_STATUS) },
    ],
    createDefaults: () => ({
      name: '',
      ruc: '',
      contact: '',
      phone: '',
      paymentTerm: 'credit30',
      balance: 0,
      status: 'active',
    }),
    canEdit: () => true,
    // Un proveedor al que se le debe no se puede eliminar.
    canDelete: (row) => row.balance === 0,
  },
  reposicion: {
    entity: { singular: 'sugerencia de compra', gender: 'f' },
    rowTitle: (row) => row.product,
    searchPlaceholder: 'Buscar por producto, código o proveedor...',
    searchFields: (row) => [row.product, row.productCode, row.supplier, row.warehouse],
    columns: [
      {
        id: 'product',
        header: 'Producto',
        kind: 'title',
        value: (row) => ({ title: row.product, subtitle: row.productCode }),
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: 'md',
      },
      { id: 'stock', header: 'Stock', kind: 'number', value: (row) => row.stock },
      {
        id: 'min',
        header: 'Mínimo',
        kind: 'number',
        value: (row) => row.minStock,
        hideBelow: 'md',
      },
      {
        id: 'suggested',
        header: 'Sugerido',
        kind: 'number',
        value: (row) => row.suggestedQuantity,
        signed: true,
      },
      {
        id: 'supplier',
        header: 'Proveedor habitual',
        kind: 'muted',
        value: (row) => row.supplier,
        hideBelow: 'xl',
      },
    ],
    form: [
      {
        key: 'suggestedQuantity',
        label: 'Cantidad a pedir',
        type: 'number',
        min: 1,
        required: true,
        hint: 'Se usará al generar la orden de compra.',
      },
    ],
    canEdit: () => true,
    canDelete: () => true,
  },
  'ordenes-compra': {
    entity: { singular: 'orden de compra', gender: 'f' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número o proveedor...',
    searchFields: (row) => [row.number, row.supplier, row.warehouse],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'supplier', header: 'Proveedor', kind: 'muted', value: (row) => row.supplier },
      {
        id: 'issued',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'lg',
      },
      {
        id: 'expected',
        header: 'Entrega',
        kind: 'date',
        value: (row) => row.expectedAt,
        hideBelow: 'sm',
      },
      {
        id: 'warehouse',
        header: 'Destino',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: '2xl',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => PURCHASE_ORDER_STATUS[row.status],
      },
    ],
    canDelete: (row) => row.status === 'draft',
    statusActions: [
      {
        id: 'approve',
        label: 'Aprobar',
        when: (row) => row.status === 'draft',
        patch: () => ({ status: 'approved' }),
        confirm: {
          title: '¿Aprobar la orden de compra?',
          description: (row) =>
            `${row.number} por ${formatCurrency(row.total)} a ${row.supplier} quedará lista para enviarse.`,
          confirmLabel: 'Aprobar',
        },
        success: (row) => `${row.number} aprobada.`,
      },
      {
        id: 'void',
        label: 'Anular',
        tone: 'danger',
        when: (row) => row.status === 'draft' || row.status === 'approved',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular la orden de compra?',
          description: (row) => `${row.number} a ${row.supplier} quedará anulada.`,
          confirmLabel: 'Anular orden',
        },
        success: (row) => `${row.number} anulada.`,
      },
    ],
  },
  recepciones: {
    entity: { singular: 'recepción', gender: 'f' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, orden o proveedor...',
    searchFields: (row) => [row.number, row.purchaseOrder, row.supplier, row.receivedBy],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'order', header: 'Orden', kind: 'muted', value: (row) => row.purchaseOrder },
      {
        id: 'supplier',
        header: 'Proveedor',
        kind: 'muted',
        value: (row) => row.supplier,
        hideBelow: 'lg',
      },
      { id: 'date', header: 'Fecha', kind: 'date', value: (row) => row.receivedAt },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: '2xl',
      },
      {
        id: 'by',
        header: 'Recibió',
        kind: 'person',
        value: (row) => row.receivedBy,
        hideBelow: 'md',
      },
      {
        id: 'items',
        header: 'Productos',
        kind: 'number',
        value: (row) => row.itemCount,
        hideBelow: 'md',
      },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => RECEPTION_STATUS[row.status],
      },
    ],
    statusActions: [
      {
        id: 'void',
        label: 'Anular',
        tone: 'danger',
        when: (row) => row.status !== 'voided',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular la recepción?',
          description: (row) =>
            `${row.number} quedará anulada y la mercadería saldrá del stock de ${row.warehouse}.`,
          confirmLabel: 'Anular recepción',
        },
        success: (row) => `${row.number} anulada.`,
      },
    ],
  },
  'facturas-proveedor': {
    entity: { singular: 'factura de proveedor', gender: 'f' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, proveedor u orden...',
    searchFields: (row) => [row.number, row.supplier, row.purchaseOrder],
    columns: [
      { id: 'number', header: 'Factura', kind: 'code', value: (row) => row.number },
      { id: 'supplier', header: 'Proveedor', kind: 'muted', value: (row) => row.supplier },
      {
        id: 'order',
        header: 'Orden',
        kind: 'muted',
        value: (row) => row.purchaseOrder,
        hideBelow: 'lg',
      },
      {
        id: 'issued',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'xl',
      },
      { id: 'due', header: 'Vence', kind: 'date', value: (row) => row.dueAt, hideBelow: 'sm' },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => SUPPLIER_INVOICE_STATUS[row.status],
      },
    ],
    statusActions: [
      {
        id: 'resolve',
        label: 'Resolver observación',
        when: (row) => row.status === 'observed',
        patch: () => ({ status: 'registered' }),
        success: (row) => `${row.number} validada. Se generó la cuenta por pagar.`,
      },
      {
        id: 'void',
        label: 'Anular',
        tone: 'danger',
        when: (row) => row.status !== 'voided',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular la factura del proveedor?',
          description: (row) => `${row.number} de ${row.supplier} quedará anulada.`,
          confirmLabel: 'Anular factura',
        },
        success: (row) => `${row.number} anulada.`,
      },
    ],
  },
  'devoluciones-proveedor': {
    entity: { singular: 'devolución', gender: 'f' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, proveedor o motivo...',
    searchFields: (row) => [row.number, row.supplier, row.purchaseOrder, row.reason],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'supplier', header: 'Proveedor', kind: 'muted', value: (row) => row.supplier },
      {
        id: 'reason',
        header: 'Motivo',
        kind: 'muted',
        value: (row) => row.reason,
        hideBelow: 'lg',
      },
      {
        id: 'date',
        header: 'Fecha',
        kind: 'date',
        value: (row) => row.returnedAt,
        hideBelow: 'sm',
      },
      { id: 'total', header: 'Monto', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) =>
          row.status === 'voided'
            ? { label: 'Anulada', tone: 'neutral' }
            : { label: 'Registrada', tone: 'success' },
      },
    ],
    statusActions: [
      {
        id: 'void',
        label: 'Anular',
        tone: 'danger',
        when: (row) => row.status === 'registered',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular la devolución?',
          description: (row) => `${row.number} a ${row.supplier} quedará anulada.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} anulada.`,
      },
    ],
  },
};
