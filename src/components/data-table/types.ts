import type { BadgeAppearance, BadgeTone } from '@/components/ui/Badge';

/**
 * Ancho mínimo **del contenedor de la tabla** (no de la ventana) desde el que se muestra una columna
 * secundaria: sm 672px · md 768px · lg 896px · xl 1024px · 2xl 1152px.
 * Así la tabla se adapta igual con el menú lateral abierto o cerrado.
 */
export type ColumnBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BadgeValue {
  label: string;
  tone: BadgeTone;
  appearance?: BadgeAppearance;
}

interface ColumnBase {
  id: string;
  header: string;
  hideBelow?: ColumnBreakpoint;
}

/**
 * Columna declarativa: el tipo de celda define cómo se muestra y `value` qué dato toma de la fila.
 * Así las pantallas describen sus tablas como datos, sin repetir marcado ni estilos.
 */
export type Column<T> = ColumnBase &
  (
    | { kind: 'title'; value: (row: T) => { title: string; subtitle?: string } }
    | { kind: 'text' | 'muted' | 'code'; value: (row: T) => string }
    | { kind: 'person'; value: (row: T) => string }
    | { kind: 'date' | 'datetime'; value: (row: T) => string }
    | { kind: 'money'; value: (row: T) => number }
    | { kind: 'number'; value: (row: T) => number; unit?: string; signed?: boolean }
    | { kind: 'badge'; value: (row: T) => BadgeValue }
  );
