import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router';

import { buttonClassName } from '@/components/ui/button-styles';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

/** Se muestra cuando el rol de la sesión no puede consultar el grupo de la ruta. */
export function NoAccessPage({ area }: { area: string }) {
  return (
    <Card className="mx-auto mt-8 max-w-xl">
      <EmptyState
        icon={ShieldOff}
        title="Sin acceso"
        description={`Tu rol no tiene permiso para consultar ${area}. Pide acceso a un administrador.`}
        action={
          <Link to="/" className={buttonClassName()}>
            Ir al inicio
          </Link>
        }
        className="py-14"
      />
    </Card>
  );
}
