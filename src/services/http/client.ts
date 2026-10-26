import { API_URL } from './config';

/**
 * Cliente HTTP de la API. El access token vive solo en memoria (nunca en localStorage): tras una
 * recarga se recupera con POST /auth/refresh, que usa la cookie httpOnly del refresh token.
 */

const TIMEOUT_MS = 60_000;

const MESSAGES = {
  network: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  timeout:
    'El servidor tarda en responder. Puede estar iniciándose; inténtalo de nuevo en unos segundos.',
  sessionEnded: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  forbidden: 'Tu rol no tiene acceso a este módulo.',
  notFound: 'El registro ya no existe.',
  tooLarge: 'El archivo supera 1 MB.',
  tooMany: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  server: 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.',
  invalid: 'Los datos enviados no son válidos.',
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Respuesta del backend al iniciar sesión, renovarla o cambiar la contraseña. */
export interface TokenResponse<S> {
  accessToken: string;
  expiresIn: number;
  session: S;
}

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let hooks: SessionHooks = {};

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export interface SessionHooks {
  /** Tras renovar el token: el backend devuelve la sesión vigente. */
  renewed?: (session: unknown) => void;
  /** La sesión no se pudo renovar: limpiar el perfil e ir al acceso. */
  ended?: () => void;
}

export function configureSession(next: SessionHooks): void {
  hooks = next;
}

type Query = Record<string, string | number | undefined | null>;

export interface RequestOptions {
  body?: unknown;
  form?: FormData;
  query?: Query;
  /** false: no envía el token ni intenta renovarlo (login, refresh, logout). */
  auth?: boolean;
}

function urlFor(path: string, query?: Query): string {
  const url = `${API_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'TimeoutError';
}

async function send(method: string, path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (options.form) body = options.form;
  else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  if (options.auth !== false && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(urlFor(path, options.query), {
      method,
      headers,
      body,
      credentials: 'include',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ApiError(
      isTimeout(error) ? MESSAGES.timeout : MESSAGES.network,
      0,
      isTimeout(error) ? 'TIMEOUT' : 'NETWORK',
    );
  }
}

async function bodyMessage(response: Response): Promise<{ message?: string; code?: string }> {
  try {
    const data = (await response.json()) as { message?: unknown; code?: unknown };
    return {
      message: typeof data.message === 'string' && data.message ? data.message : undefined,
      code: typeof data.code === 'string' ? data.code : undefined,
    };
  } catch {
    return {};
  }
}

/** Traduce una respuesta de error al mensaje que ve el usuario (§4.3). */
async function toError(response: Response): Promise<ApiError> {
  const { status } = response;
  const { message, code = `HTTP_${String(status)}` } = await bodyMessage(response);
  if (status >= 500) return new ApiError(MESSAGES.server, status, code);
  switch (status) {
    case 400:
    case 409:
    case 422:
      return new ApiError(message ?? MESSAGES.invalid, status, code);
    case 401:
      return new ApiError(message ?? MESSAGES.sessionEnded, status, code);
    case 403:
      return new ApiError(message ?? MESSAGES.forbidden, status, code);
    case 404:
      return new ApiError(message ?? MESSAGES.notFound, status, code);
    case 413:
      return new ApiError(MESSAGES.tooLarge, status, code);
    case 429:
      return new ApiError(MESSAGES.tooMany, status, code);
    default:
      return new ApiError(message ?? MESSAGES.server, status, code);
  }
}

/** Una sola renovación a la vez: las peticiones que fallan juntas esperan la misma. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const response = await send('POST', '/auth/refresh', { auth: false });
      if (!response.ok) return false;
      const data = (await response.json()) as TokenResponse<unknown>;
      accessToken = data.accessToken;
      hooks.renewed?.(data.session);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function authorized(method: string, path: string, options: RequestOptions): Promise<Response> {
  let response = await send(method, path, options);
  if (response.status !== 401 || options.auth === false) return response;
  if (await refreshSession()) {
    response = await send(method, path, options);
    if (response.status !== 401) return response;
  }
  accessToken = null;
  hooks.ended?.();
  throw new ApiError(MESSAGES.sessionEnded, 401, 'SESSION_ENDED');
}

export async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await authorized(method, path, options);
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;
  const type = response.headers.get('Content-Type') ?? '';
  if (!type.includes('application/json')) {
    const text = await response.text();
    return (text ? text : undefined) as T;
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(MESSAGES.server, response.status, 'INVALID_JSON');
  }
}

/** Descarga un archivo protegido (el token no viaja en un href) y lo entrega como Blob. */
export async function download(path: string): Promise<Blob> {
  const response = await authorized('GET', path, {});
  if (!response.ok) throw await toError(response);
  return response.blob();
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  delete: (path: string) => request<undefined>('DELETE', path),
  postForm: <T>(path: string, form: FormData) => request<T>('POST', path, { form }),
  patchForm: <T>(path: string, form: FormData) => request<T>('PATCH', path, { form }),
};
