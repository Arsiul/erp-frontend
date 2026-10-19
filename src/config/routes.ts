import { RESOURCE_MODULE, type ResourceKey } from '@/types/resources';

/** Rutas fijas fuera de los listados de recursos. */
export const ROUTES = {
  home: '/',
  login: '/login',
  forbidden: '/sin-acceso',
  reports: '/reportes',
  settings: '/administracion/configuracion',
} as const;

/**
 * Ruta del listado de un recurso: /grupo/recurso (ej.: /comercial/ventas).
 * Si el recurso tiene el mismo nombre que su grupo (documentos), la ruta es solo /grupo.
 */
export function resourcePath(resource: ResourceKey, params?: Record<string, string>): string {
  const module = RESOURCE_MODULE[resource];
  const path = module === resource ? `/${module}` : `/${module}/${resource}`;
  const query = params ? new URLSearchParams(params).toString() : '';
  return query ? `${path}?${query}` : path;
}

/** Abre el formulario de registro de `target` con los datos de `source` ya cargados (?new=1&from=recurso:id). */
export function flowPath(target: ResourceKey, source: ResourceKey, sourceId: string): string {
  return resourcePath(target, { new: '1', from: `${source}:${sourceId}` });
}
