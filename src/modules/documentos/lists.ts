import { ExternalLink } from 'lucide-react';

import type {
  FlowAction,
  ListDefinitionsFor,
  LookupSource,
} from '@/modules/shared/list-definition';
import { DOCUMENT_CATEGORY, optionsOf } from '@/modules/shared/status';
import type { DocumentCategory, StoredDocument } from '@/types/documentos';

/** Registros a los que se puede adjuntar un documento, con la categoría que se sugiere. */
const LINKABLE = {
  clientes: { label: 'Cliente', category: 'contract' },
  proveedores: { label: 'Proveedor', category: 'contract' },
  ventas: { label: 'Venta', category: 'other' },
  comprobantes: { label: 'Comprobante', category: 'invoice' },
  'ordenes-compra': { label: 'Orden de compra', category: 'order' },
  recepciones: { label: 'Recepción', category: 'guide' },
  'facturas-proveedor': { label: 'Factura de proveedor', category: 'invoice' },
} as const satisfies Record<string, { label: string; category: DocumentCategory }>;

export type LinkableResource = keyof typeof LINKABLE;

const LINKABLE_KEYS = Object.keys(LINKABLE) as LinkableResource[];

export function isLinkableResource(value: unknown): value is LinkableResource {
  return typeof value === 'string' && value in LINKABLE;
}

const LINKED_LOOKUP: Record<LinkableResource, LookupSource> = {
  clientes: { resource: 'clientes' },
  proveedores: { resource: 'proveedores' },
  ventas: { resource: 'ventas' },
  comprobantes: { resource: 'comprobantes' },
  'ordenes-compra': { resource: 'ordenes-compra' },
  recepciones: { resource: 'recepciones' },
  'facturas-proveedor': { resource: 'facturas-proveedor' },
};

function link(resource: LinkableResource) {
  return (source: { id: string }) => ({
    linkedResource: resource,
    linkedId: source.id,
    category: LINKABLE[resource].category,
  });
}

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
}

const LINKED_FLOWS: FlowAction<StoredDocument>[] = LINKABLE_KEYS.map((resource) => ({
  id: `linked-${resource}`,
  label: `Ver ${LINKABLE[resource].label.toLowerCase()}`,
  target: resource,
  icon: ExternalLink,
  when: (row) => row.linkedResource === resource && row.linkedId !== '',
  search: (row) => row.linkedLabel,
}));

export const DOCUMENTOS_LISTS: ListDefinitionsFor<'documentos'> = {
  documentos: {
    entity: { singular: 'documento', plural: 'documentos', newLabel: 'Subir documento' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre, archivo o registro vinculado...',
    searchFields: (row) => [row.name, row.fileName, row.linkedLabel, row.uploadedBy],
    columns: [
      {
        id: 'name',
        header: 'Documento',
        kind: 'title',
        value: (row) => ({
          title: row.name,
          subtitle: `${row.fileName} · ${formatSize(row.fileSize)}`,
        }),
      },
      {
        id: 'category',
        header: 'Categoría',
        kind: 'badge',
        value: (row) => DOCUMENT_CATEGORY[row.category],
      },
      {
        id: 'linked',
        header: 'Vinculado a',
        kind: 'muted',
        value: (row) =>
          isLinkableResource(row.linkedResource) && row.linkedLabel
            ? `${LINKABLE[row.linkedResource].label} ${row.linkedLabel}`
            : '—',
        hideBelow: 'md',
      },
      {
        id: 'uploadedBy',
        header: 'Subido por',
        kind: 'person',
        value: (row) => row.uploadedBy,
        hideBelow: 'xl',
      },
      {
        id: 'uploadedAt',
        header: 'Fecha',
        kind: 'datetime',
        value: (row) => row.uploadedAt,
        hideBelow: 'lg',
      },
    ],
    form: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      {
        key: 'category',
        label: 'Categoría',
        type: 'select',
        required: true,
        options: optionsOf(DOCUMENT_CATEGORY),
      },
      {
        key: 'linkedResource',
        label: 'Vincular a',
        type: 'select',
        hint: 'Opcional: el documento aparecerá al consultar ese registro.',
        options: LINKABLE_KEYS.map((resource) => ({
          value: resource,
          label: LINKABLE[resource].label,
        })),
      },
      {
        key: 'linkedId',
        label: 'Registro',
        type: 'select',
        visible: (values) => isLinkableResource(values.linkedResource),
        optionsFrom: (values) =>
          isLinkableResource(values.linkedResource)
            ? LINKED_LOOKUP[values.linkedResource]
            : undefined,
      },
      {
        key: 'content',
        label: 'Archivo',
        type: 'file',
        required: true,
        fullWidth: true,
        hint: 'Hasta 1 MB. Al editar, sube otro solo si quieres reemplazarlo.',
      },
    ],
    createDefaults: () => ({ category: 'other', linkedResource: '', linkedId: '' }),
    prefill: {
      clientes: link('clientes'),
      proveedores: link('proveedores'),
      ventas: link('ventas'),
      comprobantes: link('comprobantes'),
      'ordenes-compra': link('ordenes-compra'),
      recepciones: link('recepciones'),
      'facturas-proveedor': link('facturas-proveedor'),
    },
    flowActions: LINKED_FLOWS,
  },
};
