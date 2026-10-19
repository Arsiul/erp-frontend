import { FileCheck2, HandCoins, ReceiptText, ShoppingCart, Undo2 } from 'lucide-react';

import { attachDocumentFlow } from '@/modules/shared/common-actions';
import type { FormField, ListDefinitionsFor, LookupSource } from '@/modules/shared/list-definition';
import {
  balanceBadge,
  CREDIT_NOTE_REASON,
  INVOICE_KIND,
  INVOICE_STATUS,
  optionsOf,
  PAYMENT_TERM,
  QUOTE_STATUS,
  SALE_STATUS,
} from '@/modules/shared/status';
import type { Quote, Sale } from '@/types/comercial';
import { todayIso } from '@/utils/dates';

/** Vendedor: se elige entre los usuarios activos y se guarda su nombre. */
const SELLERS: LookupSource = {
  resource: 'usuarios',
  value: (row) => row.name,
  label: (row) => row.name,
  filter: (row) => row.status === 'active',
};

const QUOTE_SELLER: FormField<Quote> = {
  key: 'seller',
  label: 'Vendedor',
  type: 'select',
  required: true,
  optionsFrom: SELLERS,
};

const SALE_SELLER: FormField<Sale> = { ...QUOTE_SELLER, key: 'seller' };

const activeCustomers = {
  resource: 'clientes',
  filter: (row: { status: string }) => row.status === 'active',
} as const;

export const COMERCIAL_LISTS: ListDefinitionsFor<
  'cotizaciones' | 'ventas' | 'comprobantes' | 'notas-credito' | 'cuentas-cobrar'
