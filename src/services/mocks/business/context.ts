/** Quién ejecuta la operación y cuándo (la semilla fija `now` en cada fecha del escenario). */
export interface BusinessContext {
  userId: string;
  userName: string;
  now: Date;
}

/** Error de regla de negocio: su mensaje se muestra tal cual al usuario. */
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export function fail(message: string): never {
  throw new BusinessError(message);
}

/** Fecha local en formato ISO (YYYY-MM-DD), sin desfase por zona horaria. */
export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Fecha y hora local en formato ISO (YYYY-MM-DDTHH:mm), sin desfase por zona horaria. */
export function isoDateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${isoDate(date)}T${hours}:${minutes}`;
}

/** Suma días a una fecha ISO. */
export function addDays(iso: string, days: number): string {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return isoDate(new Date(year, month - 1, day + days));
}

export { round2 } from '@/utils/money';

/** Texto obligatorio: devuelve el valor recortado o falla con el mensaje. */
export function requireText(value: unknown, message: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) fail(message);
  return text;
}

export function optionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function requireNumber(value: unknown, message: string, min = 0): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < min) fail(message);
  return number;
}

export function requireDate(value: unknown, fallback: string): string {
  const text = optionalText(value);
  if (!text) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail('La fecha no es válida.');
  return text;
}
