import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { type CSSProperties } from 'react';

import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';

import { Brand } from './Brand';
import { DemoDataControls } from './DemoDataControls';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { QuickCreateMenu } from './QuickCreateMenu';
import { SettingsMenu } from './SettingsMenu';
import { UserBlock } from './UserBlock';

export interface HeaderProps {
  /** Ancho de la barra lateral en escritorio; el bloque de marca lo acompaña. */
  sidebarWidth: number;
  isPanelOpen: boolean;
  canTogglePanel: boolean;
  onTogglePanel: () => void;
  onOpenMobileNav: () => void;
}

export function Header({
  sidebarWidth,
  isPanelOpen,
  canTogglePanel,
  onTogglePanel,
  onOpenMobileNav,
}: HeaderProps) {
  const isSidebarCompact = !(canTogglePanel && isPanelOpen);

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center border-b border-line bg-white">
      <div
        style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}
        className="flex h-full items-center gap-2 pl-3 lg:w-(--sidebar-width) lg:border-r lg:border-line lg:pl-0 lg:transition-[width] lg:duration-300 lg:ease-out-soft"
      >
        <IconButton
          label="Abrir menú"
          icon={<Menu className="size-5" />}
          onClick={onOpenMobileNav}
          className="lg:hidden"
        />
        <Brand compact={isSidebarCompact} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-5">
        {canTogglePanel && (
          <Tooltip content={isPanelOpen ? 'Contraer menú' : 'Expandir menú'} side="bottom">
            <IconButton
              label={isPanelOpen ? 'Contraer menú lateral' : 'Expandir menú lateral'}
              icon={
                isPanelOpen ? (
                  <PanelLeftClose className="size-[18px]" />
                ) : (
                  <PanelLeftOpen className="size-[18px]" />
                )
              }
              aria-expanded={isPanelOpen}
              onClick={onTogglePanel}
              className="hidden lg:inline-flex"
            />
          </Tooltip>
        )}

        <div className="hidden min-w-0 md:block lg:ml-2">
          <UserBlock />
        </div>
        <NotificationsMenu />

        <div className="ml-auto flex items-center gap-3">
          <DemoDataControls />
          <QuickCreateMenu />
          <div className="hidden w-64 md:block lg:w-72">
            <GlobalSearch />
          </div>
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
