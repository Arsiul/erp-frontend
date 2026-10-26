import type { AccessLevel, ModuleId, Permissions, Role, User } from '@/types/administracion';

import type { ResourceKey } from '@/types/resources';

import { api, configureSession, request, setAccessToken, type TokenResponse } from './http/client';
import { USE_API } from './http/config';
import {
  BusinessError,
  type BusinessContext,
  type ResourceCapabilities,
} from './mocks/business';
import { isoDateTime } from './mocks/business/context';
import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';

/**
 * Sesión simulada: guarda solo el id del usuario y resuelve rol y permisos en cada lectura,
 * así un cambio de rol o una desactivación se aplica sin volver a iniciar sesión.
 */
const SESSION_KEY = 'erp.session';

/**
 * Con la API: el access token vive solo en memoria (http/client) y el refresh token en una cookie
 * httpOnly. Aquí se guarda únicamente el perfil (usuario, rol, permisos y capacidades, sin tokens)
 * para que menús y permisos se resuelvan de forma síncrona tras una recarga.
 */
const PROFILE_KEY = 'erp.profile';

/** Contraseña de la base simulada (solo pruebas y desarrollo sin backend). */
const MOCK_PASSWORD = 'demo';

export interface Session {
  user: User;
  role: Role;
  permissions: Permissions;
}

const LEVEL_RANK: Record<AccessLevel, number> = { none: 0, read: 1, write: 2 };

function storedUserId(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function storeUserId(userId: string | null): void {
  try {
    if (userId) window.localStorage.setItem(SESSION_KEY, userId);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Sin almacenamiento: la sesión no sobrevive a una recarga.
  }
}

type Capabilities = Partial<Record<ResourceKey, ResourceCapabilities>>;

interface Profile {
  session: Session;
  capabilities: Capabilities;
}

/** Respuesta de GET /auth/me. */
type MeResponse = Session & { capabilities: Capabilities };

function readProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function storeProfile(profile: Profile | null): void {
  try {
    if (profile) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Sin almacenamiento: el perfil no sobrevive a una recarga.
  }
}

function profileOf({ capabilities, user, role, permissions }: MeResponse): Profile {
  return { session: { user, role, permissions }, capabilities };
}

if (USE_API) {
  configureSession({
    renewed: (session) => {
      const profile = readProfile();
      if (profile) storeProfile({ ...profile, session: session as Session });
    },
    ended: () => {
      storeProfile(null);
      if (window.location.pathname !== '/login') window.location.assign('/login');
    },
  });
}

function resolve(userId: string): Session | null {
  return mockDb.read((store) => {
    const user = store.get('usuarios', userId);
    if (user?.status !== 'active') return null;
    const role = store.get('roles', user.roleId);
    if (!role) return null;
    return { user, role, permissions: role.permissions };
  });
}

export const sessionService = {
  current(): Session | null {
    if (USE_API) return readProfile()?.session ?? null;
    const userId = storedUserId();
    return userId ? resolve(userId) : null;
  },

  /** Vuelve a leer el perfil (tras cambiar usuarios o roles); sin sesión devuelve null. */
  async load(): Promise<Session | null> {
    if (!USE_API) return sessionService.current();
    if (!readProfile()) return null;
    try {
      storeProfile(profileOf(await api.get<MeResponse>('/auth/me')));
    } catch {
      // Sin conexión se conserva el perfil guardado; una sesión vencida ya lo limpió.
    }
    return sessionService.current();
  },

  /** Capacidades del recurso para el rol actual, según el backend. */
  capabilitiesOf(resource: ResourceKey): ResourceCapabilities | undefined {
    return readProfile()?.capabilities[resource];
  },

  async login(email: string, password: string): Promise<Session> {
    if (USE_API) {
      const issued = await request<TokenResponse<Session>>('POST', '/auth/login', {
        body: { email: email.trim(), password },
        auth: false,
      });
      setAccessToken(issued.accessToken);
      storeProfile(profileOf(await api.get<MeResponse>('/auth/me')));
      return sessionService.current() ?? fail();
    }
    return withLatency(() => {
      const normalized = email.trim().toLowerCase();
      const user = mockDb.read((store) =>
        store.list('usuarios').find((row) => row.email.toLowerCase() === normalized),
      );
      if (!user || password !== MOCK_PASSWORD)
        throw new BusinessError('Correo o contraseña incorrectos.');
      if (user.status !== 'active')
        throw new BusinessError('Tu usuario está desactivado. Pide acceso a un administrador.');
      mockDb.transaction(
        (store) => store.update('usuarios', user.id, { lastAccessAt: isoDateTime(new Date()) }),
        {
          bookkeeping: true,
        },
      );
      storeUserId(user.id);
      return resolve(user.id) ?? fail();
    });
  },

  logout(): void {
    if (USE_API) {
      setAccessToken(null);
      storeProfile(null);
      // Revoca el refresh token; la pantalla no espera la respuesta.
      void request('POST', '/auth/logout', { auth: false }).catch(() => undefined);
      return;
    }
    storeUserId(null);
  },

  /** Inicia sesión sin esperas ni contraseña en la base simulada (pruebas). */
  signInAs(userId: string): void {
    storeUserId(userId);
  },

  can(module: ModuleId, level: AccessLevel = 'read'): boolean {
    const session = sessionService.current();
    return session !== null && LEVEL_RANK[session.permissions[module]] >= LEVEL_RANK[level];
  },

  /** Falla con un mensaje legible si la sesión no alcanza el nivel pedido. */
  assertAccess(module: ModuleId, level: AccessLevel): Session {
    const session = sessionService.current();
    if (!session) throw new BusinessError('Tu sesión terminó. Vuelve a iniciar sesión.');
    if (LEVEL_RANK[session.permissions[module]] < LEVEL_RANK[level]) {
      throw new BusinessError(
        level === 'write'
          ? 'Tu rol solo permite consultar este módulo.'
          : 'Tu rol no tiene acceso a este módulo.',
      );
    }
    return session;
  },

  /** Quién y cuándo, para las reglas de negocio y la auditoría. */
  contextFor(session: Session): BusinessContext {
    return { userId: session.user.id, userName: session.user.name, now: new Date() };
  },
};

function fail(): never {
  throw new BusinessError('No se pudo iniciar sesión.');
}
