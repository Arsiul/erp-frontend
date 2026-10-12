import type { BadgeValue } from '@/components/data-table/types';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import type { DocumentKind } from '@/types/documentos';
import { formatInteger } from '@/utils/format';

const DOCUMENT_KIND: Record<DocumentKind, BadgeValue> = {
  receipt: { label: 'Comprobante', tone: 'primary', appearance: 'soft' },
  'supplier-invoice': { label: 'Factura de proveedor', tone: 'info', appearance: 'soft' },
  contract: { label: 'Contrato', tone: 'warning', appearance: 'soft' },
  datasheet: { label: 'Ficha técnica', tone: 'success', appearance: 'soft' },
};

export const DOCUMENTOS_LISTS: ListDefinitionsFor<'repositorio'> = {
  repositorio: {
    entity: { singular: 'documento', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre, tipo o registro...',
    searchFields: (row) => [row.name, row.linkedTo, DOCUMENT_KIND[row.kind].label, row.uploadedBy],
    columns: [
      {
        id: 'name',
        header: 'Archivo',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: `${formatInteger(row.sizeKb)} KB` }),
      },
      { id: 'kind', header: 'Tipo', kind: 'badge', value: (row) => DOCUMENT_KIND[row.kind] },
      {
        id: 'linked',
        header: 'Pertenece a',
        kind: 'muted',
        value: (row) => row.linkedTo,
        hideBelow: 'lg',
      },
      {
        id: 'by',
        header: 'Subido por',
        kind: 'person',
        value: (row) => row.uploadedBy,
        hideBelow: 'xl',
      },
      { id: 'date', header: 'Fecha', kind: 'date', value: (row) => row.uploadedAt },
    ],
    form: [
      { key: 'name', label: 'Nombre del archivo', type: 'text', required: true, fullWidth: true },
      { key: 'linkedTo', label: 'Pertenece a', type: 'text', fullWidth: true },
    ],
    canEdit: () => true,
    canDelete: () => true,
  },
};
