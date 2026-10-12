import type { BadgeValue } from '@/components/data-table/types';

/**
 * Opciones de las listas desplegables mientras no exista la API.
 * Cuando haya backend, estas listas se cargarán de sus maestros (vendedores, almacenes, roles...).
 */

export interface SelectOption {
  value: string;
  label: string;
}

function fromValues(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

/** Convierte un mapa de estados a opciones, usando la etiqueta visible. */
export function fromLabels(map: Record<string, string | BadgeValue>): SelectOption[] {
  return Object.entries(map).map(([value, label]) => ({
    value,
    label: typeof label === 'string' ? label : label.label,
  }));
}

export const SELLER_OPTIONS = fromValues(['Carla Mendoza', 'Jorge Quispe', 'Lucía Torres']);

export const WAREHOUSE_OPTIONS = fromValues(['Almacén principal', 'Sede Ate']);

export const ROLE_OPTIONS = fromValues([
  'Gerente',
  'Jefe comercial',
  'Vendedor',
  'Comprador',
  'Almacenero',
  'Tesorero',
  'Administrador',
]);

export const CATEGORY_OPTIONS = fromValues([
  'Construcción',
  'Electricidad',
  'Gasfitería',
  'Herramientas manuales',
  'Pinturas',
]);

export const UNIT_OPTIONS = fromValues(['UND', 'BOLSA', 'ROLLO', 'CAJA', 'GALÓN', 'METRO']);

export const DOCUMENT_TYPE_OPTIONS = fromValues(['Factura', 'Boleta', 'Nota de crédito']);

/** RUC (11 dígitos) o DNI (8 dígitos). */
export const TAX_ID_PATTERN = {
  regex: /^(\d{8}|\d{11})$/,
  message: 'Debe tener 8 dígitos (DNI) u 11 (RUC).',
};

export const RUC_PATTERN = { regex: /^\d{11}$/, message: 'El RUC debe tener 11 dígitos.' };

export const EMAIL_PATTERN = {
  regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Escribe un correo válido.',
};

/** Fecha de hoy en formato ISO local (YYYY-MM-DD). */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${String(now.getFullYear())}-${month}-${day}`;
}
