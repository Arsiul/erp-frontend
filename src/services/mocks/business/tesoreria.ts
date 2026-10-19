import type { BankAccount } from '@/types/tesoreria';

import type { Store } from '../store';

import {
  fail,
  isoDate,
  optionalText,
  requireDate,
  requireNumber,
  requireText,
  round2,
} from './context';
import { balanceStatus } from './documents';
import {
  activationActions,
  activeStatus,
  assertUnique,
  pickEnum,
  requireActive,
  requireRecord,
  type ResourceRules,
} from './rules';

const METHODS = ['transfer', 'deposit', 'cash', 'check', 'wallet'] as const;

function setBalance(store: Store, account: BankAccount, delta: number): void {
  const balance = round2(account.balance + delta);
  if (balance < 0)
    fail(`${account.name} no tiene saldo suficiente (S/ ${account.balance.toFixed(2)}).`);
  store.update('cuentas-bancarias', account.id, { balance });
}

// ─── Cuentas bancarias ─────────────────────────────────────────────────────────

const cuentasBancarias: ResourceRules<'cuentas-bancarias'> = {
  create(store, _ctx, input) {
    const accountNumber = requireText(input.accountNumber, 'Escribe el número de cuenta.');
    assertUnique(
      store.list('cuentas-bancarias'),
      accountNumber,
      (row) => row.accountNumber,
      'Esa cuenta ya está registrada.',
    );
    const openingBalance = requireNumber(
      input.openingBalance ?? 0,
      'El saldo inicial no puede ser negativo.',
    );
    return store.insert('cuentas-bancarias', {
      bank: requireText(input.bank, 'Escribe el banco.'),
      name: requireText(input.name, 'Escribe un nombre para la cuenta.'),
      accountNumber,
      openingBalance,
      balance: openingBalance,
      status: activeStatus(input.status),
    });
  },
  /** El saldo solo cambia con movimientos, así que el saldo inicial queda fijo. */
  update(store, _ctx, current, input) {
    const accountNumber = requireText(
      input.accountNumber ?? current.accountNumber,
      'Escribe el número de cuenta.',
    );
    assertUnique(
      store.list('cuentas-bancarias'),
      accountNumber,
      (row) => row.accountNumber,
      'Esa cuenta ya está registrada.',
      current.id,
    );
    return store.update('cuentas-bancarias', current.id, {
      bank: requireText(input.bank ?? current.bank, 'Escribe el banco.'),
      name: requireText(input.name ?? current.name, 'Escribe un nombre para la cuenta.'),
      accountNumber,
      status: activeStatus(input.status ?? current.status),
    });
  },
  remove(store, _ctx, current) {
    if (store.list('movimientos').some((row) => row.accountId === current.id)) {
      fail('La cuenta tiene movimientos; desactívala en lugar de eliminarla.');
    }
    store.remove('cuentas-bancarias', current.id);
  },
  actions: activationActions('cuentas-bancarias'),
};

// ─── Movimientos (cobros, pagos y otros) ───────────────────────────────────────

