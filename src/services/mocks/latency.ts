const DEFAULT_LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 450;

/**
 * Simula la latencia de red para que cargas y guardados se vean igual que con la API real.
 * La operación se ejecuta al final de la espera, como haría el servidor; si falla, la promesa se rechaza.
 */
export function withLatency<T>(operation: () => T, latencyMs = DEFAULT_LATENCY_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(operation());
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, latencyMs);
  });
}
