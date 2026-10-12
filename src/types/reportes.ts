export interface ReportEntry {
  id: string;
  name: string;
  description: string;
  formats: string;
  /** Fecha ISO (YYYY-MM-DD) de la última generación. */
  lastGeneratedAt: string;
}
