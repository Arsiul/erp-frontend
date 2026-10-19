import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Avatar } from '@/components/ui/Avatar';
import { useLogout, useSession } from '@/hooks/useSession';

/** Usuario de la sesión, con su rol y el cierre de sesión. */
export function UserBlock() {
  const { session } = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  if (!session) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="flex min-w-0 cursor-pointer items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-surface"
        aria-label={`Cuenta de ${session.user.name}`}
      >
        <Avatar name={session.user.name} className="ring-2 ring-primary-100 ring-offset-2" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-ink uppercase">{session.user.name}</p>
          <p className="truncate text-xs text-ink-subtle">{session.role.name}</p>
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-2xl border border-line bg-white p-1.5 shadow-popover data-[state=closed]:animate-popover-out data-[state=open]:animate-popover-in"
        >
          <DropdownMenu.Label className="px-3 pt-1.5 pb-2 text-xs text-ink-subtle">
            {session.user.email}
          </DropdownMenu.Label>
          <DropdownMenu.Item
            onSelect={() => {
              logout();
              void navigate('/login', { replace: true });
            }}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink outline-none select-none data-highlighted:bg-primary-50 data-highlighted:text-primary-700"
          >
            <LogOut className="size-4 text-ink-subtle" aria-hidden />
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
