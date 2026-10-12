import { MapPinOff } from 'lucide-react';
import { Link } from 'react-router';

import { buttonClassName } from '@/components/ui/button-styles';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <Card className="mx-auto mt-8 max-w-xl">
      <EmptyState
        icon={MapPinOff}
        title="Página no encontrada"
        description="La dirección no corresponde a ninguna pantalla del ERP. Revisa el enlace o vuelve al inicio."
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
