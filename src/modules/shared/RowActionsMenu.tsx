import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Eye, MoreHorizontal, Pencil, Trash2, Zap } from 'lucide-react';

import { cn } from '@/utils/cn';

import type { StatusAction } from './list-definition';
import type { RecordCapabilities } from './record-actions';

export interface RowActionsMenuProps<T> {
  title: string;
  capabilities: RecordCapabilities<T>;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusAction: (action: StatusAction<T>) => void;
}

const ITEM =
  'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none select-none data-highlighted:bg-surface';

/** Menú "⋯" de cada fila: ver, editar, cambios de estado y eliminar, según lo que permita el registro. */
export function RowActionsMenu<T>({
  title,
  capabilities,
  onView,
  onEdit,
  onDelete,
  onStatusAction,
}: RowActionsMenuProps<T>) {
  const { canEdit, canDelete, statusActions } = capabilities;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Acciones de ${title}`}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-ink-subtle transition-colors hover:border-line hover:bg-white hover:text-ink data-[state=open]:border-primary-200 data-[state=open]:bg-primary-50 data-[state=open]:text-primary-700"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-52 origin-(--radix-dropdown-menu-content-transform-origin) rounded-xl border border-line bg-white p-1.5 shadow-popover data-[state=closed]:animate-popover-out data-[state=open]:animate-popover-in"
        >
          <DropdownMenu.Item onSelect={onView} className={cn(ITEM, 'text-ink')}>
            <Eye className="size-4 text-ink-subtle" aria-hidden />
            Ver detalle
          </DropdownMenu.Item>
          {canEdit && (
            <DropdownMenu.Item onSelect={onEdit} className={cn(ITEM, 'text-ink')}>
              <Pencil className="size-4 text-ink-subtle" aria-hidden />
              Editar
            </DropdownMenu.Item>
          )}
          {statusActions.length > 0 && <DropdownMenu.Separator className="my-1 h-px bg-line" />}
          {statusActions.map((action) => (
            <DropdownMenu.Item
              key={action.id}
              onSelect={() => {
                onStatusAction(action);
              }}
              className={cn(ITEM, action.tone === 'danger' ? 'text-rose-600' : 'text-ink')}
            >
              <Zap
                className={cn(
                  'size-4',
                  action.tone === 'danger' ? 'text-rose-500' : 'text-primary-500',
                )}
                aria-hidden
              />
              {action.label}
            </DropdownMenu.Item>
          ))}
          {canDelete && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item
                onSelect={onDelete}
                className={cn(ITEM, 'text-rose-600 data-highlighted:bg-rose-50')}
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
