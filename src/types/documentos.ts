export type DocumentCategory = 'contract' | 'invoice' | 'guide' | 'order' | 'other';

/** Archivo guardado en el repositorio, opcionalmente vinculado a un registro de otro módulo. */
export interface StoredDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  /** Recurso y registro de origen (ej.: "ventas" y su id). */
  linkedResource: string;
  linkedId: string;
  linkedLabel: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** Contenido en data URL; solo se guarda si el archivo es pequeño. */
  content: string;
  uploadedAt: string;
  uploadedBy: string;
}
