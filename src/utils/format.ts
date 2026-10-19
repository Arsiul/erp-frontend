import { CURRENCY, LOCALE } from '@/config/app';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const decimalFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

/** Recibe un porcentaje expresado como número (8.4 = 8,4 %) y muestra el signo. */
export function formatChange(percent: number): string {
  return percentFormatter.format(percent / 100);
}

/** Recibe una fecha ISO (YYYY-MM-DD) y la interpreta como fecha local, sin desfase de zona horaria. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return isoDate;
  return dateFormatter.format(new Date(year, month - 1, day));
}

/** Recibe fecha y hora ISO local (YYYY-MM-DDTHH:mm): "12 oct. 2026, 09:41". */
export function formatDateTime(isoDateTime: string): string {
  const [datePart, timePart] = isoDateTime.split('T');
  if (datePart === undefined || timePart === undefined) return isoDateTime;
  return `${formatDate(datePart)}, ${timePart.slice(0, 5)}`;
}
