import type { BusinessAlert } from '@/types/alerts';

/** Datos de demostración. Nombres de empresas ficticios. */
export const ALERTS_MOCK: BusinessAlert[] = [
  {
    id: 'a-stock',
    severity: 'critical',
    title: '23 productos bajo stock mínimo',
    description: 'Cemento, fierro y cable THW con riesgo de quiebre.',
    path: '/compras/reposicion',
  },
  {
    id: 'a-cxc',
    severity: 'critical',
    title: '8 facturas de clientes vencidas',
    description: 'S/ 38,420 pendientes de cobro con más de 30 días.',
    path: '/finanzas/cuentas-cobrar',
  },
  {
    id: 'a-cxp',
    severity: 'warning',
    title: '5 pagos a proveedores esta semana',
    description: 'Vencimientos por S/ 42,150 hasta el viernes.',
    path: '/finanzas/cuentas-pagar',
  },
  {
    id: 'a-credito',
    severity: 'warning',
    title: 'Línea de crédito superada',
    description: 'Constructora Los Cedros S.A.C. excede su límite en S/ 6,200.',
    path: '/comercial/clientes',
  },
  {
    id: 'a-cotizaciones',
    severity: 'info',
    title: '4 cotizaciones vencen mañana',
    description: 'Haz seguimiento antes de que pierdan vigencia.',
    path: '/comercial/cotizaciones',
  },
];
