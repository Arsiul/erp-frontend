import type { BusinessAlert } from '@/types/alerts';

import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';

/**
 * Fuente de alertas operativas.
 * Hoy lee la base simulada del navegador; en la Fase 6 se reemplaza por GET /api/v1/dashboard/alerts.
 */
export const alertsService = {
  getActive(): Promise<BusinessAlert[]> {
    return withLatency(() => mockDb.alerts());
  },
};
