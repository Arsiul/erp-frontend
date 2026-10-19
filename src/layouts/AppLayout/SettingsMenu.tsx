import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Settings, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { IconButton } from '@/components/ui/IconButton';

const ITEM =
  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none select-none data-highlighted:bg-surface';

/** Configuración rápida del sistema. */
export function SettingsMenu() {
  const navigate = useNavigate();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton label="Configuración" icon={<Settings className="size-[18px]" />} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-72 origin-(--radix-dropdown-menu-content-transform-origin) rounded-2xl border border-line bg-white p-1.5 shadow-popover data-[state=closed]:animate-popover-out data-[state=open]:animate-popover-in"
        >
          <DropdownMenu.Item
            onSelect={() => {
              void navigate('/sistema/parametros');
            }}
            className={ITEM}
          >
            <Settings2 className="size-4 text-ink-subtle" aria-hidden />
            Parámetros del sistema
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
