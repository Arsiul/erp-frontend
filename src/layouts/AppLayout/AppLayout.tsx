import { LayoutGroup, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';

import { EASE_OUT_SOFT } from '@/components/motion-presets';
import { isBoolean, useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/utils/cn';
import { findGroupByPath } from '@/utils/navigation';

import { ContextPanel } from './ContextPanel';
import { Header } from './Header';
import { IconRail } from './IconRail';
import { MobileNav } from './MobileNav';
import { NavigationProgress } from './NavigationProgress';

const RAIL_WIDTH = 72;
const PANEL_WIDTH = 256;
/** Debe coincidir con el breakpoint `lg` de Tailwind. */
const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';

export function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useLocalStorage('erp.sidebar.panel-open', true, isBoolean);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const activeGroup = findGroupByPath(pathname);
  const hasPanel = activeGroup !== undefined && activeGroup.sections.length > 0;
  const isPanelVisible = hasPanel && isPanelOpen;

  // El contenido tiene su propio scroll; al cambiar de pantalla vuelve arriba.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // Si la ventana crece hasta escritorio con el menú móvil abierto, se cierra (libera foco y scroll).
  useEffect(() => {
    const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) setIsMobileNavOpen(false);
    }
    desktopQuery.addEventListener('change', handleChange);
    return () => {
      desktopQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <a
        href="#contenido"
        className="sr-only z-[70] rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <NavigationProgress />

      <Header
        sidebarWidth={RAIL_WIDTH + (isPanelVisible ? PANEL_WIDTH : 0)}
        isPanelOpen={isPanelOpen}
        canTogglePanel={hasPanel}
        onTogglePanel={() => {
          setIsPanelOpen((open) => !open);
        }}
        onOpenMobileNav={() => {
          setIsMobileNavOpen(true);
        }}
      />

      <div className="flex min-h-0 flex-1">
        <LayoutGroup id="desktop-nav">
          <aside className="hidden lg:flex" aria-label="Navegación principal">
            <IconRail activeGroupId={activeGroup?.id} />
            <div
              inert={!isPanelVisible}
              style={{ width: isPanelVisible ? PANEL_WIDTH : 0 }}
              className={cn(
                'overflow-hidden transition-[width] duration-300 ease-out-soft',
                isPanelVisible && 'border-r border-line',
              )}
            >
              {hasPanel && <ContextPanel group={activeGroup} />}
            </div>
          </aside>
        </LayoutGroup>

        <main
          ref={mainRef}
          id="contenido"
          tabIndex={-1}
          className="min-w-0 flex-1 scrollbar-thin overflow-y-auto outline-none"
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_SOFT }}
            className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <MobileNav
        open={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        activeGroup={activeGroup}
      />
    </div>
  );
}
