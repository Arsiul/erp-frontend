import { ServerCrash } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

/** Último recurso ante un error no controlado en una ruta (incluye fallos al cargar código diferido). */
export function RouteErrorPage() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-6">
      <Card className="w-full max-w-lg">
        <EmptyState
          icon={ServerCrash}
          title="Algo salió mal"
          description="Ocurrió un error inesperado al mostrar esta pantalla. Recarga la página para intentarlo de nuevo."
          action={
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Recargar
            </Button>
          }
          className="py-12"
        />
        {import.meta.env.DEV && detail && (
          <pre className="mx-6 mb-6 overflow-x-auto rounded-xl bg-surface p-3 text-xs text-ink-muted">
            {detail}
          </pre>
        )}
      </Card>
    </div>
  );
}
