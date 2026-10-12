import type { DashboardSummary } from '@/types/dashboard';

import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';

/**
 * Fuente de datos del dashboard.
 * Hoy lee la base simulada del navegador. Cuando exista la API (Fase 6) solo cambia el cuerpo de esta
 * función por la llamada HTTP (GET /api/v1/dashboard); la firma y los componentes no se tocan.
 */
export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    return withLatency(() => mockDb.dashboard());
  },
};
