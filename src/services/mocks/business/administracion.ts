import { MODULE_IDS, type AccessLevel, type Permissions } from '@/types/administracion';

import type { Store } from '../store';

import { fail, optionalText, requireText } from './context';
import {
  activationActions,
  activeStatus,
  assertUnique,
  pickEnum,
  requireRecord,
  type RecordInput,
  type ResourceRules,
} from './rules';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS: readonly AccessLevel[] = ['none', 'read', 'write'];

/** Completa los módulos que falten con "none" y descarta niveles desconocidos. */
export function normalizePermissions(value: unknown): Permissions {
  const source = (value && typeof value === 'object' ? value : {}) as Partial<
    Record<string, unknown>
  >;
  return Object.fromEntries(
    MODULE_IDS.map((module) => [
      module,
      pickEnum(source[module], LEVELS, 'El nivel de acceso no es válido.', 'none'),
    ]),
  ) as Permissions;
}

// ─── Usuarios ──────────────────────────────────────────────────────────────────

function userValues(store: Store, input: RecordInput<'usuarios'>, exceptId?: string) {
  const email = requireText(input.email, 'Escribe el correo.').toLowerCase();
  if (!EMAIL.test(email)) fail('El correo no es válido.');
  assertUnique(
    store.list('usuarios'),
    email,
    (row) => row.email,
    'Ya existe un usuario con ese correo.',
    exceptId,
  );
  const role = requireRecord(store, 'roles', input.roleId, 'el rol');
  return {
    name: requireText(input.name, 'Escribe el nombre.'),
    email,
    roleId: role.id,
    roleName: role.name,
    status: activeStatus(input.status),
  };
}

const activation = activationActions('usuarios');

const usuarios: ResourceRules<'usuarios'> = {
  create(store, _ctx, input) {
    return store.insert('usuarios', { ...userValues(store, input), lastAccessAt: '' });
  },
  update(store, ctx, current, input) {
    const values = userValues(store, { ...current, ...input }, current.id);
    if (current.id === ctx.userId) {
      if (values.roleId !== current.roleId) fail('No puedes cambiar tu propio rol.');
      if (values.status !== 'active') fail('No puedes desactivar tu propio usuario.');
    }
    return store.update('usuarios', current.id, values);
  },
  remove(store, ctx, current) {
    if (current.id === ctx.userId) fail('No puedes eliminar tu propio usuario.');
    if (store.list('auditoria').some((row) => row.userName === current.name)) {
      fail('El usuario tiene operaciones registradas; desactívalo en lugar de eliminarlo.');
    }
    store.remove('usuarios', current.id);
  },
  actions: {
    activate: activation.activate,
    deactivate: {
      label: activation.deactivate.label,
      run(store, ctx, current) {
        if (current.id === ctx.userId) fail('No puedes desactivar tu propio usuario.');
        activation.deactivate.run(store, ctx, current);
      },
    },
  },
};

// ─── Roles ─────────────────────────────────────────────────────────────────────

function roleValues(store: Store, input: RecordInput<'roles'>, exceptId?: string) {
  const name = requireText(input.name, 'Escribe el nombre del rol.');
  assertUnique(
    store.list('roles'),
    name,
    (row) => row.name,
    'Ya existe un rol con ese nombre.',
    exceptId,
  );
  return {
    name,
    description: optionalText(input.description),
    permissions: normalizePermissions(input.permissions),
  };
}

const roles: ResourceRules<'roles'> = {
  create(store, _ctx, input) {
    return store.insert('roles', { ...roleValues(store, input), system: false });
  },
  update(store, _ctx, current, input) {
    if (current.system) fail('Los roles del sistema no se modifican; crea uno nuevo.');
    const updated = store.update(
      'roles',
      current.id,
      roleValues(store, { ...current, ...input }, current.id),
    );
    if (updated.name !== current.name) {
      for (const user of store.list('usuarios').filter((row) => row.roleId === current.id)) {
        store.update('usuarios', user.id, { roleName: updated.name });
      }
    }
    return updated;
  },
  remove(store, _ctx, current) {
    if (current.system) fail('Los roles del sistema no se eliminan.');
    if (store.list('usuarios').some((row) => row.roleId === current.id)) {
      fail('El rol tiene usuarios; asígnales otro rol antes de eliminarlo.');
    }
    store.remove('roles', current.id);
  },
};

/** La auditoría la escribe la capa de negocio en cada operación. */
const auditoria: ResourceRules<'auditoria'> = {};

export const administracionRules = { usuarios, roles, auditoria };
