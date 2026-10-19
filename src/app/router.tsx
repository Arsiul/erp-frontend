import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';

import { NAVIGATION } from '@/config/navigation';
import { AppLayout } from '@/layouts/AppLayout/AppLayout';
import { SettingsPage } from '@/modules/administracion/SettingsPage';
import { ReportPage } from '@/modules/reportes/ReportPage';
import { ResourceListPage } from '@/modules/shared/ResourceListPage';
import type { NavGroup, NavItem } from '@/types/navigation';
import { AppLoader } from '@/pages/AppLoader';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { getGroupEntryPath, getGroupItems } from '@/utils/navigation';

import { RequireGroup, RequireSession } from './route-guards';

function screenFor(group: NavGroup, item: NavItem): ReactNode {
  switch (item.view.kind) {
    case 'resource':
      return (
        <ResourceListPage key={item.id} resource={item.view.resource} group={group} item={item} />
      );
    case 'report':
      return <ReportPage key={item.id} report={item.view.report} group={group} item={item} />;
    case 'settings':
      return <SettingsPage key={item.id} group={group} item={item} />;
  }
}

/** Rutas de los submódulos, generadas desde la configuración de navegación. */
const moduleRoutes: RouteObject[] = NAVIGATION.flatMap((group) => {
  const items = getGroupItems(group);
  if (items.length === 0) return [];

  return [
    {
      path: group.path,
      element: (
        <RequireGroup group={group}>
          <Navigate to={getGroupEntryPath(group)} replace />
        </RequireGroup>
      ),
    },
    ...items.map((item) => ({
      path: item.path,
      element: <RequireGroup group={group}>{screenFor(group, item)}</RequireGroup>,
    })),
  ];
});

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    path: '/',
    element: (
      <RequireSession>
        <AppLayout />
      </RequireSession>
    ),
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
