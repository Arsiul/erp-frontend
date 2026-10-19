import { NAVIGATION } from '@/config/navigation';
import type { ModuleId } from '@/types/administracion';
import type { NavGroup, NavItem } from '@/types/navigation';
import type { ResourceKey } from '@/types/resources';
import { normalizeText } from '@/utils/text';

export interface NavMatch {
  group: NavGroup;
  item: NavItem;
}

/** Indica si la sesión puede ver un módulo; los grupos sin módulo (Inicio) siempre se ven. */
export type CanRead = (module: ModuleId) => boolean;

export function getGroupItems(group: NavGroup): NavItem[] {
  return group.sections.flatMap((section) => section.items);
}

export const ALL_NAV_MATCHES: readonly NavMatch[] = NAVIGATION.flatMap((group) =>
  getGroupItems(group).map((item) => ({ group, item })),
);

export function isGroupVisible(group: NavGroup, canRead: CanRead): boolean {
  return group.module === undefined || canRead(group.module);
}

export function visibleNavigation(canRead: CanRead): NavGroup[] {
  return NAVIGATION.filter((group) => isGroupVisible(group, canRead));
}

/** Primera pantalla de un grupo; es a donde lleva su ícono en la barra lateral. */
export function getGroupEntryPath(group: NavGroup): string {
  return getGroupItems(group)[0]?.path ?? group.path;
}

/** Grupo al que pertenece una ruta. La raíz ("/") y las rutas desconocidas no pertenecen a ninguno. */
export function findGroupByPath(pathname: string): NavGroup | undefined {
  if (pathname === '/') return NAVIGATION.find((group) => group.path === '/');
  return NAVIGATION.find(
    (group) =>
      group.path !== '/' && (pathname === group.path || pathname.startsWith(`${group.path}/`)),
  );
}

export function findNavMatchByPath(pathname: string): NavMatch | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return ALL_NAV_MATCHES.find(({ item }) => item.path === normalized);
}

/** Pantalla que lista un recurso; las acciones de flujo navegan hacia ella. */
export function findNavMatchByResource(resource: ResourceKey): NavMatch | undefined {
  return ALL_NAV_MATCHES.find(
    ({ item }) => item.view.kind === 'resource' && item.view.resource === resource,
  );
}

export function findNavMatchById(id: string): NavMatch | undefined {
  return ALL_NAV_MATCHES.find(({ item }) => item.id === id);
}

/** Busca submódulos por nombre, grupo o descripción, ignorando tildes y mayúsculas. */
export function searchNavigation(query: string, canRead: CanRead, limit = 8): NavMatch[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = ALL_NAV_MATCHES.map((match) => {
    if (!isGroupVisible(match.group, canRead)) return null;
    const label = normalizeText(match.item.label);
    const haystack = `${label} ${normalizeText(match.group.label)} ${normalizeText(match.item.description)}`;
    if (!terms.every((term) => haystack.includes(term))) return null;
    const score = terms.reduce(
      (total, term) => total + (label.startsWith(term) ? 3 : label.includes(term) ? 2 : 1),
      0,
    );
    return { match, score };
  }).filter((entry) => entry !== null);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.match);
}
