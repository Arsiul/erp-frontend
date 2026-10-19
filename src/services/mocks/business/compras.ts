import type { PurchaseLine, PurchaseOrder } from '@/types/compras';

import type { Store } from '../store';

import {
  addDays,
  fail,
  isoDate,
  optionalText,
  requireDate,
  requireNumber,
  requireText,
} from './context';
import { computeTotals, normalizeLines, totalsFromSubtotal } from './documents';
import { requireActive, requireRecord, type RecordInput, type ResourceRules } from './rules';
import { moveStock } from './stock';

const costPrice = (store: Store) => (productId: string) =>
  store.get('productos', productId)?.costPrice;

/** Recalcula lo recibido de cada línea y el estado de la orden a partir de sus recepciones vigentes. */
function refreshOrder(store: Store, order: PurchaseOrder): void {
  const received = new Map<string, number>();
  for (const receipt of store.list('recepciones')) {
    if (receipt.purchaseOrderId !== order.id || receipt.status === 'cancelled') continue;
    for (const line of receipt.lines)
      received.set(line.productId, (received.get(line.productId) ?? 0) + line.quantity);
  }
  const lines = order.lines.map((line) => ({
    ...line,
    receivedQuantity: received.get(line.productId) ?? 0,
  }));
  const total = lines.reduce((sum, line) => sum + line.receivedQuantity, 0);
  const complete = lines.every((line) => line.receivedQuantity >= line.quantity);
  store.update('ordenes-compra', order.id, {
    lines,
    status: complete ? 'received' : total > 0 ? 'partial' : 'approved',
  });
}

// ─── Órdenes de compra ─────────────────────────────────────────────────────────

function orderValues(store: Store, input: RecordInput<'ordenes-compra'>, today: string) {
  const supplier = requireActive(store, 'proveedores', input.supplierId, 'el proveedor');
  const warehouse = requireActive(store, 'almacenes', input.warehouseId, 'el almacén de destino');
  const issuedAt = requireDate(input.issuedAt, today);
  const expectedAt = requireDate(input.expectedAt, addDays(issuedAt, 7));
  if (expectedAt < issuedAt) fail('La recepción esperada no puede ser anterior a la emisión.');
  const lines: PurchaseLine[] = normalizeLines(store, input.lines, costPrice(store)).map(
    (line) => ({
      ...line,
      receivedQuantity: 0,
    }),
  );
  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    issuedAt,
    expectedAt,
    lines,
    ...computeTotals(lines, store.settings().igvRate),
    notes: optionalText(input.notes),
  };
}

const ordenesCompra: ResourceRules<'ordenes-compra'> = {
  create(store, ctx, input) {
    return store.insert('ordenes-compra', {
      number: store.nextNumber('ordenes-compra', 'OC-', 5),
      ...orderValues(store, input, isoDate(ctx.now)),
      status: 'draft',
    });
  },
  update(store, ctx, current, input) {
    if (current.status !== 'draft') fail('Solo se editan órdenes en borrador.');
    return store.update(
      'ordenes-compra',
      current.id,
      orderValues(store, { ...current, ...input }, isoDate(ctx.now)),
    );
  },
  remove(store, _ctx, current) {
    if (current.status !== 'draft') fail('Solo se eliminan órdenes en borrador; anula las demás.');
    store.remove('ordenes-compra', current.id);
  },
  actions: {
    approve: {
      label: 'Aprobó',
      run(store, _ctx, current) {
        if (current.status !== 'draft') fail('Solo se aprueban órdenes en borrador.');
        requireActive(store, 'proveedores', current.supplierId, 'el proveedor');
        store.update('ordenes-compra', current.id, { status: 'approved' });
      },
    },
    cancel: {
      label: 'Anuló',
      run(store, _ctx, current) {
        if (current.status !== 'draft' && current.status !== 'approved') {
          fail('La orden ya recibió mercadería o está cerrada; anula sus recepciones primero.');
        }
        store.update('ordenes-compra', current.id, { status: 'cancelled' });
      },
    },
  },
};

// ─── Recepciones ───────────────────────────────────────────────────────────────

