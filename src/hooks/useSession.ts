import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/services/query-keys';
import { sessionService } from '@/services/session.service';
import type { AccessLevel, ModuleId } from '@/types/administracion';

const LEVEL_RANK: Record<AccessLevel, number> = { none: 0, read: 1, write: 2 };

/**
 * Sesión activa. Se resuelve de forma síncrona desde el almacenamiento, pero vive en la caché
 * para que un cambio de rol (que invalida `queryKeys.session`) actualice menús y permisos.
 */
export function useSession() {
  const { data: session } = useQuery({
    queryKey: queryKeys.session,
    queryFn: () => sessionService.current(),
    initialData: () => sessionService.current(),
    staleTime: Infinity,
  });

  const can = useCallback(
    (module: ModuleId, level: AccessLevel = 'read') =>
      session !== null && LEVEL_RANK[session.permissions[module]] >= LEVEL_RANK[level],
    [session],
  );

  return { session, can };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      sessionService.login(email, password),
    onSuccess: (session) => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, session);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    sessionService.logout();
    queryClient.clear();
    queryClient.setQueryData(queryKeys.session, null);
  }, [queryClient]);
}
