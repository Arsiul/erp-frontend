import { useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Download, Info, Plus, Search, SearchX } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSession } from '@/hooks/useSession';
import { isListResource, LIST_DEFINITIONS } from '@/modules/list-registry';
import { queryKeys } from '@/services/query-keys';
import { resourcesService, type ResourceValues } from '@/services/resources.service';
import type { NavGroup, NavItem } from '@/types/navigation';
import type { ResourceKey, ResourceMap } from '@/types/resources';
import { downloadCsv, toCsv } from '@/utils/csv';
import { todayIso } from '@/utils/dates';
import { findNavMatchByResource, getGroupEntryPath } from '@/utils/navigation';
import { matchesSearch } from '@/utils/text';

import { createValues } from './create-values';
import { FlowCreateSheet } from './FlowCreateSheet';
import type { FieldValues, FlowAction, ProcessAction } from './list-definition';
import { recordActions, roleCapabilities } from './record-actions';
import { RecordDetailSheet } from './RecordDetailSheet';
import { RecordFormSheet } from './RecordFormSheet';
import { RowActionsMenu } from './RowActionsMenu';
import { useResourceList } from './useResourceList';
import { useResourceMutations } from './useResourceMutations';
import { useUnseenRecords } from './useUnseenRecords';

type FormState =
  | { mode: 'create'; initialValues: FieldValues; description?: string }
  | { mode: 'edit'; id: string };

/** Alta de otro módulo abierta aquí mismo por un paso siguiente `inline`. */
interface InlineFlowState {
  target: ResourceKey;
  initialValues: FieldValues;
  description: string;
}

type ConfirmState<T> =
  { type: 'remove'; id: string } | { type: 'process'; id: string; action: ProcessAction<T> };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

/** Título de un registro de cualquier recurso (el origen de una precarga). */
function titleOf(resource: ResourceKey, row: unknown): string {
  const definition = LIST_DEFINITIONS[resource] as unknown as {
    rowTitle: (row: unknown) => string;
  };
  return definition.rowTitle(row);
}

/** `?from=ventas:abc` → `{ resource: 'ventas', id: 'abc' }`. */
function parseSource(value: string): { resource: ResourceKey; id: string } | undefined {
  const separator = value.indexOf(':');
  if (separator <= 0) return undefined;
  const resource = value.slice(0, separator);
  const id = value.slice(separator + 1);
  return isListResource(resource) && id ? { resource, id } : undefined;
}

export interface ResourceListPageProps<K extends ResourceKey> {
  resource: K;
  group: NavGroup;
  item: NavItem;
}

/**
 * Pantalla de un submódulo: listado con búsqueda y exportación, detalle, alta, edición, procesos
 * (aprobar, anular…) y el paso siguiente del ciclo, que abre otro módulo con el registro ya cargado.
 *
 * Parámetros de la URL: `?from=recurso:id` abre el alta precargada desde ese registro, `?q=` filtra
 * el listado y `?new=1` abre el alta vacía.
 */
