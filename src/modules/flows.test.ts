import { beforeEach, describe, expect, it } from 'vitest';

import * as business from '@/services/mocks/business';
import { buildDemoDatabase } from '@/services/mocks/seed/demo';
import { createStore, type Store } from '@/services/mocks/store';
import type { ResourceValues } from '@/services/resources.service';
import type { ResourceKey, ResourceMap } from '@/types/resources';

import { LIST_DEFINITIONS } from './list-registry';

const today = new Date(2026, 9, 18, 18, 0);
const ctx: business.BusinessContext = {
  userId: 'usr-admin',
  userName: 'Administrador',
  now: today,
};

let store: Store;

beforeEach(() => {
  store = createStore(buildDemoDatabase(today));
});

/** El botón del paso siguiente que la pantalla de origen ofrece para el registro. */
function nextStep<S extends ResourceKey>(source: S, row: ResourceMap[S], target: ResourceKey) {
  const definition = LIST_DEFINITIONS[source];
  const flows = (definition.flowActions ?? []) as NonNullable<
    typeof definition.flowActions
  >[number][];
  return flows.find((flow) => flow.target === target && !flow.search && (flow.when?.(row) ?? true));
}

/** Lo que el formulario destino trae cargado al abrirse desde el registro de origen (?from=). */
function formFrom<T extends ResourceKey, S extends ResourceKey>(
  target: T,
  source: S,
  row: ResourceMap[S],
): ResourceValues<T> {
  expect(nextStep(source, row, target), `${source} → ${target}`).toBeDefined();
  const definition = LIST_DEFINITIONS[target];
  const prefill = definition.prefill?.[source];
  expect(prefill, `${target} recibe ${source}`).toBeDefined();
  return { ...definition.createDefaults?.(), ...prefill?.(row) };
}

function bankAccount() {
  const accounts = store.list('cuentas-bancarias').filter((account) => account.status === 'active');
  const richest = accounts.sort((a, b) => b.balance - a.balance)[0];
  if (!richest) throw new Error('La demo no tiene cuentas bancarias activas.');
  return richest;
}

describe('ciclo comercial: venta → comprobante → cobro', () => {
  it('factura una venta pendiente y cobra el saldo desde Tesorería', () => {
    const sale = store.list('ventas').find((row) => row.status === 'pending_invoice');
    if (!sale) throw new Error('La demo no tiene ventas por facturar.');

    const invoice = business.createRecord(
      store,
      ctx,
      'comprobantes',
      formFrom('comprobantes', 'ventas', sale),
    );
    expect(invoice.saleId).toBe(sale.id);
    expect(invoice.number).toMatch(/^[FB]001-/);
    expect(store.get('ventas', sale.id)).toMatchObject({
      status: 'invoiced',
      invoiceNumber: invoice.number,
    });

    const receivable = store.list('cuentas-cobrar').find((row) => row.invoiceId === invoice.id);
    if (sale.paymentTerm === 'cash' && !receivable) return;
    if (!receivable) throw new Error('El comprobante a crédito no generó la cuenta por cobrar.');
    expect(receivable.balance).toBe(invoice.total);

    const account = bankAccount();
    const movement = business.createRecord(store, ctx, 'movimientos', {
      ...formFrom('movimientos', 'cuentas-cobrar', receivable),
      accountId: account.id,
    });
    expect(movement).toMatchObject({ type: 'income', amount: receivable.balance });
    expect(store.get('cuentas-cobrar', receivable.id)).toMatchObject({
      balance: 0,
      status: 'paid',
    });
    expect(store.get('cuentas-bancarias', account.id)?.balance).toBeCloseTo(
      account.balance + receivable.balance,
      2,
    );
  });
});

describe('ciclo de compras: orden → recepción → factura del proveedor → pago', () => {
  it('recibe una orden aprobada, registra su factura y la paga desde Tesorería', () => {
    const order = store.list('ordenes-compra').find((row) => row.status === 'approved');
    if (!order) throw new Error('La demo no tiene órdenes aprobadas.');

    const receipt = business.createRecord(store, ctx, 'recepciones', {
      ...formFrom('recepciones', 'ordenes-compra', order),
      guideNumber: 'T001-000456',
      lines: order.lines.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        sku: line.sku,
        quantity: line.quantity - line.receivedQuantity,
        unitPrice: line.unitPrice,
      })),
    });
    expect(receipt).toMatchObject({ purchaseOrderId: order.id, status: 'pending_bill' });
    expect(store.get('ordenes-compra', order.id)?.status).toBe('received');

    const bill = business.createRecord(store, ctx, 'facturas-proveedor', {
      ...formFrom('facturas-proveedor', 'recepciones', receipt),
      documentNumber: 'F900-000123',
    });
    expect(bill.subtotal).toBe(receipt.subtotal);
    expect(store.get('recepciones', receipt.id)?.status).toBe('billed');

    const payable = store.list('cuentas-pagar').find((row) => row.supplierInvoiceId === bill.id);
    if (!payable) throw new Error('La factura del proveedor no generó la cuenta por pagar.');
    expect(payable.balance).toBe(bill.total);

    const account = bankAccount();
    business.createRecord(store, ctx, 'movimientos', {
      ...formFrom('movimientos', 'cuentas-pagar', payable),
      accountId: account.id,
    });
    expect(store.get('cuentas-pagar', payable.id)).toMatchObject({ balance: 0, status: 'paid' });
    expect(store.get('cuentas-bancarias', account.id)?.balance).toBeCloseTo(
      account.balance - payable.balance,
      2,
    );
  });
});
