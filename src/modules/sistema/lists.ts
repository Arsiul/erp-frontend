import type { BadgeValue } from '@/components/data-table/types';
import { ACTIVE_STATUS } from '@/modules/shared/labels';
import type { ListDefinitionsFor } from '@/modules/shared/list-definition';
import {
  DOCUMENT_TYPE_OPTIONS,
  EMAIL_PATTERN,
  fromLabels,
  ROLE_OPTIONS,
  WAREHOUSE_OPTIONS,
} from '@/modules/shared/options';
import type { AuditEntry, SystemUser } from '@/types/sistema';

const AUDIT_RESULT: Record<AuditEntry['result'], BadgeValue> = {
  success: { label: 'Éxito', tone: 'success', appearance: 'soft' },
  error: { label: 'Error', tone: 'danger', appearance: 'soft' },
  denied: { label: 'Denegado', tone: 'warning', appearance: 'soft' },
};

const USER_STATUS: Record<SystemUser['status'], BadgeValue> = {
  active: { label: 'Activo', tone: 'success', appearance: 'soft' },
  blocked: { label: 'Bloqueado', tone: 'danger', appearance: 'soft' },
};

export const SISTEMA_LISTS: ListDefinitionsFor<
  'usuarios' | 'roles' | 'auditoria' | 'empresa' | 'series' | 'parametros'
