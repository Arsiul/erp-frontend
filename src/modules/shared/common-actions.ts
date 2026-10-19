import { Paperclip } from 'lucide-react';

import type { ActiveStatus } from '@/types/maestros';

import type { FlowAction, ProcessAction } from './list-definition';

/** Activar y desactivar: los registros inactivos se conservan, pero no se ofrecen en operaciones nuevas. */
export function activeStatusActions<T extends { status: ActiveStatus }>(
  title: (row: T) => string,
): ProcessAction<T>[] {
  return [
    {
      id: 'activate',
      label: 'Activar',
      when: (row) => row.status === 'inactive',
      success: (row) => `${title(row)} está activo de nuevo.`,
    },
    {
      id: 'deactivate',
      label: 'Desactivar',
      tone: 'danger',
      when: (row) => row.status === 'active',
      confirm: {
        title: 'Desactivar registro',
        description: (row) =>
          `${title(row)} dejará de ofrecerse en operaciones nuevas. Su historial se conserva.`,
        confirmLabel: 'Desactivar',
      },
      success: (row) => `${title(row)} quedó inactivo.`,
    },
  ];
}

/** Abre Documentos con el registro ya vinculado. */
export function attachDocumentFlow<T>(): FlowAction<T> {
  return { id: 'attach', label: 'Adjuntar documento', target: 'documentos', icon: Paperclip };
}
