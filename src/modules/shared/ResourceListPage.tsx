import { CircleAlert, Info, Plus, Search, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/DataTable';
import { DemoDataBadge } from '@/components/DemoDataBadge';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BUILD_STEPS_TOTAL } from '@/config/navigation';
import { LIST_DEFINITIONS } from '@/modules/list-registry';
import type { NavGroup, NavItem } from '@/types/navigation';
import type { ResourceKey, ResourceMap } from '@/types/resources';
import { getGroupEntryPath } from '@/utils/navigation';
import { matchesSearch } from '@/utils/text';

import { entityText } from './entity-text';
import type { StatusAction } from './list-definition';
import { getCapabilities } from './record-actions';
import { RecordDetailSheet } from './RecordDetailSheet';
import { RecordFormSheet } from './RecordFormSheet';
import { RowActionsMenu } from './RowActionsMenu';
import { useResourceList } from './useResourceList';
import { useResourceMutations } from './useResourceMutations';

type FormState = { mode: 'create' } | { mode: 'edit'; id: string };

type ConfirmState<T> =
  { type: 'delete'; id: string } | { type: 'status'; id: string; action: StatusAction<T> };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

export interface ResourceListPageProps<K extends ResourceKey> {
  resource: K;
  group: NavGroup;
  item: NavItem;
}

