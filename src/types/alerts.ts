export type AlertSeverity = 'critical' | 'warning' | 'info';

/** Alerta operativa del negocio: se muestra en el dashboard y en la campana de notificaciones. */
export interface BusinessAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Pantalla donde se atiende la alerta. */
  path: string;
}
