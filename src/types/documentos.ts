export type DocumentKind = 'receipt' | 'supplier-invoice' | 'contract' | 'datasheet';

export interface DocumentFile {
  id: string;
  name: string;
  kind: DocumentKind;
  /** Registro al que pertenece (ej.: "Venta F001-002341"). */
  linkedTo: string;
  uploadedBy: string;
  /** Fecha ISO (YYYY-MM-DD). */
  uploadedAt: string;
  sizeKb: number;
}
