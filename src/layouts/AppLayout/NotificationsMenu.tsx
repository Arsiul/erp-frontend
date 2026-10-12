import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router';

import { AlertIcon } from '@/components/AlertIcon';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAlerts } from '@/hooks/useAlerts';

export function NotificationsMenu() {
  const navigate = useNavigate();
  const { data: alerts, isPending } = useAlerts();
  const count = alerts?.length ?? 0;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton label="Notificaciones" icon={<Bell className="size-[18px]" />} badge={count} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-[22rem] max-w-[calc(100vw-2rem)] origin-(--radix-dropdown-menu-content-transform-origin) rounded-2xl border border-line bg-white p-1.5 shadow-popover data-[state=closed]:animate-popover-out data-[state=open]:animate-popover-in"
        >
          <div className="flex items-center justify-between px-3 pt-2 pb-2.5">
            <DropdownMenu.Label className="text-sm font-semibold text-ink">
              Notificaciones
            </DropdownMenu.Label>
            {count > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                {count} activas
              </span>
            )}
          </div>
          <DropdownMenu.Separator className="mx-1 mb-1 h-px bg-line" />

          {isPending && (
            <div className="space-y-2 p-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          )}

          {!isPending && count === 0 && (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-sm text-ink-muted">
              <BellOff className="size-5 text-ink-subtle" aria-hidden />
              Sin notificaciones pendientes
            </div>
          )}

          {alerts?.map((alert) => (
            <DropdownMenu.Item
              key={alert.id}
              onSelect={() => {
                void navigate(alert.path);
              }}
              className="flex cursor-pointer gap-3 rounded-xl px-3 py-2.5 outline-none select-none data-highlighted:bg-surface"
            >
              <AlertIcon severity={alert.severity} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{alert.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                  {alert.description}
                </span>
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
