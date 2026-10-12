import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { DatabaseBackup, Eraser, Settings, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { demoDataService } from '@/services/demo-data.service';

type PendingAction = 'clear' | 'restore';

const CONFIRM_COPY: Record<
  PendingAction,
  { title: string; description: string; confirmLabel: string; tone: 'default' | 'danger' }
> = {
  clear: {
    title: '¿Vaciar todos los datos?',
    description:
      'Se eliminarán clientes, productos, ventas, compras, finanzas, documentos y usuarios de este navegador. El sistema quedará en blanco, como recién instalado.',
    confirmLabel: 'Vaciar todo',
    tone: 'danger',
  },
  restore: {
    title: '¿Restaurar los datos de demostración?',
    description:
      'Se descartarán todos tus cambios y se cargarán de nuevo los datos de ejemplo de la distribuidora.',
    confirmLabel: 'Restaurar',
    tone: 'default',
  },
};

const ITEM =
  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none select-none data-highlighted:bg-surface';

/** Configuración rápida y control de los datos de demostración (mientras no exista backend). */
export function SettingsMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingAction>('clear');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function ask(action: PendingAction) {
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
        ? 'Se vaciaron todos los datos.'
        : 'Se restauraron los datos de demostración.',
    );
  }

  const copy = CONFIRM_COPY[pending];

  return (
    <>
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

            <DropdownMenu.Separator className="my-1.5 h-px bg-line" />
            <DropdownMenu.Label className="px-3 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-ink-subtle uppercase">
              Datos de demostración
            </DropdownMenu.Label>
            <DropdownMenu.Item
              onSelect={() => {
                ask('restore');
              }}
              className={ITEM}
            >
              <DatabaseBackup className="size-4 text-primary-500" aria-hidden />
              Restaurar datos de ejemplo
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => {
                ask('clear');
              }}
              className={`${ITEM} text-rose-600 data-highlighted:bg-rose-50`}
            >
              <Eraser className="size-4" aria-hidden />
              Vaciar todos los datos
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.confirmLabel}
        tone={copy.tone}
        onConfirm={run}
      />
    </>
  );
}
