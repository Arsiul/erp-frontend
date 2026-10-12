import type { BadgeValue } from '@/components/data-table/types';
import type { PaymentTerm } from '@/types/comercial';

export const PAYMENT_TERM_LABEL: Record<PaymentTerm, string> = {
  cash: 'Contado',
  credit30: 'Crédito 30 días',
  credit60: 'Crédito 60 días',
};

export const ACTIVE_STATUS: Record<'active' | 'inactive', BadgeValue> = {
  active: { label: 'Activo', tone: 'success', appearance: 'soft' },
  inactive: { label: 'Inactivo', tone: 'neutral', appearance: 'soft' },
};
