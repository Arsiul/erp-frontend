/** Fecha local en formato ISO (YYYY-MM-DD), sin desfase por zona horaria. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(now = new Date()): string {
  return toIsoDate(now);
}

/** Días de `from` a `to` (negativo si `to` es anterior). Acepta fechas ISO con o sin hora. */
export function daysBetween(from: string, to: string): number {
  const start = new Date(`${from.slice(0, 10)}T00:00:00`);
  const end = new Date(`${to.slice(0, 10)}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Un saldo vence al día siguiente de su fecha de vencimiento. */
export function isOverdue(dueAt: string, balance: number, today = todayIso()): boolean {
  return balance > 0 && Boolean(dueAt) && dueAt.slice(0, 10) < today;
}
