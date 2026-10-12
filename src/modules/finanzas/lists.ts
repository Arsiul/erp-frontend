import type { BadgeValue } from '@/components/data-table/types';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import { fromLabels } from '@/modules/shared/options';
import type { DebtStatus, TreasuryAccount } from '@/types/finanzas';
import { formatCurrency } from '@/utils/format';

const DEBT_STATUS: Record<DebtStatus, BadgeValue> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  partial: { label: 'Pago parcial', tone: 'info' },
  overdue: { label: 'Vencida', tone: 'danger' },
  paid: { label: 'Pagada', tone: 'success' },
};

const ACCOUNT_TYPE: Record<TreasuryAccount['type'], BadgeValue> = {
  cash: { label: 'Caja', tone: 'warning', appearance: 'soft' },
  bank: { label: 'Banco', tone: 'primary', appearance: 'soft' },
};

const ACCOUNT_STATUS: Record<TreasuryAccount['status'], BadgeValue> = {
  open: { label: 'Abierta', tone: 'success' },
  closed: { label: 'Cerrada', tone: 'neutral' },
  active: { label: 'Activa', tone: 'success' },
};

export const FINANZAS_LISTS: ListDefinitionsFor<'cuentas-cobrar' | 'cuentas-pagar' | 'tesoreria'> =
  {
    'cuentas-cobrar': {
      entity: { singular: 'cuenta por cobrar', gender: 'f' },
      rowTitle: (row) => `${row.document} · ${row.customer}`,
      searchPlaceholder: 'Buscar por comprobante o cliente...',
      searchFields: (row) => [row.document, row.customer],
      columns: [
        { id: 'document', header: 'Comprobante', kind: 'code', value: (row) => row.document },
        { id: 'customer', header: 'Cliente', kind: 'muted', value: (row) => row.customer },
        {
          id: 'issued',
          header: 'Emisión',
          kind: 'date',
          value: (row) => row.issuedAt,
          hideBelow: '2xl',
        },
        { id: 'due', header: 'Vence', kind: 'date', value: (row) => row.dueAt, hideBelow: 'sm' },
        { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total, hideBelow: 'lg' },
        { id: 'paid', header: 'Cobrado', kind: 'money', value: (row) => row.paid, hideBelow: 'lg' },
        { id: 'balance', header: 'Saldo', kind: 'money', value: (row) => row.total - row.paid },
        { id: 'status', header: 'Estado', kind: 'badge', value: (row) => DEBT_STATUS[row.status] },
      ],
      statusActions: [
        {
          id: 'collect',
          label: 'Registrar cobro del saldo',
          when: (row) => row.status !== 'paid',
          patch: (row) => ({ paid: row.total, status: 'paid' }),
          confirm: {
            title: '¿Registrar el cobro?',
            description: (row) =>
              `Se registrará el cobro de ${formatCurrency(row.total - row.paid)} de ${row.customer} en la Caja principal.`,
            confirmLabel: 'Registrar cobro',
          },
          success: (row) => `Cobro de ${row.document} registrado.`,
        },
      ],
    },
    'cuentas-pagar': {
      entity: { singular: 'cuenta por pagar', gender: 'f' },
      rowTitle: (row) => `${row.document} · ${row.supplier}`,
      searchPlaceholder: 'Buscar por factura o proveedor...',
      searchFields: (row) => [row.document, row.supplier],
      columns: [
        { id: 'document', header: 'Factura', kind: 'code', value: (row) => row.document },
        { id: 'supplier', header: 'Proveedor', kind: 'muted', value: (row) => row.supplier },
        {
          id: 'issued',
          header: 'Emisión',
          kind: 'date',
          value: (row) => row.issuedAt,
          hideBelow: '2xl',
        },
        { id: 'due', header: 'Vence', kind: 'date', value: (row) => row.dueAt, hideBelow: 'sm' },
        { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total, hideBelow: 'lg' },
        { id: 'paid', header: 'Pagado', kind: 'money', value: (row) => row.paid, hideBelow: 'lg' },
        { id: 'balance', header: 'Saldo', kind: 'money', value: (row) => row.total - row.paid },
        { id: 'status', header: 'Estado', kind: 'badge', value: (row) => DEBT_STATUS[row.status] },
      ],
      statusActions: [
        {
          id: 'pay',
          label: 'Registrar pago del saldo',
          when: (row) => row.status !== 'paid',
          patch: (row) => ({ paid: row.total, status: 'paid' }),
          confirm: {
            title: '¿Registrar el pago?',
            description: (row) =>
              `Se registrará el pago de ${formatCurrency(row.total - row.paid)} a ${row.supplier} desde BCP Cta. Cte. Soles.`,
            confirmLabel: 'Registrar pago',
          },
          success: (row) => `Pago de ${row.document} registrado.`,
        },
      ],
    },
    tesoreria: {
      entity: { singular: 'cuenta de tesorería', gender: 'f' },
      rowTitle: (row) => row.name,
      searchPlaceholder: 'Buscar caja o cuenta bancaria...',
      searchFields: (row) => [row.name, row.reference],
      columns: [
        {
          id: 'name',
          header: 'Cuenta',
          kind: 'title',
          value: (row) => ({ title: row.name, subtitle: row.reference }),
        },
        { id: 'type', header: 'Tipo', kind: 'badge', value: (row) => ACCOUNT_TYPE[row.type] },
        { id: 'balance', header: 'Saldo', kind: 'money', value: (row) => row.balance },
        {
          id: 'status',
          header: 'Estado',
          kind: 'badge',
          value: (row) => ACCOUNT_STATUS[row.status],
        },
      ],
      form: [
        { key: 'name', label: 'Nombre', type: 'text', required: true, fullWidth: true },
        { key: 'type', label: 'Tipo', type: 'select', options: fromLabels(ACCOUNT_TYPE) },
        {
          key: 'reference',
          label: 'N.º de cuenta o responsable',
          type: 'text',
          hint: 'Para bancos, el número de cuenta; para cajas, quién la maneja.',
        },
      ],
      createDefaults: () => ({
        name: '',
        type: 'bank',
        reference: '',
        balance: 0,
        status: 'active',
      }),
      canEdit: () => true,
      // Solo se elimina una cuenta sin dinero.
      canDelete: (row) => row.balance === 0,
      statusActions: [
        {
          id: 'close',
          label: 'Cerrar caja',
          when: (row) => row.type === 'cash' && row.status === 'open',
          patch: () => ({ status: 'closed' }),
          confirm: {
            title: '¿Cerrar la caja?',
            description: (row) =>
              `${row.name} cerrará con ${formatCurrency(row.balance)}. Una caja cerrada no acepta movimientos.`,
            confirmLabel: 'Cerrar caja',
          },
          success: (row) => `${row.name} cerrada.`,
        },
        {
          id: 'open',
          label: 'Abrir caja',
          when: (row) => row.type === 'cash' && row.status === 'closed',
          patch: () => ({ status: 'open' }),
          success: (row) => `${row.name} abierta.`,
        },
      ],
    },
  };
