import type { DocumentLine } from '@/types/comercial';
import { cn } from '@/utils/cn';

export const INPUT_BASE =
  'w-full rounded-xl border bg-white px-3.5 text-sm text-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-ink-subtle focus:ring-4 disabled:opacity-60';
export const INPUT_ERROR = 'border-rose-300 focus:border-rose-400 focus:ring-rose-100';
export const INPUT_NORMAL =
  'border-line hover:border-primary-200 focus:border-primary-400 focus:ring-primary-100';

export function inputClass(invalid: boolean, extra?: string) {
  return cn(INPUT_BASE, invalid ? INPUT_ERROR : INPUT_NORMAL, extra);
}

/** Línea editable: la de un documento más el tope que impone el documento de origen. */
export type FormLine = DocumentLine & { max?: number };

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function linesTotals(lines: readonly FormLine[], igvRate: number) {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  const igv = round2(subtotal * igvRate);
  return { subtotal, igv, total: round2(subtotal + igv) };
}
