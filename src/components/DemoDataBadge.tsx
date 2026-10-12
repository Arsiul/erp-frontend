import { Info } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';

/** Aviso visible de que la pantalla muestra datos ficticios. */
export function DemoDataBadge() {
  return (
    <Tooltip content="Se reemplazarán por datos reales al conectar la API (Fase 6)" side="bottom">
      <span tabIndex={0} className="rounded-md">
        <Badge tone="warning">
          <Info className="size-3.5" aria-hidden />
          Datos de demostración
        </Badge>
      </span>
    </Tooltip>
  );
}
