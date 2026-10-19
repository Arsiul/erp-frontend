import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useSession } from '@/hooks/useSession';
import { NoAccessPage } from '@/pages/NoAccessPage';
import type { NavGroup } from '@/types/navigation';
import { isGroupVisible } from '@/utils/navigation';

/** Sin sesión, todo el ERP redirige al acceso y vuelve a la ruta pedida al ingresar. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();
  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

/** Las rutas de un grupo que el rol no puede consultar muestran el aviso en vez de la pantalla. */
export function RequireGroup({ group, children }: { group: NavGroup; children: ReactNode }) {
  const { can } = useSession();
  if (!isGroupVisible(group, (module) => can(module))) return <NoAccessPage area={group.label} />;
  return children;
}
