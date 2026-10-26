/**
 * Redondea a 2 decimales con la mitad alejándose de cero, igual que el backend
 * (decimal.js ROUND_HALF_UP). Fijar los céntimos a 6 decimales absorbe el error
 * binario: 2.385 se guarda como 2.38499999… y sin esto daría 2.38.
 */
export function round2(value: number): number {
  const cents = Math.round(Number((Math.abs(value) * 100).toFixed(6)));
  return value < 0 ? -cents / 100 : cents / 100;
}
