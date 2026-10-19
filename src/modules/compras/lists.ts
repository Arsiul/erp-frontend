import { FileInput, HandCoins, PackageCheck, ReceiptText } from 'lucide-react';

import { attachDocumentFlow } from '@/modules/shared/common-actions';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import {
  balanceBadge,
  PURCHASE_ORDER_STATUS,
  RECEIPT_STATUS,
  SUPPLIER_INVOICE_STATUS,
} from '@/modules/shared/status';
import { todayIso } from '@/utils/dates';

export const COMPRAS_LISTS: ListDefinitionsFor<
  'ordenes-compra' | 'recepciones' | 'facturas-proveedor' | 'cuentas-pagar'
> = {
  'ordenes-compra': {
    entity: { singular: 'orden de compra', plural: 'órdenes de compra', newLabel: 'Nueva orden' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, proveedor o almacén...',
    searchFields: (row) => [row.number, row.supplierName, row.warehouseName],
    columns: [
      {
        id: 'number',
        header: 'Orden',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: row.supplierName }),
      },
      {
        id: 'issuedAt',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'md',
      },
      {
        id: 'expectedAt',
        header: 'Entrega esperada',
        kind: 'date',
        value: (row) => row.expectedAt,
        hideBelow: 'lg',
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouseName,
        hideBelow: 'xl',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => PURCHASE_ORDER_STATUS[row.status],
      },
    ],
    form: [
      {
        key: 'supplierId',
        label: 'Proveedor',
        type: 'select',
        required: true,
        fullWidth: true,
        optionsFrom: { resource: 'proveedores', filter: (row) => row.status === 'active' },
      },
      {
        key: 'warehouseId',
        label: 'Almacén de destino',
        type: 'select',
        required: true,
        optionsFrom: { resource: 'almacenes', filter: (row) => row.status === 'active' },
      },
      { key: 'issuedAt', label: 'Fecha de emisión', type: 'date', required: true },
      {
        key: 'expectedAt',
        label: 'Entrega esperada',
        type: 'date',
        hint: 'Vacío: una semana después de la emisión.',
      },
      {
        key: 'lines',
        label: 'Productos',
        type: 'lines',
        price: 'cost',
        totals: true,
        fullWidth: true,
      },
      { key: 'notes', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({ issuedAt: todayIso(), lines: [] }),
    prefill: {
      proveedores: (supplier) => ({ supplierId: supplier.id }),
      stock: (item) => ({
        warehouseId: item.warehouseId,
        lines: [
          {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            /** Lo que falta para volver al doble del mínimo. */
            quantity: Math.max(1, item.minStock * 2 - item.quantity),
            unitPrice: item.unitCost,
            receivedQuantity: 0,
          },
        ],
      }),
    },
    editWhen: (row) => row.status === 'draft',
    removeWhen: (row) => row.status === 'draft',
    processActions: [
      {
        id: 'approve',
        label: 'Aprobar',
        when: (row) => row.status === 'draft',
        confirm: {
          title: 'Aprobar orden de compra',
          description: (row) =>
            `${row.number} queda lista para recibir mercadería y ya no se podrá editar.`,
          confirmLabel: 'Aprobar',
        },
        success: (row) => `${row.number} quedó aprobada; ya puedes recibir la mercadería.`,
      },
      {
        id: 'cancel',
        label: 'Anular orden',
        tone: 'danger',
        when: (row) => row.status === 'draft' || row.status === 'approved',
        confirm: {
          title: 'Anular orden de compra',
          description: (row) => `${row.number} de ${row.supplierName} quedará anulada.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} quedó anulada.`,
      },
    ],
    flowActions: [
      {
        id: 'receive',
        label: 'Recibir mercadería',
        target: 'recepciones',
        icon: PackageCheck,
        when: (row) => row.status === 'approved' || row.status === 'partial',
      },
      {
        id: 'receipts',
        label: 'Ver recepciones',
        target: 'recepciones',
        when: (row) => row.status === 'partial' || row.status === 'received',
        search: (row) => row.number,
      },
      attachDocumentFlow(),
    ],
  },

  recepciones: {
    entity: { singular: 'recepción', plural: 'recepciones', newLabel: 'Nueva recepción' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, orden, guía o proveedor...',
    searchFields: (row) => [
      row.number,
      row.purchaseOrderNumber,
      row.guideNumber,
      row.supplierName,
      row.supplierInvoiceNumber,
    ],
    columns: [
      {
        id: 'number',
        header: 'Recepción',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: row.supplierName }),
      },
      { id: 'order', header: 'Orden', kind: 'code', value: (row) => row.purchaseOrderNumber },
      {
        id: 'guide',
        header: 'Guía',
        kind: 'code',
        value: (row) => row.guideNumber,
        hideBelow: 'lg',
      },
      {
        id: 'receivedAt',
        header: 'Fecha',
        kind: 'date',
        value: (row) => row.receivedAt,
        hideBelow: 'md',
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouseName,
        hideBelow: 'xl',
      },
      { id: 'subtotal', header: 'Subtotal', kind: 'money', value: (row) => row.subtotal },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => RECEIPT_STATUS[row.status] },
      {
        id: 'bill',
        header: 'Factura',
        kind: 'code',
        value: (row) => row.supplierInvoiceNumber || '—',
        hideBelow: '2xl',
      },
    ],
    form: [
      {
        key: 'purchaseOrderId',
        label: 'Orden de compra',
        type: 'select',
        required: true,
        only: 'create',
        fullWidth: true,
        optionsFrom: {
          resource: 'ordenes-compra',
          label: (row) => `${row.number} · ${row.supplierName}`,
          filter: (row) => row.status === 'approved' || row.status === 'partial',
        },
      },
      {
        key: 'guideNumber',
        label: 'Guía de remisión',
        type: 'text',
        required: true,
        placeholder: 'T001-000123',
      },
      {
        key: 'receivedAt',
        label: 'Fecha de recepción',
        type: 'date',
        required: true,
        only: 'create',
      },
      {
        key: 'lines',
        label: 'Productos recibidos',
        type: 'lines',
        price: 'cost',
        only: 'create',
        fullWidth: true,
        hint: 'Se valoriza al precio de la orden.',
        source: {
          field: 'purchaseOrderId',
          resource: 'ordenes-compra',
          lines: (order) =>
            order.lines
              .map((line) => {
                const pending = line.quantity - line.receivedQuantity;
                return { ...line, quantity: pending, max: pending };
              })
              .filter((line) => line.max > 0),
        },
      },
    ],
    createDefaults: () => ({ receivedAt: todayIso(), lines: [] }),
    prefill: {
      'ordenes-compra': (order) => ({ purchaseOrderId: order.id }),
    },
    editWhen: (row) => row.status !== 'cancelled',
    processActions: [
      {
        id: 'cancel',
        label: 'Anular recepción',
        tone: 'danger',
        when: (row) => row.status === 'pending_bill',
        confirm: {
          title: 'Anular recepción',
          description: (row) =>
            `${row.number} quedará anulada y la mercadería sale de ${row.warehouseName}.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} quedó anulada.`,
      },
    ],
    flowActions: [
      {
        id: 'bill',
        label: 'Registrar factura',
        target: 'facturas-proveedor',
        icon: ReceiptText,
        when: (row) => row.status === 'pending_bill',
      },
      {
        id: 'view-bill',
        label: 'Ver factura',
        target: 'facturas-proveedor',
        when: (row) => row.status === 'billed',
        search: (row) => row.supplierInvoiceNumber,
      },
      {
        id: 'order',
        label: 'Ver orden',
        target: 'ordenes-compra',
        search: (row) => row.purchaseOrderNumber,
      },
      attachDocumentFlow(),
    ],
  },

  'facturas-proveedor': {
    entity: {
      singular: 'factura de proveedor',
      plural: 'facturas de proveedor',
      newLabel: 'Registrar factura',
    },
    rowTitle: (row) => row.documentNumber,
    searchPlaceholder: 'Buscar por número, proveedor o recepción...',
    searchFields: (row) => [row.documentNumber, row.supplierName, row.receiptNumber],
    columns: [
      {
        id: 'number',
        header: 'Factura',
        kind: 'title',
        value: (row) => ({ title: row.documentNumber, subtitle: row.supplierName }),
      },
      {
        id: 'receipt',
        header: 'Recepción',
        kind: 'code',
        value: (row) => row.receiptNumber || '—',
        hideBelow: 'lg',
      },
      {
        id: 'issuedAt',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'md',
      },
      {
        id: 'dueAt',
        header: 'Vencimiento',
        kind: 'date',
        value: (row) => row.dueAt,
        hideBelow: 'xl',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => SUPPLIER_INVOICE_STATUS[row.status],
      },
    ],
    form: [
      {
        key: 'receiptId',
        label: 'Recepción',
        type: 'select',
        fullWidth: true,
        hint: 'Opcional. Toma el proveedor y el importe de la recepción.',
        optionsFrom: {
          resource: 'recepciones',
          label: (row) => `${row.number} · ${row.supplierName}`,
          filter: (row) => row.status === 'pending_bill',
        },
      },
      {
        key: 'supplierId',
        label: 'Proveedor',
        type: 'select',
        required: true,
        fullWidth: true,
        optionsFrom: { resource: 'proveedores', filter: (row) => row.status === 'active' },
        visible: (values) => !values.receiptId,
      },
      {
        key: 'documentNumber',
        label: 'Número de factura',
        type: 'text',
        required: true,
        placeholder: 'F001-000456',
      },
      {
        key: 'subtotal',
        label: 'Subtotal (sin IGV)',
        type: 'money',
        required: true,
        min: 0.01,
        visible: (values) => !values.receiptId,
      },
      { key: 'issuedAt', label: 'Fecha de emisión', type: 'date', required: true },
      {
        key: 'dueAt',
        label: 'Vencimiento',
        type: 'date',
        hint: 'Vacío: según el plazo de pago del proveedor.',
      },
    ],
    createDefaults: () => ({ issuedAt: todayIso() }),
    prefill: {
      recepciones: (receipt) => ({ receiptId: receipt.id }),
      proveedores: (supplier) => ({ supplierId: supplier.id }),
    },
    processActions: [
      {
        id: 'cancel',
        label: 'Anular factura',
        tone: 'danger',
        when: (row) => row.status === 'registered',
        confirm: {
          title: 'Anular factura de proveedor',
          description: (row) =>
            `${row.documentNumber} quedará anulada junto con su cuenta por pagar.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.documentNumber} quedó anulada.`,
      },
    ],
    flowActions: [
      {
        id: 'payable',
        label: 'Ver cuenta por pagar',
        target: 'cuentas-pagar',
        icon: HandCoins,
        search: (row) => row.documentNumber,
      },
      {
        id: 'receipt',
        label: 'Ver recepción',
        target: 'recepciones',
        when: (row) => row.receiptNumber !== '',
        search: (row) => row.receiptNumber,
      },
      attachDocumentFlow(),
    ],
  },

  'cuentas-pagar': {
    entity: { singular: 'cuenta por pagar', plural: 'cuentas por pagar', newLabel: '' },
    rowTitle: (row) => row.documentNumber,
    searchPlaceholder: 'Buscar por factura o proveedor...',
    searchFields: (row) => [row.documentNumber, row.supplierName],
    columns: [
      {
        id: 'document',
        header: 'Factura',
        kind: 'title',
        value: (row) => ({ title: row.documentNumber, subtitle: row.supplierName }),
      },
      {
        id: 'issuedAt',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'xl',
      },
      {
        id: 'dueAt',
        header: 'Vencimiento',
        kind: 'date',
        value: (row) => row.dueAt,
        hideBelow: 'md',
      },
      {
        id: 'amount',
        header: 'Importe',
        kind: 'money',
        value: (row) => row.amount,
        hideBelow: 'lg',
      },
      {
        id: 'paid',
        header: 'Pagado',
        kind: 'money',
        value: (row) => row.paidAmount,
        hideBelow: 'lg',
      },
      { id: 'balance', header: 'Saldo', kind: 'money', value: (row) => row.balance },
      { id: 'status', header: 'Estado', kind: 'badge', value: balanceBadge },
    ],
    flowActions: [
      {
        id: 'pay',
        label: 'Registrar pago',
        target: 'movimientos',
        icon: HandCoins,
        inline: true,
        when: (row) => row.balance > 0 && row.status !== 'cancelled',
      },
      {
        id: 'bill',
        label: 'Ver factura',
        target: 'facturas-proveedor',
        icon: FileInput,
        search: (row) => row.documentNumber,
      },
      {
        id: 'movements',
        label: 'Ver pagos',
        target: 'movimientos',
        search: (row) => row.documentNumber,
        when: (row) => row.paidAmount > 0,
      },
    ],
  },
};
