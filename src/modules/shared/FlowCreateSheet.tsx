import { toast } from 'sonner';

import { LIST_DEFINITIONS } from '@/modules/list-registry';
import type { ResourceValues } from '@/services/resources.service';
import type { ResourceKey } from '@/types/resources';

import { createValues } from './create-values';
import type { FieldValues } from './list-definition';
import { RecordFormSheet } from './RecordFormSheet';
import { useResourceMutations } from './useResourceMutations';

export interface FlowCreateSheetProps<K extends ResourceKey> {
  target: K;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: FieldValues;
  description: string;
}

/**
 * Alta de otro módulo abierta sobre la pantalla actual (ej.: registrar el cobro desde la cuenta por
 * cobrar), para cerrar el ciclo sin salir del grupo.
 */
export function FlowCreateSheet<K extends ResourceKey>({
  target,
  open,
  onOpenChange,
  initialValues,
  description,
}: FlowCreateSheetProps<K>) {
  const definition = LIST_DEFINITIONS[target];
  const { create } = useResourceMutations(target);
  if (!definition.form) return null;

  async function submit(values: FieldValues) {
    const created = await create.mutateAsync(
      createValues(definition.form, initialValues, values) as ResourceValues<K>,
    );
    toast.success(`Registro creado: ${definition.rowTitle(created)}`);
  }

  return (
    <RecordFormSheet
      open={open}
      onOpenChange={onOpenChange}
      mode="create"
      title={definition.entity.newLabel}
      description={description}
      submitLabel="Registrar"
      fields={definition.form}
      initialValues={initialValues}
      onSubmit={submit}
    />
  );
}
