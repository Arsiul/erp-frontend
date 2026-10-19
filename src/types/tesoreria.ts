import type { ActiveStatus } from './maestros';

export interface BankAccount {
  id: string;
  bank: string;
  name: string;
  accountNumber: string;
  openingBalance: number;
  balance: number;
  status: ActiveStatus;
}

export type MovementType = 'income' | 'expense';

export type MovementConcept = 'collection' | 'payment' | 'other';

export type PaymentMethod = 'transfer' | 'deposit' | 'cash' | 'check' | 'wallet';

export type MovementStatus = 'posted' | 'voided';

/** Ingreso o egreso de una cuenta. Los cobros y pagos rebajan la cuenta por cobrar o por pagar. */
export interface CashMovement {
  id: string;
  number: string;
  date: string;
  accountId: string;
  accountName: string;
  type: MovementType;
  concept: MovementConcept;
  receivableId: string;
  payableId: string;
  counterparty: string;
  reference: string;
  method: PaymentMethod;
  amount: number;
  status: MovementStatus;
  notes: string;
}
