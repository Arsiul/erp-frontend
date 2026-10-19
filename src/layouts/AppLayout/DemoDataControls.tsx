import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseBackup, Eraser } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { demoDataService } from '@/services/demo-data.service';
import type { DatasetState } from '@/services/mocks/mock-db';
import { queryKeys } from '@/services/query-keys';

type DataAction = 'load' | 'clear';

function confirmCopy(action: DataAction, state: DatasetState | undefined) {
  if (action === 'clear') {
    return {
      title: '¿Limpiar todos los datos?',
      description:
        'Se eliminarán clientes, productos, ventas, compras, finanzas y documentos de este navegador. Quedan los usuarios y la configuración, para empezar desde cero.',
      confirmLabel: 'Limpiar datos',
      tone: 'danger' as const,
    };
  }
  return {
    title: '¿Cargar los datos simulados?',
    description:
      state === 'empty'
        ? 'Se cargarán los datos de ejemplo de la distribuidora.'
        : 'Se descartarán tus cambios y se cargarán de nuevo los datos de ejemplo de la distribuidora.',
    confirmLabel: 'Cargar datos',
    tone: 'default' as const,
  };
}

/** Botones para pasar de los datos de ejemplo a un sistema en blanco y volver (mientras no hay backend). */
export function DemoDataControls() {
  const queryClient = useQueryClient();
  const { data: state } = useQuery({
    queryKey: queryKeys.datasetState,
    queryFn: () => demoDataService.state(),
  });
  const [pending, setPending] = useState<DataAction>('load');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function ask(action: DataAction) {
    setPending(action);
    setIsConfirmOpen(true);
  }

  async function run() {
    if (pending === 'clear') await demoDataService.clearAll();
    else await demoDataService.restore();
    // Todas las pantallas vuelven a leer sus datos.
    await queryClient.invalidateQueries();
    toast.success(
      pending === 'clear'
        ? 'Datos limpiados: el sistema quedó en blanco.'
        : 'Se cargaron los datos simulados.',
    );
  }

  const buttons = [
    {
      action: 'load' as const,
      label: 'Cargar datos simulados',
      hint: 'Ya tienes los datos simulados sin cambios.',
      icon: <DatabaseBackup className="size-4" aria-hidden />,
      disabled: state === 'demo',
      className: '',
    },
    {
      action: 'clear' as const,
      label: 'Limpiar datos',
      hint: 'El sistema ya está en blanco.',
      icon: <Eraser className="size-4" aria-hidden />,
      disabled: state === 'empty',
      className: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
    },
  ];

  return (
    <>
      <div className="flex items-center gap-1">
        {buttons.map((button) => (
          <Tooltip
            key={button.action}
            content={button.disabled ? button.hint : button.label}
            side="bottom"
          >
            {/* Envoltura: un botón deshabilitado no recibe el puntero y no mostraría la ayuda. */}
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                aria-label={button.label}
                disabled={button.disabled}
                onClick={() => {
                  ask(button.action);
                }}
                className={button.className}
              >
                {button.icon}
                <span className="hidden xl:inline">{button.label}</span>
              </Button>
            </span>
          </Tooltip>
        ))}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        {...confirmCopy(pending, state)}
        onConfirm={run}
      />
    </>
  );
}
