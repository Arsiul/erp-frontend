export type DebtStatus = 'pending' | 'partial' | 'overdue' | 'paid';

interface Debt {
  id: string;
  document: string;
  /** Fechas ISO (YYYY-MM-DD). */
  issuedAt: string;
  dueAt: string;
  total: number;
  paid: number;
  status: DebtStatus;
}

export interface Receivable extends Debt {
  customer: string;
}

export interface Payable extends Debt {
  supplier: string;
}

export interface TreasuryAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank';
  /** Número de cuenta para bancos; responsable para cajas. */
  reference: string;
  balance: number;
  status: 'open' | 'closed' | 'active';
}