> = {
  usuarios: {
    entity: { singular: 'usuario', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar por nombre, correo o rol...',
    searchFields: (row) => [row.name, row.email, row.role, row.warehouse],
    columns: [
      { id: 'name', header: 'Usuario', kind: 'person', value: (row) => row.name },
      { id: 'email', header: 'Correo', kind: 'muted', value: (row) => row.email, hideBelow: 'xl' },
      { id: 'role', header: 'Rol', kind: 'text', value: (row) => row.role },
      {
        id: 'warehouse',
        header: 'Almacén',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: 'lg',
      },
      {
        id: 'access',
        header: 'Último acceso',
        kind: 'datetime',
        value: (row) => row.lastAccessAt,
        hideBelow: 'md',
      },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => USER_STATUS[row.status] },
    ],
    form: [
      { key: 'name', label: 'Nombre completo', type: 'text', required: true, fullWidth: true },
      {
        key: 'email',
        label: 'Correo',
        type: 'email',
        required: true,
        pattern: EMAIL_PATTERN,
        fullWidth: true,
      },
      { key: 'role', label: 'Rol', type: 'select', options: ROLE_OPTIONS },
      { key: 'warehouse', label: 'Almacén', type: 'select', options: WAREHOUSE_OPTIONS },
    ],
    createDefaults: () => ({
      name: '',
      email: '',
      role: 'Vendedor',
      warehouse: 'Almacén principal',
      lastAccessAt: '',
      status: 'active',
    }),
    canEdit: () => true,
    canDelete: () => true,
    statusActions: [
      {
        id: 'block',
        label: 'Bloquear acceso',
        tone: 'danger',
        when: (row) => row.status === 'active',
        patch: () => ({ status: 'blocked' }),
        confirm: {
          title: '¿Bloquear al usuario?',
          description: (row) => `${row.name} no podrá iniciar sesión hasta que se desbloquee.`,
          confirmLabel: 'Bloquear',
        },
        success: (row) => `${row.name} bloqueado.`,
      },
      {
        id: 'unblock',
        label: 'Desbloquear',
        when: (row) => row.status === 'blocked',
        patch: () => ({ status: 'active' }),
        success: (row) => `${row.name} puede volver a ingresar.`,
      },
    ],
  },
  roles: {
    entity: { singular: 'rol', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar rol...',
    searchFields: (row) => [row.name, row.description],
    columns: [
      {
        id: 'name',
        header: 'Rol',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: row.description }),
      },
      { id: 'users', header: 'Usuarios', kind: 'number', value: (row) => row.userCount },
      {
        id: 'permissions',
        header: 'Permisos',
        kind: 'number',
        value: (row) => row.permissionCount,
      },
    ],
    form: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, fullWidth: true },
      { key: 'description', label: 'Qué puede hacer', type: 'textarea', fullWidth: true },
    ],
    createDefaults: () => ({ name: '', description: '', userCount: 0, permissionCount: 0 }),
    canEdit: () => true,
    // Un rol asignado a usuarios no se puede eliminar.
    canDelete: (row) => row.userCount === 0,
  },
  auditoria: {
    entity: { singular: 'registro de auditoría', gender: 'm' },
    rowTitle: (row) => `${row.action} · ${row.user}`,
    searchPlaceholder: 'Buscar por usuario, acción, módulo o registro...',
    searchFields: (row) => [row.user, row.action, row.module, row.record],
    columns: [
      { id: 'date', header: 'Fecha y hora', kind: 'datetime', value: (row) => row.date },
      { id: 'user', header: 'Usuario', kind: 'person', value: (row) => row.user },
      { id: 'action', header: 'Acción', kind: 'text', value: (row) => row.action },
      {
        id: 'module',
        header: 'Módulo',
        kind: 'muted',
        value: (row) => row.module,
        hideBelow: 'lg',
      },
      {
        id: 'record',
        header: 'Registro',
        kind: 'muted',
        value: (row) => row.record,
        hideBelow: 'md',
      },
      {
        id: 'result',
        header: 'Resultado',
        kind: 'badge',
        value: (row) => AUDIT_RESULT[row.result],
      },
    ],
    // La auditoría es inmutable: solo se consulta.
  },
  empresa: {
    entity: { singular: 'dato de la empresa', gender: 'm' },
    rowTitle: (row) => row.field,
    searchPlaceholder: 'Buscar dato...',
    searchFields: (row) => [row.field, row.value],
    columns: [
      { id: 'field', header: 'Dato', kind: 'muted', value: (row) => row.field },
      { id: 'value', header: 'Valor', kind: 'text', value: (row) => row.value },
    ],
    form: [{ key: 'value', label: 'Valor', type: 'text', required: true, fullWidth: true }],
    canEdit: () => true,
  },
  series: {
    entity: { singular: 'serie', gender: 'f' },
    rowTitle: (row) => `${row.series} · ${row.documentType}`,
    searchPlaceholder: 'Buscar por tipo, serie o sede...',
    searchFields: (row) => [row.documentType, row.series, row.warehouse],
    columns: [
      { id: 'series', header: 'Serie', kind: 'code', value: (row) => row.series },
      { id: 'type', header: 'Comprobante', kind: 'text', value: (row) => row.documentType },
      { id: 'next', header: 'Siguiente número', kind: 'code', value: (row) => row.nextNumber },
      {
        id: 'warehouse',
        header: 'Sede',
        kind: 'muted',
        value: (row) => row.warehouse,
        hideBelow: 'md',
      },
      { id: 'status', header: 'Estado', kind: 'badge', value: (row) => ACTIVE_STATUS[row.status] },
    ],
    form: [
      { key: 'documentType', label: 'Comprobante', type: 'select', options: DOCUMENT_TYPE_OPTIONS },
      { key: 'series', label: 'Serie', type: 'text', required: true, placeholder: 'F003' },
      {
        key: 'nextNumber',
        label: 'Siguiente número',
        type: 'text',
        required: true,
        pattern: { regex: /^\d{6}$/, message: 'Debe tener 6 dígitos, ej.: 000001.' },
      },
      { key: 'warehouse', label: 'Sede', type: 'select', options: WAREHOUSE_OPTIONS },
      { key: 'status', label: 'Estado', type: 'select', options: fromLabels(ACTIVE_STATUS) },
    ],
    createDefaults: () => ({
      documentType: 'Factura',
      series: '',
      nextNumber: '000001',
      warehouse: 'Almacén principal',
      status: 'active',
    }),
    canEdit: () => true,
    // Una serie en uso no se elimina; primero se desactiva.
    canDelete: (row) => row.status === 'inactive',
  },
  parametros: {
    entity: { singular: 'parámetro', gender: 'm' },
    rowTitle: (row) => row.name,
    searchPlaceholder: 'Buscar parámetro...',
    searchFields: (row) => [row.name, row.value, row.description],
    columns: [
      {
        id: 'name',
        header: 'Parámetro',
        kind: 'title',
        value: (row) => ({ title: row.name, subtitle: row.description }),
      },
      { id: 'value', header: 'Valor', kind: 'code', value: (row) => row.value },
    ],
    form: [{ key: 'value', label: 'Valor', type: 'text', required: true, fullWidth: true }],
    canEdit: () => true,
  },
};
