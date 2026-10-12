import { NAVIGATION } from '@/config/navigation';
import type { NavGroup, NavItem } from '@/types/navigation';
import { normalizeText } from '@/utils/text';

export interface NavMatch {
  group: NavGroup;
  item: NavItem;
}

export function getGroupItems(group: NavGroup): NavItem[] {
  return group.sections.flatMap((section) => section.items);
}

export const ALL_NAV_MATCHES: readonly NavMatch[] = NAVIGATION.flatMap((group) =>
  getGroupItems(group).map((item) => ({ group, item })),
);

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

/** Busca submódulos por nombre, grupo o descripción, ignorando tildes y mayúsculas. */
export function searchNavigation(query: string, limit = 8): NavMatch[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = ALL_NAV_MATCHES.map((match) => {
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
