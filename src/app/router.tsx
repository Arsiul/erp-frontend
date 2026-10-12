import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';

import { NAVIGATION } from '@/config/navigation';
import { AppLayout } from '@/layouts/AppLayout/AppLayout';
import { isListResource } from '@/modules/list-registry';
import { ResourceListPage } from '@/modules/shared/ResourceListPage';
import { AppLoader } from '@/pages/AppLoader';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { getGroupEntryPath, getGroupItems } from '@/utils/navigation';

/**
 * Rutas de los submódulos, generadas desde la configuración de navegación.
 * Hoy cada una muestra su listado de solo lectura; un submódulo sin definición de listado cae en la
 * pantalla "en preparación". Cuando un módulo se implemente, su ruta pasa a `lazy` (como el dashboard).
 */
const moduleRoutes: RouteObject[] = NAVIGATION.flatMap((group) => {
  const items = getGroupItems(group);
  if (items.length === 0) return [];

  return [
    { path: group.path, element: <Navigate to={getGroupEntryPath(group)} replace /> },
    ...items.map((item) => ({
      path: item.path,
      element: isListResource(item.id) ? (
        <ResourceListPage key={item.id} resource={item.id} group={group} item={item} />
      ) : (
        <ModulePlaceholderPage key={item.id} group={group} item={item} />
      ),
    })),
  ];
});

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <AppLoader />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { DashboardPage } = await import('@/modules/dashboard/pages/DashboardPage');
          return { Component: DashboardPage };
        },
      },
      ...moduleRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