/** Pantalla de un submódulo: listado con búsqueda, detalle, alta, edición y acciones de estado. */
export function ResourceListPage<K extends ResourceKey>({
  resource,
  group,
  item,
}: ResourceListPageProps<K>) {
  type Row = ResourceMap[K];

  const definition = LIST_DEFINITIONS[resource];
  const text = entityText(definition.entity);
  const { data, isPending, isError, refetch, isRefetching } = useResourceList(resource);
  const { create, update, remove } = useResourceMutations(resource);

  const [query, setQuery] = useState('');
  // Cada panel guarda su estado aparte de "abierto" para que la animación de cierre muestre su contenido.
  const [detailId, setDetailId] = useState<string>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [confirmState, setConfirmState] = useState<ConfirmState<Row>>();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const rows = useMemo(
    () => (data ?? []).filter((row) => matchesSearch(definition.searchFields(row), query)),
    [data, query, definition],
  );
  const findRow = (id: string | undefined) => data?.find((row) => row.id === id);
  const total = data?.length ?? 0;
  const canCreate = Boolean(definition.form && definition.createDefaults);

  const detailRow = findRow(detailId);
  const formRow = formState?.mode === 'edit' ? findRow(formState.id) : undefined;
  const confirmRow = findRow(confirmState?.id);

  function openDetail(row: Row) {
    setDetailId(row.id);
    setIsDetailOpen(true);
  }

  function openForm(state: FormState) {
    setFormState(state);
    setFormSession((session) => session + 1);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  }

  function askConfirm(state: ConfirmState<Row>) {
    setConfirmState(state);
    setIsConfirmOpen(true);
  }

  async function applyStatusAction(row: Row, action: StatusAction<Row>) {
    try {
      await update.mutateAsync({ id: row.id, patch: action.patch(row) });
      toast.success(action.success(row));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function requestStatusAction(row: Row, action: StatusAction<Row>) {
    if (action.confirm) askConfirm({ type: 'status', id: row.id, action });
    else void applyStatusAction(row, action);
  }

  async function confirmPending() {
    if (!confirmState || !confirmRow) return;
    if (confirmState.type === 'status') {
      await applyStatusAction(confirmRow, confirmState.action);
      return;
    }
    try {
      await remove.mutateAsync(confirmRow.id);
      if (detailId === confirmRow.id) setIsDetailOpen(false);
      toast.success(text.deleted);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function submitForm(values: Partial<Omit<Row, 'id'>>) {
    try {
      if (formState?.mode === 'edit') {
        await update.mutateAsync({ id: formState.id, patch: values });
        toast.success(text.updated);
      } else if (definition.createDefaults) {
        await create.mutateAsync({ ...definition.createDefaults(), ...values });
        toast.success(text.created);
      }
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  }

  const confirmCopy = (() => {
    if (!confirmState || !confirmRow) return undefined;
    if (confirmState.type === 'delete') {
      return {
        title: text.deleteTitle,
        description: `“${definition.rowTitle(confirmRow)}” se eliminará. Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        tone: 'danger' as const,
      };
    }
    const { action } = confirmState;
    return {
      title: action.confirm?.title ?? action.label,
      description: action.confirm?.description(confirmRow) ?? '',
      confirmLabel: action.confirm?.confirmLabel ?? action.label,
      tone: action.tone ?? 'default',
    };
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.label}
        description={item.description}
        breadcrumbs={[
          { label: 'Inicio', to: '/' },
          { label: group.label, to: getGroupEntryPath(group) },
          { label: item.label },
        ]}
        actions={<DemoDataBadge />}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder={definition.searchPlaceholder}
              aria-label={`Buscar en ${item.label}`}
              disabled={isPending || isError}
              className="h-10 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-sm text-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-ink-subtle hover:border-primary-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
            />
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            {!isPending && !isError && (
              <p className="text-xs font-medium text-ink-subtle" aria-live="polite">
                {query.trim()
                  ? `${String(rows.length)} de ${String(total)} registros`
                  : `${String(total)} ${total === 1 ? 'registro' : 'registros'}`}
              </p>
            )}
            {canCreate && (
              <Button
                disabled={isPending || isError}
                onClick={() => {
                  openForm({ mode: 'create' });
                }}
              >
                <Plus className="size-4" aria-hidden />
                {text.newLabel}
              </Button>
            )}
          </div>
        </div>

        {isPending && (
          <div
            className="space-y-3 border-t border-line px-5 py-5"
            role="status"
            aria-label="Cargando registros"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={CircleAlert}
            title="No se pudieron cargar los registros"
            description="Revisa tu conexión e inténtalo de nuevo."
            className="border-t border-line"
            action={
              <Button
                disabled={isRefetching}
                onClick={() => {
                  void refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        )}

        {data && rows.length > 0 && (
          <DataTable
            columns={definition.columns}
            rows={rows}
            label={item.label}
            onRowClick={openDetail}
            renderRowActions={(row) => (
              <RowActionsMenu
                title={definition.rowTitle(row)}
                capabilities={getCapabilities(definition, row)}
                onView={() => {
                  openDetail(row);
                }}
                onEdit={() => {
                  openForm({ mode: 'edit', id: row.id });
                }}
                onDelete={() => {
                  askConfirm({ type: 'delete', id: row.id });
                }}
                onStatusAction={(action) => {
                  requestStatusAction(row, action);
                }}
              />
            )}
          />
        )}

        {data && rows.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={query.trim() ? 'Sin resultados' : 'Aún no hay registros'}
            description={
              query.trim()
                ? `Nada coincide con “${query.trim()}”.`
                : canCreate
                  ? `Crea ${definition.entity.gender === 'f' ? 'la primera' : 'el primer'} ${definition.entity.singular} para empezar.`
                  : 'Cuando se registren, aparecerán aquí.'
            }
            className="border-t border-line"
            action={
              !query.trim() && canCreate ? (
                <Button
                  onClick={() => {
                    openForm({ mode: 'create' });
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  {text.newLabel}
                </Button>
              ) : undefined
            }
          />
        )}

        <footer className="flex items-start gap-2 border-t border-line bg-surface/60 px-5 py-3 text-xs text-ink-subtle">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>
            Los cambios se guardan solo en este navegador (datos de demostración). La versión
            conectada a la base de datos llega en el paso {item.buildStep} de {BUILD_STEPS_TOTAL}{' '}
            del plan de construcción.
          </p>
        </footer>
      </Card>

      <RecordDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        title={detailRow ? definition.rowTitle(detailRow) : item.label}
        entityLabel={definition.entity.singular}
        row={detailRow}
        columns={definition.columns}
        capabilities={detailRow ? getCapabilities(definition, detailRow) : undefined}
        onEdit={() => {
          if (detailRow) openForm({ mode: 'edit', id: detailRow.id });
        }}
        onDelete={() => {
          if (detailRow) askConfirm({ type: 'delete', id: detailRow.id });
        }}
        onStatusAction={(action) => {
          if (detailRow) requestStatusAction(detailRow, action);
        }}
      />

      {definition.form && (
        <RecordFormSheet
          key={formSession}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={formState?.mode === 'edit' ? text.editLabel : text.newLabel}
          submitLabel={formState?.mode === 'edit' ? 'Guardar cambios' : 'Crear'}
          fields={definition.form}
          initialValues={formRow ?? definition.createDefaults?.() ?? {}}
          onSubmit={submitForm}
        />
      )}

      {confirmCopy && (
        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          tone={confirmCopy.tone}
          onConfirm={confirmPending}
        />
      )}
    </div>
  );
}
