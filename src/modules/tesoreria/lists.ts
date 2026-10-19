import { HandCoins, ReceiptText } from 'lucide-react';

import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import {
  MOVEMENT_CONCEPT,
  MOVEMENT_STATUS,
  MOVEMENT_TYPE,
  optionsOf,
  PAYMENT_METHOD,
} from '@/modules/shared/status';
import { todayIso } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';

const isCollection = (values: Record<string, unknown>) => values.concept === 'collection';
const isPayment = (values: Record<string, unknown>) => values.concept === 'payment';
const isOther = (values: Record<string, unknown>) => values.concept === 'other';

export const TESORERIA_LISTS: ListDefinitionsFor<'movimientos'> = {
  movimientos: {
    entity: { singular: 'movimiento', plural: 'movimientos', newLabel: 'Nuevo movimiento' },
    rowTitle: (row) => row.number,
    searchPlaceholder: 'Buscar por número, cuenta, contraparte o documento...',
    searchFields: (row) => [row.number, row.accountName, row.counterparty, row.reference],
    columns: [
      {
        id: 'number',
        header: 'Movimiento',
        kind: 'title',
        value: (row) => ({ title: row.number, subtitle: MOVEMENT_CONCEPT[row.concept] }),
      },
      { id: 'date', header: 'Fecha', kind: 'date', value: (row) => row.date, hideBelow: 'md' },
      {
        id: 'account',
        header: 'Cuenta',
        kind: 'muted',
        value: (row) => row.accountName,
        hideBelow: 'lg',
      },
      {
        id: 'counterparty',
        header: 'Contraparte',
        kind: 'person',
        value: (row) => row.counterparty,
      },
      {
        id: 'reference',
        header: 'Documento',
        kind: 'code',
        value: (row) => row.reference,
        hideBelow: 'xl',
      },
      { id: 'type', header: 'Tipo', kind: 'badge', value: (row) => MOVEMENT_TYPE[row.type] },
      { id: 'amount', header: 'Importe', kind: 'money', value: (row) => row.amount },
      {
        id: 'status',
        header: 'Estado',
        kind: 'badge',
        value: (row) => MOVEMENT_STATUS[row.status],
      },
    ],
    form: [
      {
        key: 'concept',
        label: 'Concepto',
        type: 'select',
        required: true,
        only: 'create',
        options: optionsOf(MOVEMENT_CONCEPT),
      },
      {
        key: 'receivableId',
        label: 'Cuenta por cobrar',
        type: 'select',
        required: true,
        only: 'create',
        fullWidth: true,
        visible: isCollection,
        optionsFrom: {
          resource: 'cuentas-cobrar',
          filter: (row) => row.balance > 0 && row.status !== 'cancelled',
          label: (row) =>
            `${row.documentNumber} · ${row.customerName} · saldo ${formatCurrency(row.balance)}`,
        },
      },
      {
        key: 'payableId',
        label: 'Cuenta por pagar',
        type: 'select',
        required: true,
        only: 'create',
        fullWidth: true,
        visible: isPayment,
        optionsFrom: {
          resource: 'cuentas-pagar',
          filter: (row) => row.balance > 0 && row.status !== 'cancelled',
          label: (row) =>
            `${row.documentNumber} · ${row.supplierName} · saldo ${formatCurrency(row.balance)}`,
        },
      },
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        required: true,
        only: 'create',
        visible: isOther,
        options: optionsOf(MOVEMENT_TYPE),
      },
      {
        key: 'counterparty',
        label: 'Contraparte',
        type: 'text',
        required: true,
        only: 'create',
        visible: isOther,
      },
      {
        key: 'accountId',
        label: 'Cuenta',
        type: 'select',
        required: true,
        only: 'create',
        optionsFrom: { resource: 'cuentas-bancarias', filter: (row) => row.status === 'active' },
      },
      {
        key: 'amount',
        label: 'Importe',
        type: 'money',
        required: true,
        only: 'create',
        min: 0.01,
        hint: 'En cobros y pagos no puede superar el saldo pendiente.',
      },
      { key: 'date', label: 'Fecha', type: 'date', required: true, only: 'create' },
      {
        key: 'method',
        label: 'Medio de pago',
        type: 'select',
        required: true,
        only: 'create',
        options: optionsOf(PAYMENT_METHOD),
      },
      {
        key: 'reference',
        label: 'Referencia',
        type: 'text',
        only: 'create',
        visible: isOther,
        hint: 'Número de operación, recibo u otro documento.',
      },
      { key: 'notes', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({
      concept: 'other',
      type: 'income',
      method: 'transfer',
      date: todayIso(),
    }),
    prefill: {
      'cuentas-cobrar': (receivable) => ({
        type: 'income',
        concept: 'collection',
        receivableId: receivable.id,
        amount: receivable.balance,
      }),
      'cuentas-pagar': (payable) => ({
        type: 'expense',
        concept: 'payment',
        payableId: payable.id,
        amount: payable.balance,
      }),
      'cuentas-bancarias': (account) => ({ accountId: account.id }),
    },
    /** El importe ya movió saldos: para corregirlo se anula y se registra de nuevo. */
    editWhen: (row) => row.status === 'posted',
    removeWhen: () => false,
    processActions: [
      {
        id: 'void',
        label: 'Anular movimiento',
        tone: 'danger',
        when: (row) => row.status === 'posted',
        confirm: {
          title: 'Anular movimiento',
          description: (row) =>
            row.concept === 'other'
              ? `${row.number} quedará anulado y se revertirá el saldo de ${row.accountName}.`
              : `${row.number} quedará anulado; se revertirá el saldo de ${row.accountName} y de ${row.reference}.`,
          confirmLabel: 'Anular',
        },
        success: (row) => `${row.number} quedó anulado y los saldos se revirtieron.`,
      },
    ],
    flowActions: [
      {
        id: 'receivable',
        label: 'Ver cuenta por cobrar',
        target: 'cuentas-cobrar',
        icon: HandCoins,
        when: (row) => row.concept === 'collection',
        search: (row) => row.reference,
      },
      {
        id: 'payable',
        label: 'Ver cuenta por pagar',
        target: 'cuentas-pagar',
        icon: ReceiptText,
        when: (row) => row.concept === 'payment',
        search: (row) => row.reference,
      },
      {
        id: 'account',
        label: 'Ver cuenta',
        target: 'cuentas-bancarias',
        search: (row) => row.accountName,
      },
    ],
  },
};
