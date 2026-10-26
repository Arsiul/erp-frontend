/** URL base de la API sin barra final (ej.: http://localhost:3000/api/v1). */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/**
 * Con `VITE_API_URL` definida la app trabaja contra el backend; sin ella, o en las pruebas,
 * sigue usando la base simulada del navegador.
 */
export const USE_API = import.meta.env.MODE !== 'test' && Boolean(import.meta.env.VITE_API_URL);
