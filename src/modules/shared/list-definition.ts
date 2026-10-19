import type { LucideIcon } from 'lucide-react';

import type { Column } from '@/components/data-table/types';
import type { ResourceValues } from '@/services/resources.service';
import type { ResourceKey, ResourceMap } from '@/types/resources';

/** Valores del formulario mientras se editan (aún sin validar). */
export type FieldValues = Record<string, unknown>;

export interface SelectOption {
  value: string;
  label: string;
}

/** Lista desplegable que se llena con registros de otro recurso (clientes, almacenes…). */
export type LookupSource = {
  [R in ResourceKey]: {
    resource: R;
    /** Texto de cada opción; por defecto, el título del registro en su listado. */
    label?: (row: ResourceMap[R]) => string;
    /** Valor guardado; por defecto, el id. */
    value?: (row: ResourceMap[R]) => string;
    /** Qué registros se ofrecen (ej.: solo los activos, solo los del cliente elegido). */
    filter?: (row: ResourceMap[R], values: FieldValues) => boolean;
  };
}[ResourceKey];

/** Línea que se puede copiar de un documento de origen (cotización, comprobante, orden…). */
export interface SourceLine {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  /** Lo máximo que se puede tomar (pendiente de recibir, disponible para nota de crédito…). */
  max: number;
  unitPrice: number;
}

/** De dónde salen las líneas cuando el documento nace de otro. */
export type LinesSource = {
  [R in ResourceKey]: {
    /** Campo del formulario que guarda el id del documento de origen. */
    field: string;
    resource: R;
    lines: (record: ResourceMap[R]) => SourceLine[];
  };
}[ResourceKey];

interface FormFieldBase<T> {
  key: Exclude<keyof T, 'id'> & string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Ocupa las dos columnas del formulario. */
  fullWidth?: boolean;
  /** Solo al registrar o solo al editar. */
  only?: 'create' | 'edit';
  readOnly?: boolean | ((values: FieldValues) => boolean);
  /** Se oculta (y no se envía) cuando devuelve falso. */
  visible?: (values: FieldValues) => boolean;
}

export type FormField<T> = FormFieldBase<T> &
  (
    | {
        type: 'text' | 'email' | 'tel' | 'textarea';
        pattern?: { regex: RegExp; message: string };
      }
    | { type: 'number' | 'money'; min?: number }
    | { type: 'date' }
    | {
        type: 'select';
        options?: readonly SelectOption[];
        optionsFrom?: LookupSource | ((values: FieldValues) => LookupSource | undefined);
      }
    | {
        type: 'lines';
        /** Precio que se propone al agregar un producto. */
        price: 'sale' | 'cost';
        /** Con origen solo se ajustan cantidades; sin origen se agregan productos activos. */
        source?: LinesSource;
        /** Muestra subtotal, IGV y total. */
        totals?: boolean;
      }
    | { type: 'file' }
    | { type: 'permissions' }
  );

/** Proceso de negocio sobre un registro (enviar, aprobar, anular…). Lo ejecuta el servicio. */
export interface ProcessAction<T> {
  /** Debe coincidir con una acción del servicio; si el rol no puede ejecutarla, no se muestra. */
  id: string;
  label: string;
  tone?: 'default' | 'danger';
  /** Solo se ofrece cuando el registro está en un estado que lo permite. */
  when: (row: T) => boolean;
  confirm?: { title: string; description: (row: T) => string; confirmLabel: string };
  success: (row: T) => string;
}

/** Paso siguiente del ciclo: abre otro módulo con este registro ya cargado. */
export interface FlowAction<T> {
  id: string;
  label: string;
  target: ResourceKey;
  icon?: LucideIcon;
  when?: (row: T) => boolean;
  /** Si se define, abre el listado destino filtrado por este texto en vez de un formulario nuevo. */
  search?: (row: T) => string;
  /**
   * Abre el formulario destino sobre la pantalla actual en vez de navegar: para cerrar el ciclo
   * (cobro, pago) sin salir del grupo.
   */
  inline?: boolean;
}

/** Cómo se nombra el registro en botones y mensajes. */
export interface EntityName {
  singular: string;
  plural: string;
  /** Botón de alta: "Nuevo cliente", "Registrar cobro"… */
  newLabel: string;
}

type Prefill<K extends ResourceKey> = {
  [S in ResourceKey]?: (source: ResourceMap[S]) => ResourceValues<K>;
};

/** Cómo se muestra y se gestiona el listado de un recurso. */
export interface ListDefinition<K extends ResourceKey> {
  entity: EntityName;
  columns: readonly Column<ResourceMap[K]>[];
  /** Textos de la fila en los que busca el filtro rápido. */
  searchFields: (row: ResourceMap[K]) => readonly string[];
  searchPlaceholder: string;
  /** Título del registro en el detalle, las opciones de otros formularios y los mensajes. */
  rowTitle: (row: ResourceMap[K]) => string;
  /** Campos del formulario. Sin formulario no se registra ni edita desde la pantalla. */
  form?: readonly FormField<ResourceMap[K]>[];
  /** Valores iniciales de un registro nuevo. */
  createDefaults?: () => ResourceValues<K>;
  /** Valores que llegan desde otro módulo (?from=recurso:id). */
  prefill?: Prefill<K>;
  processActions?: readonly ProcessAction<ResourceMap[K]>[];
  flowActions?: readonly FlowAction<ResourceMap[K]>[];
  /** Cuándo se puede editar o eliminar (además de lo que permita el rol). */
  editWhen?: (row: ResourceMap[K]) => boolean;
  removeWhen?: (row: ResourceMap[K]) => boolean;
}

/** Definiciones de un subconjunto de recursos (las de un grupo del menú). */
export type ListDefinitionsFor<K extends ResourceKey> = { [P in K]: ListDefinition<P> };

export type ListDefinitions = ListDefinitionsFor<ResourceKey>;
