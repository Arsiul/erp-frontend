/**
 * Accesos del botón "Crear". Referencian submódulos por id para no duplicar rutas ni íconos.
 * Mientras los módulos no existan, llevan a la pantalla del submódulo.
 */
export const QUICK_CREATE_ACTIONS = [
  { navItemId: 'cotizaciones', label: 'Nueva cotización' },
  { navItemId: 'pedidos', label: 'Nuevo pedido' },
  { navItemId: 'ventas', label: 'Nueva venta' },
  { navItemId: 'ordenes-compra', label: 'Nueva orden de compra' },
  { navItemId: 'clientes', label: 'Nuevo cliente' },
  { navItemId: 'productos', label: 'Nuevo producto' },
] as const;
