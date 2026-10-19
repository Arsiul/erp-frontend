import { History, Users } from 'lucide-react';

import { activeStatusActions } from '@/modules/shared/common-actions';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import { ACTIVE_STATUS, EMAIL_PATTERN, MODULE_LABEL, optionsOf } from '@/modules/shared/status';
import { MODULE_IDS, type Permissions } from '@/types/administracion';

function accessSummary(permissions: Permissions): string {
  const writable = MODULE_IDS.filter((id) => permissions[id] === 'write').length;
  const readable = MODULE_IDS.filter((id) => permissions[id] === 'read').length;
  if (writable === MODULE_IDS.length) return 'Acceso total';
  const parts = [writable && `${writable} con registro`, readable && `${readable} de consulta`];
  return parts.filter(Boolean).join(' · ') || 'Sin acceso';
}

export const ADMINISTRACION_LISTS: ListDefinitionsFor<'usuarios' | 'roles' | 'auditoria'> = {
  usuarios: {
    entity: { singular: 'usuario', plural: 'usuarios', newLabel: 'Nuevo usuario' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre, correo o rol...',
    searchFields: (row) => [row.name, row.email, row.roleName],
    columns: [
      {
        id: 'name',
        header: 'Usuario',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: row.email }),
      },
      { id: 'role', header: 'Rol', kind: 'muted', value: (row) => row.roleName },
      {
        id: 'lastAccessAt',
        header: 'Último acceso',
        kind: 'datetime',
        value: (row) => row.lastAccessAt,
        hideBelow: 'lg',
      },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => ACTIVE_STATUS[row.status] },
    ],
    form: [
      { key: 'name', label: 'Nombre completo', type: 'text', required: true, fullWidth: true },
      { key: 'email', label: 'Correo', type: 'email', required: true, pattern: EMAIL_PATTERN },
      {
        key: 'roleId',
        label: 'Rol',
        type: 'select',
        required: true,
        optionsFrom: { resource: 'roles' },
        hint: 'Entorno de demostración: todos los usuarios ingresan con la contraseña "demo".',
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        options: optionsOf(ACTIVE_STATUS),
        only: 'edit',
      },
    ],
    createDefaults: () => ({ status: 'active' }),
    prefill: {
      roles: (role) => ({ roleId: role.id }),
    },
    processActions: activeStatusActions((row) => row.name),
    flowActions: [
      {
        id: 'audit',
        label: 'Ver actividad',
        target: 'auditoria',
        icon: History,
        search: (row) => row.name,
      },
      { id: 'role', label: 'Ver rol', target: 'roles', search: (row) => row.roleName },
    ],
  },

  roles: {
    entity: { singular: 'rol', plural: 'roles', newLabel: 'Nuevo rol' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre o descripción...',
    searchFields: (row) => [row.name, row.description],
    columns: [
      {
        id: 'name',
        header: 'Rol',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: row.description }),
      },
      {
        id: 'access',
        header: 'Permisos',
        kind: 'muted',
        value: (row) => accessSummary(row.permissions),
        hideBelow: 'md',
      },
      {
        id: 'type',
        header: 'Tipo',
        kind: 'badge',
        value: (row) =>
          row.system
            ? { label: 'Del sistema', tone: 'neutral' }
            : { label: 'Personalizado', tone: 'primary' },
      },
    ],
    form: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'text' },
      { key: 'permissions', label: 'Permisos por módulo', type: 'permissions', fullWidth: true },
    ],
    createDefaults: () => ({
      permissions: Object.fromEntries(MODULE_IDS.map((id) => [id, 'none'])) as Permissions,
    }),
    editWhen: (row) => !row.system,
    removeWhen: (row) => !row.system,
    flowActions: [
      {
        id: 'users',
        label: 'Ver usuarios con este rol',
        target: 'usuarios',
        icon: Users,
        search: (row) => row.name,
      },
      { id: 'new-user', label: 'Nuevo usuario con este rol', target: 'usuarios' },
    ],
  },

  auditoria: {
    entity: { singular: 'registro de auditoría', plural: 'registros de auditoría', newLabel: '' },
    rowTitle: (row) => `${row.action} · ${row.reference}`,
    searchPlaceholder: 'Buscar por usuario, acción o referencia...',
    searchFields: (row) => [row.userName, row.action, row.reference, MODULE_LABEL[row.module]],
    columns: [
      { id: 'date', header: 'Fecha', kind: 'datetime', value: (row) => row.date },
      { id: 'user', header: 'Usuario', kind: 'person', value: (row) => row.userName },
      {
        id: 'module',
        header: 'Módulo',
        kind: 'muted',
        value: (row) => MODULE_LABEL[row.module],
        hideBelow: 'md',
      },
      {
        id: 'action',
        header: 'Acción',
        kind: 'title',
        value: (row) => ({ title: row.action, subtitle: row.resource }),
      },
      {
        id: 'reference',
        header: 'Referencia',
        kind: 'code',
        value: (row) => row.reference,
        hideBelow: 'lg',
      },
    ],
    flowActions: [
      { id: 'user', label: 'Ver usuario', target: 'usuarios', search: (row) => row.userName },
    ],
  },
};
