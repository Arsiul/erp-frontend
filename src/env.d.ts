/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API REST, con el prefijo /api/v1. Vacía: la app usa la base simulada. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
