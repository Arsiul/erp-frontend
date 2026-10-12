import type { Column } from '@/components/data-table/types';
import type { ResourceValues } from '@/services/resources.service';
import type { ResourceKey, ResourceMap } from '@/types/resources';

/** Campo editable de un formulario. La clave debe existir en el registro (el tipo lo garantiza). */
interface FormFieldBase<T> {
  key: Exclude<keyof T, 'id'> & string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Ocupa las dos columnas del formulario. */
  fullWidth?: boolean;
}

export type FormField<T> = FormFieldBase<T> &
  (
    | {
        type: 'text' | 'email' | 'tel' | 'textarea';
        pattern?: { regex: RegExp; message: string };
      }
    | { type: 'number' | 'money'; min?: number }
    | { type: 'select'; options: readonly { value: string; label: string }[] }
  );

/** Cambio de estado de negocio sobre un registro (aprobar, anular, confirmar...). */
export interface StatusAction<T> {
  id: string;
  label: string;
  tone?: 'default' | 'danger';
  /** Solo se ofrece cuando el registro está en un estado que lo permite. */
  when: (row: T) => boolean;
  patch: (row: T) => Partial<Omit<T, 'id'>>;
  confirm?: { title: string; description: (row: T) => string; confirmLabel: string };
  /** Mensaje tras aplicarla. */
  success: (row: T) => string;
}

/** Cómo se nombra el registro en botones y mensajes ("Nuevo cliente", "Cotización eliminada"). */
export interface EntityName {
  singular: string;
  gender: 'm' | 'f';
}

/** Cómo se muestra y se gestiona el listado de un recurso. */
export interface ListDefinition<K extends ResourceKey> {
  entity: EntityName;
  columns: readonly Column<ResourceMap[K]>[];
  /** Textos de la fila en los que busca el filtro rápido. */
  searchFields: (row: ResourceMap[K]) => readonly string[];
  searchPlaceholder: string;
  /** Título del registro en el detalle y en las confirmaciones. */
  rowTitle: (row: ResourceMap[K]) => string;
  /** Campos editables. Sin formulario no se puede crear ni editar. */
  form?: readonly FormField<ResourceMap[K]>[];
  /** Valores de un registro nuevo. Si no se define, la pantalla no permite crear. */
  createDefaults?: () => ResourceValues<K>;
  canEdit?: (row: ResourceMap[K]) => boolean;
  canDelete?: (row: ResourceMap[K]) => boolean;
  statusActions?: readonly StatusAction<ResourceMap[K]>[];
}

/** Definiciones de un subconjunto de recursos (las de un grupo del menú). */
export type ListDefinitionsFor<K extends ResourceKey> = { [P in K]: ListDefinition<P> };

export type ListDefinitions = ListDefinitionsFor<ResourceKey>;
