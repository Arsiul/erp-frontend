/** Series del gráfico de ventas; los colores salen de los tokens de diseño (CSS variables). */
export const SALES_CHART_SERIES = [
  { key: 'sales', label: 'Ventas', color: 'var(--color-primary-600)' },
  { key: 'purchases', label: 'Compras', color: 'var(--color-emerald-500)' },
] as const;