const movimientos: ResourceRules<'movimientos'> = {
  create(store, ctx, input) {
    const account = requireActive(store, 'cuentas-bancarias', input.accountId, 'la cuenta');
    const concept = pickEnum(
      input.concept,
      ['collection', 'payment', 'other'],
      'Elige el concepto.',
    );
    const amount = round2(requireNumber(input.amount, 'Escribe el importe.'));
    if (amount <= 0) fail('El importe debe ser mayor que cero.');

    let type = pickEnum(
      input.type,
      ['income', 'expense'],
      'Elige si es ingreso o egreso.',
      'income',
    );
    let counterparty = optionalText(input.counterparty);
    let reference = optionalText(input.reference);
    let receivableId = '';
    let payableId = '';

    if (concept === 'collection') {
      const receivable = requireRecord(
        store,
        'cuentas-cobrar',
        input.receivableId,
        'la cuenta por cobrar',
      );
      if (receivable.status === 'cancelled' || receivable.balance <= 0)
        fail(`${receivable.documentNumber} no tiene saldo por cobrar.`);
      if (amount > receivable.balance)
        fail(
          `El cobro supera el saldo de ${receivable.documentNumber} (S/ ${receivable.balance.toFixed(2)}).`,
        );
      const balance = round2(receivable.balance - amount);
      store.update('cuentas-cobrar', receivable.id, {
        paidAmount: round2(receivable.paidAmount + amount),
        balance,
        status: balanceStatus(receivable.amount, balance),
      });
      type = 'income';
      counterparty = receivable.customerName;
      reference ||= receivable.documentNumber;
      receivableId = receivable.id;
    } else if (concept === 'payment') {
      const payable = requireRecord(store, 'cuentas-pagar', input.payableId, 'la cuenta por pagar');
      if (payable.status === 'cancelled' || payable.balance <= 0)
        fail(`${payable.documentNumber} no tiene saldo por pagar.`);
      if (amount > payable.balance)
        fail(
          `El pago supera el saldo de ${payable.documentNumber} (S/ ${payable.balance.toFixed(2)}).`,
        );
      const balance = round2(payable.balance - amount);
      store.update('cuentas-pagar', payable.id, {
        paidAmount: round2(payable.paidAmount + amount),
        balance,
        status: balanceStatus(payable.amount, balance),
      });
      type = 'expense';
      counterparty = payable.supplierName;
      reference ||= payable.documentNumber;
      payableId = payable.id;
    } else {
      counterparty = requireText(counterparty, 'Escribe a quién corresponde el movimiento.');
    }

    setBalance(store, account, type === 'income' ? amount : -amount);

    return store.insert('movimientos', {
      number: store.nextNumber('movimientos', 'MOV-', 5),
      date: requireDate(input.date, isoDate(ctx.now)),
      accountId: account.id,
      accountName: account.name,
      type,
      concept,
      receivableId,
      payableId,
      counterparty,
      reference,
      method: pickEnum(input.method, METHODS, 'Elige el medio de pago.', 'transfer'),
      amount,
      status: 'posted',
      notes: optionalText(input.notes),
    });
  },
  /** Importe, cuenta y documento ya afectaron saldos: para cambiarlos se anula y se registra otro. */
  update(store, _ctx, current, input) {
    if (current.status !== 'posted') fail('El movimiento está anulado.');
    return store.update('movimientos', current.id, {
      notes: optionalText(input.notes ?? current.notes),
    });
  },
  actions: {
    void: {
      label: 'Anuló',
      run(store, _ctx, current) {
        if (current.status !== 'posted') fail('El movimiento ya está anulado.');
        const account = requireRecord(store, 'cuentas-bancarias', current.accountId, 'la cuenta');
        setBalance(store, account, current.type === 'income' ? -current.amount : current.amount);

        const receivable = current.receivableId
          ? store.get('cuentas-cobrar', current.receivableId)
          : undefined;
        if (receivable) {
          const balance = round2(receivable.balance + current.amount);
          store.update('cuentas-cobrar', receivable.id, {
            paidAmount: round2(receivable.paidAmount - current.amount),
            balance,
            status: balanceStatus(receivable.amount, balance),
          });
        }
        const payable = current.payableId
          ? store.get('cuentas-pagar', current.payableId)
          : undefined;
        if (payable) {
          const balance = round2(payable.balance + current.amount);
          store.update('cuentas-pagar', payable.id, {
            paidAmount: round2(payable.paidAmount - current.amount),
            balance,
            status: balanceStatus(payable.amount, balance),
          });
        }
        store.update('movimientos', current.id, { status: 'voided' });
      },
    },
  },
};

export const tesoreriaRules = { 'cuentas-bancarias': cuentasBancarias, movimientos };