const recepciones: ResourceRules<'recepciones'> = {
  create(store, ctx, input) {
    const order = requireRecord(
      store,
      'ordenes-compra',
      input.purchaseOrderId,
      'la orden de compra',
    );
    if (order.status !== 'approved' && order.status !== 'partial') {
      fail(`La orden ${order.number} no está aprobada o ya se recibió completa.`);
    }
    const warehouse = requireActive(
      store,
      'almacenes',
      order.warehouseId,
      'el almacén de la orden',
    );

    const ordered = new Map(order.lines.map((line) => [line.productId, line]));
    const rows = (Array.isArray(input.lines) ? input.lines : []).filter((row) => row.quantity > 0);
    // El precio de lo recibido es siempre el pactado en la orden.
    const lines = normalizeLines(
      store,
      rows.map((row) => ({ ...row, unitPrice: undefined })),
      (id) => ordered.get(id)?.unitPrice,
    ).map((line) => {
      const original = ordered.get(line.productId);
      if (!original) fail(`${line.productName} no está en la orden ${order.number}.`);
      const pending = original.quantity - original.receivedQuantity;
      if (line.quantity > pending)
        fail(`De ${line.productName} solo quedan ${pending} unidades por recibir.`);
      return line;
    });

    const receivedAt = requireDate(input.receivedAt, isoDate(ctx.now));
    if (receivedAt < order.issuedAt) fail('La recepción no puede ser anterior a la orden.');
    const number = store.nextNumber('recepciones', 'REC-', 5);
    for (const line of lines) {
      moveStock(store, ctx, {
        productId: line.productId,
        warehouseId: warehouse.id,
        quantity: line.quantity,
        origin: 'receipt',
        reference: number,
        unitCost: line.unitPrice,
      });
      store.update('productos', line.productId, { costPrice: line.unitPrice });
    }

    const receipt = store.insert('recepciones', {
      number,
      purchaseOrderId: order.id,
      purchaseOrderNumber: order.number,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      receivedAt,
      guideNumber: requireText(input.guideNumber, 'Escribe el número de la guía de remisión.'),
      lines,
      subtotal: computeTotals(lines, 0).subtotal,
      status: 'pending_bill',
      supplierInvoiceNumber: '',
    });
    refreshOrder(store, order);
    return receipt;
  },
  update(store, _ctx, current, input) {
    if (current.status === 'cancelled') fail('La recepción está anulada.');
    return store.update('recepciones', current.id, {
      guideNumber: requireText(
        input.guideNumber ?? current.guideNumber,
        'Escribe el número de la guía de remisión.',
      ),
    });
  },
  actions: {
    cancel: {
      label: 'Anuló',
      run(store, ctx, current) {
        if (current.status !== 'pending_bill') {
          fail('Solo se anulan recepciones sin facturar; anula la factura del proveedor primero.');
        }
        for (const line of current.lines) {
          moveStock(store, ctx, {
            productId: line.productId,
            warehouseId: current.warehouseId,
            quantity: -line.quantity,
            origin: 'receipt_cancel',
            reference: current.number,
          });
        }
        store.update('recepciones', current.id, { status: 'cancelled' });
        const order = store.get('ordenes-compra', current.purchaseOrderId);
        if (order) refreshOrder(store, order);
      },
    },
  },
};

// ─── Facturas de proveedor ─────────────────────────────────────────────────────

const facturasProveedor: ResourceRules<'facturas-proveedor'> = {
  create(store, ctx, input) {
    const receipt = input.receiptId
      ? requireRecord(store, 'recepciones', input.receiptId, 'la recepción')
      : undefined;
    if (receipt && receipt.status !== 'pending_bill')
      fail(`La recepción ${receipt.number} ya fue facturada o está anulada.`);

    const supplier = requireRecord(
      store,
      'proveedores',
      input.supplierId ?? receipt?.supplierId,
      'el proveedor',
    );
    if (receipt && receipt.supplierId !== supplier.id)
      fail('La factura debe ser del proveedor de la recepción.');

    const documentNumber = requireText(
      input.documentNumber,
      'Escribe el número de la factura del proveedor.',
    ).toUpperCase();
    const repeated = store
      .list('facturas-proveedor')
      .some(
        (row) =>
          row.supplierId === supplier.id &&
          row.documentNumber === documentNumber &&
          row.status !== 'cancelled',
      );
    if (repeated) fail(`Ya registraste la factura ${documentNumber} de ${supplier.name}.`);

    const subtotal = receipt
      ? receipt.subtotal
      : requireNumber(input.subtotal, 'Escribe el subtotal de la factura.');
    if (subtotal <= 0) fail('El subtotal debe ser mayor que cero.');
    const totals = totalsFromSubtotal(subtotal, store.settings().igvRate);

    const issuedAt = requireDate(input.issuedAt, isoDate(ctx.now));
    const dueAt = requireDate(input.dueAt, addDays(issuedAt, supplier.paymentDays));
    if (dueAt < issuedAt) fail('El vencimiento no puede ser anterior a la emisión.');

    const invoice = store.insert('facturas-proveedor', {
      documentNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      receiptId: receipt?.id ?? '',
      receiptNumber: receipt?.number ?? '',
      issuedAt,
      dueAt,
      ...totals,
      status: 'registered',
    });
    store.insert('cuentas-pagar', {
      supplierInvoiceId: invoice.id,
      documentNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      issuedAt,
      dueAt,
      amount: totals.total,
      paidAmount: 0,
      balance: totals.total,
      status: 'pending',
    });
    if (receipt)
      store.update('recepciones', receipt.id, {
        status: 'billed',
        supplierInvoiceNumber: documentNumber,
      });
    return invoice;
  },
  actions: {
    cancel: {
      label: 'Anuló',
      run(store, _ctx, current) {
        if (current.status !== 'registered') fail('La factura ya está anulada.');
        const payable = store
          .list('cuentas-pagar')
          .find((row) => row.supplierInvoiceId === current.id);
        if (payable && payable.paidAmount > 0)
          fail('La factura tiene pagos; anúlalos en Tesorería antes.');
        store.update('facturas-proveedor', current.id, { status: 'cancelled' });
        if (payable) store.update('cuentas-pagar', payable.id, { balance: 0, status: 'cancelled' });
        if (current.receiptId && store.get('recepciones', current.receiptId)) {
          store.update('recepciones', current.receiptId, {
            status: 'pending_bill',
            supplierInvoiceNumber: '',
          });
        }
      },
    },
  },
};

/** Las cuentas por pagar nacen de la factura del proveedor y se rebajan con los pagos. */
const cuentasPagar: ResourceRules<'cuentas-pagar'> = {};

export const comprasRules = {
  'ordenes-compra': ordenesCompra,
  recepciones,
  'facturas-proveedor': facturasProveedor,
  'cuentas-pagar': cuentasPagar,
};
