import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FilePlus2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { buttonClassName } from '@/components/ui/button-styles';
import { QUICK_CREATE_ACTIONS } from '@/config/quick-actions';
import { ALL_NAV_MATCHES } from '@/utils/navigation';

const ACTIONS = QUICK_CREATE_ACTIONS.flatMap((action) => {
  const match = ALL_NAV_MATCHES.find(({ item }) => item.id === action.navItemId);
  return match ? [{ ...action, item: match.item }] : [];
});

export function QuickCreateMenu() {
  const navigate = useNavigate();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={buttonClassName({
          variant: 'outline',
          className: 'data-[state=open]:bg-primary-50',
        })}
      >
        <FilePlus2 className="size-4" aria-hidden />
        <span className="hidden sm:inline">Crear</span>
        <span className="sr-only sm:hidden">Crear</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 origin-(--radix-dropdown-menu-content-transform-origin) rounded-2xl border border-line bg-white p-1.5 shadow-popover data-[state=closed]:animate-popover-out data-[state=open]:animate-popover-in"
        >
          <DropdownMenu.Label className="px-3 pt-1.5 pb-2 text-[11px] font-semibold tracking-wider text-ink-subtle uppercase">
            Crear nuevo
          </DropdownMenu.Label>
          {ACTIONS.map(({ navItemId, label, item }) => {
            const Icon = item.icon;
            return (
              <DropdownMenu.Item
                key={navItemId}
                onSelect={() => {
                  void navigate(item.path);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink outline-none select-none data-highlighted:bg-primary-50 data-highlighted:text-primary-700"
              >
                <Icon className="size-4 text-ink-subtle" aria-hidden />
                {label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
