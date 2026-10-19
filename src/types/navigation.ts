import type { LucideIcon } from 'lucide-react';

import type { ModuleId } from './administracion';
import type { ReportId } from './reports';
import type { ResourceKey } from './resources';

/** Qué muestra una pantalla: el listado de un recurso, un reporte o la configuración. */
export type NavView =
  | { kind: 'resource'; resource: ResourceKey }
  | { kind: 'report'; report: ReportId }
  | { kind: 'settings' };

/** Submódulo navegable (una pantalla del ERP). */
export interface NavItem {
  id: string;
  label: string;
  /** Ruta absoluta, siempre bajo la ruta de su grupo. */
  path: string;
  icon: LucideIcon;
  description: string;
  view: NavView;
}

/** Bloque de submódulos dentro del panel contextual de un grupo. */
export interface NavSection {
  id: string;
  title?: string;
  items: readonly NavItem[];
}

/** Grupo de primer nivel (un ícono de la barra lateral). */
export interface NavGroup {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  /** Permiso que lo habilita; sin módulo (Inicio) lo ve cualquier sesión. */
  module?: ModuleId;
  /** Vacío cuando el grupo es una pantalla única y no necesita panel contextual. */
  sections: readonly NavSection[];
}