export function ResourceListPage<K extends ResourceKey>({
  resource,
  group,
  item,
}: ResourceListPageProps<K>) {
  type Row = ResourceMap[K];

  const definition = LIST_DEFINITIONS[resource];
  const { entity } = definition;
  const { can } = useSession();
  const capabilities = roleCapabilities(resource, can);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, isPending, isError, refetch, isRefetching } = useResourceList(resource);
  const { create, update, remove, runAction } = useResourceMutations(resource);
  const { isNew, markSeen } = useUnseenRecords(resource);

  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  // Cada panel guarda su estado aparte de "abierto" para que la animación de cierre muestre su contenido.
  const [detailId, setDetailId] = useState<string>();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [confirmState, setConfirmState] = useState<ConfirmState<Row>>();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [inlineFlow, setInlineFlow] = useState<InlineFlowState>();
  const [isInlineFlowOpen, setIsInlineFlowOpen] = useState(false);
  const [inlineSession, setInlineSession] = useState(0);

  // Lo recién registrado va arriba hasta que se abre; el resto conserva su orden.
  const rows = (data ?? [])
    .filter((row) => matchesSearch(definition.searchFields(row), query))
    .toSorted((a, b) => Number(isNew(b.id)) - Number(isNew(a.id)));
  const findRow = (id: string | undefined) => data?.find((row) => row.id === id);
  const total = data?.length ?? 0;
  const { form, createDefaults } = definition;
  const canCreate = Boolean(entity.newLabel && form && createDefaults && capabilities.create);

  const detailRow = findRow(detailId);
  const formRow = formState?.mode === 'edit' ? findRow(formState.id) : undefined;
  const confirmRow = findRow(confirmState?.id);
  const actionsOf = (row: Row) => recordActions(definition, capabilities, row, can);

  function openDetail(row: Row) {
    setDetailId(row.id);
    setIsDetailOpen(true);
    markSeen(row.id);
  }

  function openForm(state: FormState) {
    setFormState(state);
    setFormSession((session) => session + 1);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  }

  function openCreate(prefilled: FieldValues = {}, description?: string) {
    openForm({
      mode: 'create',
      initialValues: { ...createDefaults?.(), ...prefilled },
      description,
    });
  }

  async function openCreateFrom(from: string) {
    const source = parseSource(from);
    if (!source) {
      toast.error('El enlace de origen no es válido.');
      return;
    }
    try {
      const record = await queryClient.query({
        queryKey: queryKeys.resourceRecord(source.resource, source.id),
        queryFn: () => resourcesService.get(source.resource, source.id),
      });
      if (!record) {
        toast.error('El registro de origen ya no existe.');
        return;
      }
      const prefill = definition.prefill?.[source.resource] as
        ((record: unknown) => FieldValues) | undefined;
      openCreate(prefill?.(record) ?? {}, `Desde ${titleOf(source.resource, record)}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  // Lee los parámetros con los que llegó la pantalla y los quita, para que recargar no repita el alta.
  const consumeParams = useEffectEvent((params: URLSearchParams) => {
    const q = params.get('q');
    const from = params.get('from');
    const isNew = params.get('new') === '1';
    if (q === null && from === null && !isNew) return;

    if (q !== null) setQuery(q);
    if (from !== null || isNew) {
      if (!canCreate) toast.error(`Tu rol no puede registrar ${entity.plural}.`);
      else if (from !== null) void openCreateFrom(from);
      else openCreate();
    }
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('q');
        next.delete('from');
        next.delete('new');
        return next;
      },
      { replace: true },
    );
  });

  useEffect(() => {
    // Los parámetros vienen de otra pantalla (buscador, paso siguiente): se aplican una vez y se quitan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    consumeParams(searchParams);
  }, [searchParams]);

  function askConfirm(state: ConfirmState<Row>) {
    setConfirmState(state);
    setIsConfirmOpen(true);
  }

  async function runProcess(row: Row, action: ProcessAction<Row>) {
    try {
      const updated = await runAction.mutateAsync({ id: row.id, actionId: action.id });
      toast.success(action.success(updated));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function requestProcess(row: Row, action: ProcessAction<Row>) {
    if (action.confirm) askConfirm({ type: 'process', id: row.id, action });
    else void runProcess(row, action);
  }

  function openInlineFlow(row: Row, action: FlowAction<Row>) {
    const target = LIST_DEFINITIONS[action.target];
    const prefill = target.prefill?.[resource] as ((record: unknown) => FieldValues) | undefined;
    setInlineFlow({
      target: action.target,
      initialValues: { ...target.createDefaults?.(), ...prefill?.(row) },
      description: `Desde ${definition.rowTitle(row)}`,
    });
    setInlineSession((session) => session + 1);
    setIsDetailOpen(false);
    setIsInlineFlowOpen(true);
  }

  function goToFlow(row: Row, action: FlowAction<Row>) {
    if (action.inline && !action.search) {
      openInlineFlow(row, action);
      return;
    }
    const match = findNavMatchByResource(action.target);
    if (!match) {
      toast.error('Ese módulo no está disponible.');
      return;
    }
    const params = new URLSearchParams(
      action.search ? { q: action.search(row) } : { from: `${resource}:${row.id}` },
    );
    setIsDetailOpen(false);
    void navigate(`${match.item.path}?${params.toString()}`);
  }

  async function confirmPending() {
    if (!confirmState || !confirmRow) return;
    if (confirmState.type === 'process') {
      await runProcess(confirmRow, confirmState.action);
      return;
    }
    const title = definition.rowTitle(confirmRow);
    try {
      await remove.mutateAsync(confirmRow.id);
      if (detailId === confirmRow.id) setIsDetailOpen(false);
      toast.success(`Se eliminó ${title}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  // Los errores los muestra el formulario, que sigue abierto para corregirlos.
  async function submitForm(values: FieldValues) {
    if (!formState) return;
    if (formState.mode === 'edit') {
      const updated = await update.mutateAsync({
        id: formState.id,
        values: values as ResourceValues<K>,
      });
      toast.success(`Cambios guardados en ${definition.rowTitle(updated)}`);
      return;
    }
    const created = await create.mutateAsync(
      createValues(form, formState.initialValues, values) as ResourceValues<K>,
    );
    toast.success(`Registro creado: ${definition.rowTitle(created)}`);
  }

  function exportCsv() {
    downloadCsv(`${item.id}-${todayIso()}.csv`, toCsv(definition.columns, rows));
  }

  const confirmCopy = (() => {
    if (!confirmState || !confirmRow) return undefined;
    if (confirmState.type === 'remove') {
      return {
        title: `Eliminar ${entity.singular}`,
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

  const handlers = (row: Row) => ({
    onEdit: () => {
      openForm({ mode: 'edit', id: row.id });
    },
    onRemove: () => {
      askConfirm({ type: 'remove', id: row.id });
    },
    onProcess: (action: ProcessAction<Row>) => {
      requestProcess(row, action);
    },
    onFlow: (action: FlowAction<Row>) => {
      goToFlow(row, action);
    },
  });

  const createButton = canCreate && (
    <Button
      disabled={isPending || isError}
      onClick={() => {
        openCreate();
      }}
    >
      <Plus className="size-4" aria-hidden />
      {entity.newLabel}
    </Button>
  );

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
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            {!isPending && !isError && (
              <p className="text-xs font-medium text-ink-subtle" aria-live="polite">
                {query.trim()
                  ? `${String(rows.length)} de ${String(total)} registros`
                  : `${String(total)} ${total === 1 ? 'registro' : 'registros'}`}
              </p>
            )}
            <Button variant="soft" disabled={rows.length === 0} onClick={exportCsv}>
              <Download className="size-4" aria-hidden />
              Exportar
            </Button>
            {createButton}
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
            isNew={(row) => isNew(row.id)}
            renderRowActions={(row) => (
              <RowActionsMenu
                title={definition.rowTitle(row)}
                actions={actionsOf(row)}
                onView={() => {
                  openDetail(row);
                }}
                {...handlers(row)}
              />
            )}
          />
        )}

        {data && rows.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={query.trim() ? 'Sin resultados' : `Aún no hay ${entity.plural}`}
            description={
              query.trim()
                ? `Nada coincide con “${query.trim()}”.`
                : canCreate
                  ? `Usa “${entity.newLabel}” para empezar.`
                  : 'Cuando se registren, aparecerán aquí.'
            }
            className="border-t border-line"
            action={
              query.trim() ? (
                <Button
                  variant="soft"
                  onClick={() => {
                    setQuery('');
                  }}
                >
                  Limpiar búsqueda
                </Button>
              ) : (
                createButton || undefined
              )
            }
          />
        )}

        <footer className="flex items-start gap-2 border-t border-line bg-surface/60 px-5 py-3 text-xs text-ink-subtle">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>Los cambios se guardan solo en este navegador (datos de demostración).</p>
        </footer>
      </Card>

      <RecordDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        title={detailRow ? definition.rowTitle(detailRow) : item.label}
        entityLabel={entity.singular}
        row={detailRow}
        columns={definition.columns}
        actions={detailRow ? actionsOf(detailRow) : undefined}
        {...(detailRow
          ? handlers(detailRow)
          : { onEdit: noop, onRemove: noop, onProcess: noop, onFlow: noop })}
      />

      {form && formState && (
        <RecordFormSheet
          key={formSession}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          mode={formState.mode}
          title={formState.mode === 'edit' ? `Editar ${entity.singular}` : entity.newLabel}
          description={formState.mode === 'create' ? formState.description : undefined}
          submitLabel={formState.mode === 'edit' ? 'Guardar cambios' : 'Registrar'}
          fields={form}
          initialValues={formState.mode === 'edit' ? { ...formRow } : formState.initialValues}
          onSubmit={submitForm}
        />
      )}

      {inlineFlow && (
        <FlowCreateSheet
          key={inlineSession}
          target={inlineFlow.target}
          open={isInlineFlowOpen}
          onOpenChange={setIsInlineFlowOpen}
          initialValues={inlineFlow.initialValues}
          description={inlineFlow.description}
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

function noop() {
  // Sin registro abierto no hay nada que hacer.
}
