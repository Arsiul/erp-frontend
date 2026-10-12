import { Cloud } from 'lucide-react';

import { APP_INFO } from '@/config/app';

/** Se muestra solo en la primera carga, mientras llega el código de la pantalla inicial. */
export function AppLoader() {
  return (
    <div
      role="status"
      aria-label={`Cargando ${APP_INFO.name}`}
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface"
    >
      <span className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-rail text-white">
        <Cloud className="size-6" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="text-sm font-semibold text-ink-muted">{APP_INFO.name}</span>
    </div>
  );
}
