import type { ListDefinition, ListDefinitionsFor } from '@/modules/shared/list-definition';
import { todayIso } from '@/modules/shared/options';

type ReportResource =
  'reportes-comerciales' | 'reportes-compras' | 'reportes-inventario' | 'reportes-financieros';

/**
 * Los cuatro catálogos de reportes comparten la misma vista. Sus registros son del mismo tipo
 * (ReportEntry), así que una definición sirve para las cuatro claves.
 */
function reportCatalog(): ListDefinition<'reportes-comerciales'> {
  return {
    entity: { singular: 'reporte', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar reporte...',
    searchFields: (row) => [row.name, row.description],
    columns: [
      {
        id: 'name',
        header: 'Reporte',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: row.description }),
      },
      {
        id: 'formats',
        header: 'Exporta a',
        kind: 'muted',
        value: (row) => row.formats,
        hideBelow: 'md',
      },
      {
        id: 'last',
        header: 'Última generación',
        kind: 'date',
        value: (row) => row.lastGeneratedAt,
      },
    ],
    statusActions: [
      {
        id: 'generate',
        label: 'Generar ahora',
        when: () => true,
        patch: () => ({ lastGeneratedAt: todayIso() }),
        success: (row) => `“${row.name}” generado. La descarga estará disponible con la API.`,
      },
    ],
  };
}

export const REPORTES_LISTS: ListDefinitionsFor<ReportResource> = {
  'reportes-comerciales': reportCatalog(),
  'reportes-compras': reportCatalog(),
  'reportes-inventario': reportCatalog(),
  'reportes-financieros': reportCatalog(),
};