> = {
  cotizaciones: {
    entity: { singular: 'cotización', plural: 'cotizaciones', newLabel: 'Nueva cotización' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, cliente o vendedor...',
    searchFields: (row) => [row.number, row.customerName, row.seller, row.saleNumber],
    columns: [
      {
        id: 'number',
        header: 'Cotización',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: row.customerName }),
      },
      {
        id: 'issuedAt',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'md',
      },
      {
        id: 'validUntil',
        header: 'Vigente hasta',
        kind: 'date',
        value: (row) => row.validUntil,
        hideBelow: 'lg',
      },
      {
        id: 'seller',
        header: 'Vendedor',
        kind: 'person',
        value: (row) => row.seller,
        hideBelow: 'xl',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => QUOTE_STATUS[row.status] },
      {
        id: 'saleNumber',
        header: 'Venta',
        kind: 'code',
        value: (row) => row.saleNumber || '—',
        hideBelow: '2xl',
      },
    ],
    form: [
      {
        key: 'customerId',
        label: 'Cliente',
        type: 'select',
        required: true,
        fullWidth: true,
        optionsFrom: activeCustomers,
      },
      { key: 'issuedAt', label: 'Fecha de emisión', type: 'date', required: true },
      {
        key: 'validUntil',
        label: 'Vigente hasta',
        type: 'date',
        hint: 'Vacío: se usa la vigencia de Configuración.',
      },
      QUOTE_SELLER,
      {
        key: 'lines',
        label: 'Productos',
        type: 'lines',
        price: 'sale',
        totals: true,
        fullWidth: true,
      },
      { key: 'notes', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({ issuedAt: todayIso(), lines: [] }),
    prefill: {
      clientes: (customer) => ({ customerId: customer.id }),
    },
    editWhen: (row) => row.status === 'draft' || row.status === 'sent',
    removeWhen: (row) => row.status === 'draft',
    processActions: [
      {
        id: 'send',
        label: 'Marcar como enviada',
        when: (row) => row.status === 'draft',
        success: (row) => `${row.number} se marcó como enviada.`,
      },
      {
        id: 'accept',
        label: 'Aceptar',
        when: (row) => row.status === 'draft' || row.status === 'sent',
        success: (row) => `${row.number} fue aceptada; ya puedes crear la venta.`,
      },
      {
        id: 'reject',
        label: 'Rechazar',
        tone: 'danger',
        when: (row) => row.status !== 'converted' && row.status !== 'rejected',
        confirm: {
          title: 'Rechazar cotización',
          description: (row) => `${row.number} de ${row.customerName} quedará rechazada.`,
          confirmLabel: 'Rechazar',
        },
        success: (row) => `${row.number} quedó rechazada.`,
      },
    ],
    flowActions: [
      {
        id: 'sale',
        label: 'Crear venta',
        target: 'ventas',
        icon: ShoppingCart,
        when: (row) => row.status === 'accepted',
      },
      {
        id: 'view-sale',
        label: 'Ver venta',
        target: 'ventas',
        when: (row) => row.status === 'converted',
        search: (row) => row.saleNumber,
      },
    ],
  },

  ventas: {
    entity: { singular: 'venta', plural: 'ventas', newLabel: 'Nueva venta' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, cliente, cotización o comprobante...',
    searchFields: (row) => [
      row.number,
      row.customerName,
      row.quoteNumber,
      row.invoiceNumber,
      row.seller,
    ],
    columns: [
      {
        id: 'number',
        header: 'Venta',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: row.customerName }),
      },
      {
        id: 'issuedAt',
        header: 'Fecha',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'md',
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouseName,
        hideBelow: 'xl',
      },
      {
        id: 'term',
        header: 'Condición',
        kind: 'muted',
        value: (row) => PAYMENT_TERM[row.paymentTerm],
        hideBelow: 'lg',
      },
      {
        id: 'seller',
        header: 'Vendedor',
        kind: 'person',
        value: (row) => row.seller,
        hideBelow: '2xl',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => SALE_STATUS[row.status] },
      {
        id: 'invoice',
        header: 'Comprobante',
        kind: 'code',
        value: (row) => row.invoiceNumber || '—',
        hideBelow: 'lg',
      },
      {
        id: 'quote',
        header: 'Cotización',
        kind: 'code',
        value: (row) => row.quoteNumber || '—',
        hideBelow: '2xl',
      },
    ],
    form: [
      {
        key: 'quoteId',
        label: 'Desde cotización',
        type: 'select',
        only: 'create',
        fullWidth: true,
        hint: 'Opcional. Toma el cliente y los productos de una cotización aceptada.',
        optionsFrom: { resource: 'cotizaciones', filter: (row) => row.status === 'accepted' },
      },
      {
        key: 'customerId',
        label: 'Cliente',
        type: 'select',
        required: true,
        only: 'create',
        fullWidth: true,
        optionsFrom: activeCustomers,
        visible: (values) => !values.quoteId,
      },
      {
        key: 'warehouseId',
        label: 'Almacén de despacho',
        type: 'select',
        required: true,
        only: 'create',
        optionsFrom: { resource: 'almacenes', filter: (row) => row.status === 'active' },
      },
      { key: 'issuedAt', label: 'Fecha', type: 'date', required: true, only: 'create' },
      {
        key: 'paymentTerm',
        label: 'Condición de pago',
        type: 'select',
        required: true,
        options: optionsOf(PAYMENT_TERM),
        hint: 'El crédito usa los días y la línea del cliente.',
      },
      SALE_SELLER,
      {
        key: 'lines',
        label: 'Productos',
        type: 'lines',
        price: 'sale',
        totals: true,
        only: 'create',
        fullWidth: true,
        visible: (values) => !values.quoteId,
      },
      { key: 'notes', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({ issuedAt: todayIso(), paymentTerm: 'cash', lines: [] }),
    prefill: {
      clientes: (customer) => ({ customerId: customer.id }),
      cotizaciones: (quote) => ({ quoteId: quote.id, seller: quote.seller }),
    },
    editWhen: (row) => row.status === 'pending_invoice',
    processActions: [
      {
        id: 'cancel',
        label: 'Anular venta',
        tone: 'danger',
        when: (row) => row.status === 'pending_invoice',
        confirm: {
          title: 'Anular venta',
          description: (row) =>
            `${row.number} quedará anulada y la mercadería vuelve a ${row.warehouseName}.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} quedó anulada.`,
      },
    ],
    flowActions: [
      {
        id: 'invoice',
        label: 'Facturar',
        target: 'comprobantes',
        icon: ReceiptText,
        when: (row) => row.status === 'pending_invoice',
      },
      {
        id: 'view-invoice',
        label: 'Ver comprobante',
        target: 'comprobantes',
        when: (row) => row.status === 'invoiced',
        search: (row) => row.invoiceNumber,
      },
      attachDocumentFlow(),
    ],
  },

  comprobantes: {
    entity: { singular: 'comprobante', plural: 'comprobantes', newLabel: 'Emitir comprobante' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, cliente o venta...',
    searchFields: (row) => [row.number, row.customerName, row.customerDocument, row.saleNumber],
    columns: [
      {
        id: 'number',
        header: 'Comprobante',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: row.customerName }),
      },
      { id: 'kind', header: 'Tipo', kind: 'muted', value: (row) => INVOICE_KIND[row.kind] },
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
      {
        id: 'sale',
        header: 'Venta',
        kind: 'code',
        value: (row) => row.saleNumber,
        hideBelow: 'lg',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
      {
        id: 'credited',
        header: 'Notas de crédito',
        kind: 'money',
        value: (row) => row.creditedAmount,
        hideBelow: '2xl',
      },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => INVOICE_STATUS[row.status] },
    ],
    form: [
      {
        key: 'saleId',
        label: 'Venta a facturar',
        type: 'select',
        required: true,
        fullWidth: true,
        optionsFrom: {
          resource: 'ventas',
          label: (row) => `${row.number} · ${row.customerName}`,
          filter: (row) => row.status === 'pending_invoice',
        },
      },
      {
        key: 'kind',
        label: 'Tipo',
        type: 'select',
        options: optionsOf(INVOICE_KIND),
        hint: 'Vacío: factura si el cliente tiene RUC; si no, boleta.',
      },
      { key: 'issuedAt', label: 'Fecha de emisión', type: 'date', required: true },
    ],
    createDefaults: () => ({ issuedAt: todayIso() }),
    prefill: {
      ventas: (sale) => ({ saleId: sale.id }),
    },
    processActions: [
      {
        id: 'cancel',
        label: 'Anular comprobante',
        tone: 'danger',
        when: (row) => row.status === 'issued',
        confirm: {
          title: 'Anular comprobante',
          description: (row) =>
            `${row.number} quedará anulado junto con su cuenta por cobrar. La venta ${row.saleNumber} se anula y la mercadería vuelve al almacén.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} quedó anulado.`,
      },
    ],
    flowActions: [
      {
        id: 'credit-note',
        label: 'Emitir nota de crédito',
        target: 'notas-credito',
        icon: Undo2,
        when: (row) => row.status === 'issued',
      },
      {
        id: 'receivable',
        label: 'Ver cuenta por cobrar',
        target: 'cuentas-cobrar',
        icon: HandCoins,
        search: (row) => row.number,
      },
      attachDocumentFlow(),
    ],
  },

  'notas-credito': {
    entity: {
      singular: 'nota de crédito',
      plural: 'notas de crédito',
      newLabel: 'Nueva nota de crédito',
    },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, comprobante o cliente...',
    searchFields: (row) => [row.number, row.invoiceNumber, row.customerName],
    columns: [
      {
        id: 'number',
        header: 'Nota de crédito',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: row.customerName }),
      },
      { id: 'invoice', header: 'Comprobante', kind: 'code', value: (row) => row.invoiceNumber },
      {
        id: 'issuedAt',
        header: 'Emisión',
        kind: 'date',
        value: (row) => row.issuedAt,
        hideBelow: 'md',
      },
      {
        id: 'reason',
        header: 'Motivo',
        kind: 'muted',
        value: (row) => CREDIT_NOTE_REASON[row.reason],
        hideBelow: 'lg',
      },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouseName,
        hideBelow: '2xl',
      },
      { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
    ],
    form: [
      {
        key: 'invoiceId',
        label: 'Comprobante',
        type: 'select',
        required: true,
        fullWidth: true,
        optionsFrom: {
          resource: 'comprobantes',
          label: (row) => `${row.number} · ${row.customerName}`,
          filter: (row) => row.status === 'issued',
        },
      },
      {
        key: 'reason',
        label: 'Motivo',
        type: 'select',
        required: true,
        options: optionsOf(CREDIT_NOTE_REASON),
        hint: 'La devolución reingresa la mercadería al almacén.',
      },
      { key: 'issuedAt', label: 'Fecha de emisión', type: 'date', required: true },
      {
        key: 'lines',
        label: 'Productos a acreditar',
        type: 'lines',
        price: 'sale',
        totals: true,
        fullWidth: true,
        source: {
          field: 'invoiceId',
          resource: 'comprobantes',
          lines: (invoice) => invoice.lines.map((line) => ({ ...line, max: line.quantity })),
        },
      },
      { key: 'notes', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({ issuedAt: todayIso(), reason: 'return', lines: [] }),
    prefill: {
      comprobantes: (invoice) => ({ invoiceId: invoice.id }),
    },
    flowActions: [
      {
        id: 'invoice',
        label: 'Ver comprobante',
        target: 'comprobantes',
        search: (row) => row.invoiceNumber,
      },
      {
        id: 'receivable',
        label: 'Ver cuenta por cobrar',
        target: 'cuentas-cobrar',
        search: (row) => row.invoiceNumber,
      },
    ],
  },

  'cuentas-cobrar': {
    entity: { singular: 'cuenta por cobrar', plural: 'cuentas por cobrar', newLabel: '' },
    rowTitle: (row) => row.documentNumber,
    searchPlaceholder: 'Buscar por comprobante o cliente...',
    searchFields: (row) => [row.documentNumber, row.customerName],
    columns: [
      {
        id: 'document',
        header: 'Comprobante',
        kind: 'title',
        value: (row) => ({ title: row.documentNumber, subtitle: row.customerName }),
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
        id: 'credited',
        header: 'Notas de crédito',
        kind: 'money',
        value: (row) => row.creditedAmount,
        hideBelow: '2xl',
      },
      {
        id: 'paid',
        header: 'Cobrado',
        kind: 'money',
        value: (row) => row.paidAmount,
        hideBelow: 'lg',
      },
      { id: 'balance', header: 'Saldo', kind: 'money', value: (row) => row.balance },
      { id: 'status', header: 'Estado', kind: 'badge', value: balanceBadge },
    ],
    flowActions: [
      {
        id: 'collect',
        label: 'Registrar cobro',
        target: 'movimientos',
        icon: HandCoins,
        inline: true,
        when: (row) => row.balance > 0 && row.status !== 'cancelled',
      },
      {
        id: 'invoice',
        label: 'Ver comprobante',
        target: 'comprobantes',
        icon: FileCheck2,
        search: (row) => row.documentNumber,
      },
      {
        id: 'movements',
        label: 'Ver cobros',
        target: 'movimientos',
        search: (row) => row.documentNumber,
        when: (row) => row.paidAmount > 0,
      },
    ],
  },
};
