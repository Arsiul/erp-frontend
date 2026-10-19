/**
 * Accesos del botón "Crear". Referencian submódulos por id para no duplicar rutas ni íconos;
 * abren el formulario de registro del listado (`?new=1`).
 */
export const QUICK_CREATE_ACTIONS = [
  { navItemId: 'cotizaciones', label: 'Nueva cotización' },
  { navItemId: 'ventas', label: 'Nueva venta' },
  { navItemId: 'ordenes-compra', label: 'Nueva orden de compra' },
  { navItemId: 'movimientos', label: 'Nuevo movimiento' },
  { navItemId: 'clientes', label: 'Nuevo cliente' },
  { navItemId: 'productos', label: 'Nuevo producto' },
] as const;
