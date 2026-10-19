import type { AccessLevel, ModuleId, Permissions, Role, User } from '@/types/administracion';

import { BusinessError, type BusinessContext } from './mocks/business';
import { isoDateTime } from './mocks/business/context';
import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';

/**
 * Sesión simulada: guarda solo el id del usuario y resuelve rol y permisos en cada lectura,
 * así un cambio de rol o una desactivación se aplica sin volver a iniciar sesión.
 * Con el backend, esto pasa a ser el token y el perfil que devuelva /auth.
 */
const SESSION_KEY = 'erp.session';

/** Contraseña única de la demo para todos los usuarios. */
export const DEMO_PASSWORD = 'demo';

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
    const userId = storedUserId();
    return userId ? resolve(userId) : null;
  },

  login(email: string, password: string): Promise<Session> {
    return withLatency(() => {
      const normalized = email.trim().toLowerCase();
      const user = mockDb.read((store) =>
        store.list('usuarios').find((row) => row.email.toLowerCase() === normalized),
      );
      if (!user || password !== DEMO_PASSWORD)
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
    storeUserId(null);
  },

  /** Cuentas activas que la pantalla de acceso ofrece para probar cada rol. */
  demoAccounts(): Pick<User, 'id' | 'name' | 'email' | 'roleName'>[] {
    return mockDb.read((store) =>
      store
        .list('usuarios')
        .filter((user) => user.status === 'active')
        .map(({ id, name, email, roleName }) => ({ id, name, email, roleName })),
    );
  },

  /** Inicia sesión sin esperas ni contraseña (pruebas y arranque de la demo). */
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
