import { resourcePath } from '@/config/routes';
import type { BusinessAlert } from '@/types/alerts';
import { daysBetween, isOverdue, todayIso } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';

import type { ResourceKey } from '@/types/resources';

import { api } from './http/client';
import { USE_API } from './http/config';
import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';
import type { Store } from './mocks/store';
import { sessionService } from './session.service';

function count(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function comercialAlerts(store: Store, today: string): BusinessAlert[] {
  const alerts: BusinessAlert[] = [];
  const overdue = store
    .list('cuentas-cobrar')
    .filter((row) => isOverdue(row.dueAt, row.balance, today));
  if (overdue.length) {
    alerts.push({
      id: 'receivables-overdue',
      severity: 'critical',
      title: count(overdue.length, 'cobro vencido', 'cobros vencidos'),
      description: `${formatCurrency(overdue.reduce((total, row) => total + row.balance, 0))} pendientes de clientes.`,
      path: resourcePath('cuentas-cobrar'),
    });
  }
  const toInvoice = store.list('ventas').filter((row) => row.status === 'pending_invoice');
  if (toInvoice.length) {
    alerts.push({
      id: 'sales-to-invoice',
      severity: 'info',
      title: count(toInvoice.length, 'venta por facturar', 'ventas por facturar'),
      description: 'Emite el comprobante para generar la cuenta por cobrar.',
      path: resourcePath('ventas'),
    });
  }
  const expiring = store
    .list('cotizaciones')
    .filter((row) => row.status === 'sent' && daysBetween(today, row.validUntil) <= 2);
  if (expiring.length) {
    alerts.push({
      id: 'quotes-expiring',
      severity: 'warning',
      title: count(expiring.length, 'cotización por vencer', 'cotizaciones por vencer'),
      description: 'Enviadas al cliente y sin respuesta; vencen en dos días o menos.',
      path: resourcePath('cotizaciones'),
    });
  }
  return alerts;
}

function comprasAlerts(store: Store, today: string): BusinessAlert[] {
  const alerts: BusinessAlert[] = [];
  const open = store
    .list('cuentas-pagar')
    .filter((row) => row.balance > 0 && row.status !== 'cancelled');
  const overdue = open.filter((row) => isOverdue(row.dueAt, row.balance, today));
  const dueSoon = open.filter(
    (row) => !isOverdue(row.dueAt, row.balance, today) && daysBetween(today, row.dueAt) <= 7,
  );
  if (overdue.length) {
    alerts.push({
      id: 'payables-overdue',
      severity: 'critical',
      title: count(overdue.length, 'pago vencido', 'pagos vencidos'),
      description: `${formatCurrency(overdue.reduce((total, row) => total + row.balance, 0))} adeudados a proveedores.`,
      path: resourcePath('cuentas-pagar'),
    });
  }
  if (dueSoon.length) {
    alerts.push({
      id: 'payables-due-soon',
      severity: 'warning',
      title: `${count(dueSoon.length, 'pago vence', 'pagos vencen')} esta semana`,
      description: `${formatCurrency(dueSoon.reduce((total, row) => total + row.balance, 0))} a proveedores en los próximos 7 días.`,
      path: resourcePath('cuentas-pagar'),
    });
  }
  const toBill = store.list('recepciones').filter((row) => row.status === 'pending_bill');
  if (toBill.length) {
    alerts.push({
      id: 'receipts-to-bill',
      severity: 'info',
      title: count(toBill.length, 'recepción sin factura', 'recepciones sin factura'),
      description: 'Registra la factura del proveedor para generar la cuenta por pagar.',
      path: resourcePath('recepciones'),
    });
  }
  return alerts;
}

function inventarioAlerts(store: Store): BusinessAlert[] {
  const alerts: BusinessAlert[] = [];
  const critical = store.list('stock').filter((row) => row.quantity < row.minStock);
  if (critical.length) {
    const empty = critical.filter((row) => row.quantity === 0).length;
    alerts.push({
      id: 'stock-critical',
      severity: empty ? 'critical' : 'warning',
      title: count(critical.length, 'producto bajo el mínimo', 'productos bajo el mínimo'),
      description: empty
        ? `${count(empty, 'sin stock', 'sin stock')} en algún almacén.`
        : 'Programa una compra o una transferencia.',
      path: resourcePath('stock'),
    });
  }
  const pending = store.list('transferencias').filter((row) => row.status === 'pending');
  if (pending.length) {
    alerts.push({
      id: 'transfers-pending',
      severity: 'info',
      title: count(pending.length, 'transferencia pendiente', 'transferencias pendientes'),
      description: 'Confírmalas al recibir la mercadería en el almacén de destino.',
      path: resourcePath('transferencias'),
    });
  }
  return alerts;
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;

/** Alertas calculadas desde los registros, solo de los módulos que el rol puede consultar. */
/** Alerta tal como llega de GET /alerts: con `path` o con el `resource` al que lleva. */
type RemoteAlert = Omit<BusinessAlert, 'path'> & { path?: string; resource?: ResourceKey };

async function remoteAlerts(): Promise<BusinessAlert[]> {
  const alerts = await api.get<RemoteAlert[]>('/alerts');
  return alerts.map(({ resource, path, ...alert }) => ({
    ...alert,
    path: path ?? (resource ? resourcePath(resource) : '/'),
  }));
}

export const alertsService = {
  getActive(): Promise<BusinessAlert[]> {
    if (USE_API) return remoteAlerts();
    return withLatency(() => {
      const today = todayIso();
      return mockDb.read((store) =>
        [
          ...(sessionService.can('comercial') ? comercialAlerts(store, today) : []),
          ...(sessionService.can('compras') ? comprasAlerts(store, today) : []),
          ...(sessionService.can('inventario') ? inventarioAlerts(store) : []),
        ].toSorted((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
      );
    });
  },
};
