import { PAYMENT_TERM_LABEL } from '@/modules/shared/labels';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import { fromLabels, SELLER_OPTIONS, TAX_ID_PATTERN } from '@/modules/shared/options';
import { formatCurrency } from '@/utils/format';

import {
  CUSTOMER_STATUS,
  QUOTATION_STATUS,
  SALE_DOCUMENT_TYPE,
  SALE_STATUS,
  SALES_ORDER_STATUS,
} from './labels';

export const COMERCIAL_LISTS: ListDefinitionsFor<
  'clientes' | 'cotizaciones' | 'pedidos' | 'ventas' | 'notas-credito'
> = {
  clientes: {
    entity: { singular: 'cliente', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre, RUC/DNI o vendedor...',
    searchFields: (row) => [row.name, row.documentNumber, row.seller, row.contact],
    columns: [
      {
        id: 'name',
        header: 'Cliente',
        kind: 'title',
        value: (row) => ({
          title: row.name,
          subtitle: `${row.documentType} ${row.documentNumber}`,
        }),
      },
      {
        id: 'contact',
        header: 'Contacto',
        kind: 'muted',
        value: (row) => row.contact,
        hideBelow: '2xl',
      },
      {
        id: 'seller',
        header: 'Vendedor',
        kind: 'person',
        value: (row) => row.seller,
        hideBelow: 'lg',
      },
      {
        id: 'term',
        header: 'Condición',
        kind: 'muted',
        value: (row) => PAYMENT_TERM_LABEL[row.paymentTerm],
        hideBelow: 'sm',
      },
      {
        id: 'limit',
        header: 'Línea de crédito',
        kind: 'money',
        value: (row) => row.creditLimit,
        hideBelow: 'md',
      },
      { id: 'balance', header: 'Deuda actual', kind: 'money', value: (row) => row.balance },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => CUSTOMER_STATUS[row.status],
      },
    ],
    form: [
      {
        key: 'name',
        label: 'Razón social o nombre',
        type: 'text',
        required: true,
        fullWidth: true,
      },
      {
        key: 'documentType',
        label: 'Tipo de documento',
        type: 'select',
        options: [
          { value: 'RUC', label: 'RUC' },
          { value: 'DNI', label: 'DNI' },
        ],
      },
      {
        key: 'documentNumber',
        label: 'Número de documento',
        type: 'text',
        required: true,
        pattern: TAX_ID_PATTERN,
      },
      { key: 'contact', label: 'Contacto', type: 'text' },
      { key: 'phone', label: 'Teléfono', type: 'tel' },
      { key: 'seller', label: 'Vendedor asignado', type: 'select', options: SELLER_OPTIONS },
      {
        key: 'paymentTerm',
        label: 'Condición de pago',
        type: 'select',
        options: fromLabels(PAYMENT_TERM_LABEL),
      },
      {
        key: 'creditLimit',
        label: 'Línea de crédito',
        type: 'money',
        min: 0,
        hint: 'Máximo que el cliente puede deber.',
      },
      { key: 'status', label: 'Estado', type: 'select', options: fromLabels(CUSTOMER_STATUS) },
    ],
    createDefaults: () => ({
      name: '',
      documentType: 'RUC',
      documentNumber: '',
      contact: '',
      phone: '',
      seller: 'Carla Mendoza',
      paymentTerm: 'cash',
      creditLimit: 0,
      balance: 0,
      status: 'active',
    }),
    canEdit: () => true,
    // Un cliente con deuda pendiente no se puede eliminar.
    canDelete: (row) => row.balance === 0,
  },
  cotizaciones: {
    entity: { singular: 'cotización', gender: 'f' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, cliente o vendedor...',
    searchFields: (row) => [row.number, row.customer, row.seller],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'customer', header: 'Cliente', kind: 'muted', value: (row) => row.customer },
      {
        id: 'seller',
        header: 'Vendedor',
        kind: 'person',
        value: (row) => row.seller,
        hideBelow: 'xl',
      },
      {
        id: 'issued',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'md',
      },
      {
        id: 'valid',
        header: 'Válida hasta',
        kind: 'date',
        value: (row) => row.validUntil,
        hideBelow: 'sm',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => QUOTATION_STATUS[row.status],
      },
    ],
    canDelete: (row) => row.status === 'draft',
    statusActions: [
      {
        id: 'send',
        label: 'Marcar como enviada',
        when: (row) => row.status === 'draft',
        patch: () => ({ status: 'sent' }),
        success: (row) => `${row.number} enviada al cliente.`,
      },
      {
        id: 'approve',
        label: 'Aprobar',
        when: (row) => row.status === 'sent',
        patch: () => ({ status: 'approved' }),
        success: (row) => `${row.number} aprobada. Ya puede convertirse en pedido.`,
      },
      {
        id: 'reject',
        label: 'Rechazar',
        tone: 'danger',
        when: (row) => row.status === 'sent',
        patch: () => ({ status: 'rejected' }),
        confirm: {
          title: '¿Rechazar la cotización?',
          description: (row) => `${row.number} de ${row.customer} quedará como rechazada.`,
          confirmLabel: 'Rechazar',
        },
        success: (row) => `${row.number} rechazada.`,
      },
    ],
  },
  pedidos: {
    entity: { singular: 'pedido', gender: 'm' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, cliente o cotización...',
    searchFields: (row) => [row.number, row.customer, row.quotation ?? ''],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'customer', header: 'Cliente', kind: 'muted', value: (row) => row.customer },
      {
        id: 'quotation',
        header: 'Cotización',
        kind: 'muted',
        value: (row) => row.quotation ?? 'Directo',
        hideBelow: '2xl',
      },
      {
        id: 'issued',
        header: 'Fecha',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'sm',
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: 'lg',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => SALES_ORDER_STATUS[row.status],
      },
    ],
    statusActions: [
      {
        id: 'fulfill',
        label: 'Marcar como atendido',
        when: (row) => row.status === 'pending' || row.status === 'partial',
        patch: () => ({ status: 'fulfilled' }),
        success: (row) => `${row.number} atendido.`,
      },
      {
        id: 'void',
        label: 'Anular',
        tone: 'danger',
        when: (row) => row.status === 'pending' || row.status === 'partial',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular el pedido?',
          description: (row) =>
            `${row.number} de ${row.customer} quedará anulado. Esta acción queda registrada en auditoría.`,
          confirmLabel: 'Anular pedido',
        },
        success: (row) => `${row.number} anulado.`,
      },
    ],
  },
  ventas: {
    entity: { singular: 'venta', gender: 'f' },
    rowTitle: (row) => row.document,
    searchPlaceholder: 'Buscar por comprobante, cliente o vendedor...',
    searchFields: (row) => [row.document, row.customer, row.seller],
    columns: [
      { id: 'document', header: 'Comprobante', kind: 'code', value: (row) => row.document },
      {
        id: 'type',
        header: 'Tipo',
        kind: 'badge',
        value: (row) => SALE_DOCUMENT_TYPE[row.documentType],
        hideBelow: 'sm',
      },
      { id: 'customer', header: 'Cliente', kind: 'muted', value: (row) => row.customer },
      {
        id: 'seller',
        header: 'Vendedor',
        kind: 'person',
        value: (row) => row.seller,
        hideBelow: '2xl',
      },
      {
        id: 'issued',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'md',
      },
      { id: 'due', header: 'Vence', kind: 'date', value: (row) => row.dueAt, hideBelow: 'xl' },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => SALE_STATUS[row.status] },
    ],
    statusActions: [
      {
        id: 'void',
        label: 'Anular comprobante',
        tone: 'danger',
        // Solo se anula una venta sin cobros; si ya se cobró, corresponde una nota de crédito.
        when: (row) => row.status === 'pending',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular el comprobante?',
          description: (row) =>
            `${row.document} por ${formatCurrency(row.total)} quedará anulado. El stock vuelve al almacén y se elimina la deuda del cliente.`,
          confirmLabel: 'Anular comprobante',
        },
        success: (row) => `${row.document} anulado.`,
      },
    ],
  },
  'notas-credito': {
    entity: { singular: 'nota de crédito', gender: 'f' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, comprobante o cliente...',
    searchFields: (row) => [row.number, row.sale, row.customer, row.reason],
    columns: [
      { id: 'number', header: 'Número', kind: 'code', value: (row) => row.number },
      { id: 'sale', header: 'Comprobante', kind: 'muted', value: (row) => row.sale },
      {
        id: 'customer',
        header: 'Cliente',
        kind: 'muted',
        value: (row) => row.customer,
        hideBelow: 'lg',
      },
      {
        id: 'reason',
        header: 'Motivo',
        kind: 'muted',
        value: (row) => row.reason,
        hideBelow: '2xl',
      },
      { id: 'issued', header: 'Fecha', kind: 'date', value: (row) => row.issuedAt },
      { id: 'total', header: 'Monto', kind: 'money', value: (row) => row.total },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) =>
          row.status === 'voided'
            ? { label: 'Anulada', tone: 'neutral' }
            : { label: 'Emitida', tone: 'success' },
      },
    ],
    statusActions: [
      {
        id: 'void',
        label: 'Anular',
        tone: 'danger',
        when: (row) => row.status === 'issued',
        patch: () => ({ status: 'voided' }),
        confirm: {
          title: '¿Anular la nota de crédito?',
          description: (row) => `${row.number} sobre ${row.sale} quedará anulada.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} anulada.`,
      },
    ],
  },
};
