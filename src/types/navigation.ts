import type { LucideIcon } from 'lucide-react';

/** Submódulo navegable (una pantalla del ERP). */
export interface NavItem {
  id: string;
  label: string;
  /** Ruta absoluta, siempre bajo la ruta de su grupo. */
  path: string;
  icon: LucideIcon;
  description: string;
  /** Paso del plan de construcción en el que se implementa (estructura.md §9.2). */
  buildStep: number;
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
  /** Vacío cuando el grupo es una pantalla única y no necesita panel contextual. */
  sections: readonly NavSection[];
}
