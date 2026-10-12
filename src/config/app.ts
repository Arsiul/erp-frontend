export const APP_INFO = {
  name: 'EnterpriseCloud',
  tagline: 'ERP',
} as const;

export const COMPANY_INFO = {
  name: 'Distribuidora Ferretera Andina S.A.C.',
  shortName: 'Ferretera Andina',
  branch: 'Almacén principal',
} as const;

/**
 * Usuario fijo mientras no exista autenticación.
 * Se reemplaza por la sesión real cuando se implemente el login (paso 1 del plan de construcción).
 */
export const DEMO_USER = {
  name: 'Usuario Demo',
  role: 'Gerente general',
} as const;

export const LOCALE = 'es-PE';
export const CURRENCY = 'PEN';
