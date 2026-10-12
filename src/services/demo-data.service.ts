import { withLatency } from './mocks/latency';
import { mockDb, type DatasetState } from './mocks/mock-db';

/**
 * Control de los datos de demostración (solo existe mientras no hay backend).
 * Permite vaciar el sistema para verlo "desde cero" o volver a los datos de ejemplo.
 */
export const demoDataService = {
  state(): DatasetState {
    return mockDb.state();
  },

  clearAll(): Promise<void> {
    return withLatency(() => {
      mockDb.clear();
    });
  },

  restore(): Promise<void> {
    return withLatency(() => {
      mockDb.reset();
    });
  },
};
