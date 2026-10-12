import * as RadixTooltip from '@radix-ui/react-tooltip';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';

export interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/** Proveedores globales. Se separan del router para poder reutilizarlos en las pruebas. */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Respeta "reducir movimiento" del sistema operativo en todas las animaciones. */}
      <MotionConfig reducedMotion="user">
        <RadixTooltip.Provider delayDuration={300} skipDelayDuration={150}>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{ className: 'font-sans' }}
          />
        </RadixTooltip.Provider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
