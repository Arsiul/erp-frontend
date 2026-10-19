import type { DocumentLine, Invoice } from '@/types/comercial';

import type { Store } from '../store';

import { addDays, fail, isoDate, optionalText, requireDate, requireText, round2 } from './context';
import { balanceStatus, computeTotals, normalizeLines } from './documents';
import { pickEnum, requireActive, requireRecord, type ResourceRules } from './rules';
import { moveStock } from './stock';

const salePrice = (store: Store) => (productId: string) =>
  store.get('productos', productId)?.salePrice;

/** Deuda vigente del cliente: saldos por cobrar más ventas a crédito aún sin facturar. */
export function customerExposure(store: Store, customerId: string, exceptSaleId?: string): number {
  const receivables = store
    .list('cuentas-cobrar')
    .filter((row) => row.customerId === customerId && row.status !== 'cancelled')
    .reduce((sum, row) => sum + row.balance, 0);
  const unbilled = store
    .list('ventas')
    .filter(
      (row) =>
        row.customerId === customerId &&
        row.id !== exceptSaleId &&
        row.status === 'pending_invoice' &&
        row.paymentTerm === 'credit',
    )
    .reduce((sum, row) => sum + row.total, 0);
  return round2(receivables + unbilled);
}

// ─── Cotizaciones ──────────────────────────────────────────────────────────────

const cotizaciones: ResourceRules<'cotizaciones'> = {
  create(store, ctx, input) {
    const customer = requireActive(store, 'clientes', input.customerId, 'el cliente');
    const issuedAt = requireDate(input.issuedAt, isoDate(ctx.now));
    const lines = normalizeLines(store, input.lines, salePrice(store));
    return store.insert('cotizaciones', {
      number: store.nextNumber('cotizaciones', 'COT-', 5),
      customerId: customer.id,
      customerName: customer.name,
      issuedAt,
      validUntil: requireDate(
        input.validUntil,
        addDays(issuedAt, store.settings().quoteValidityDays),
      ),
      seller: requireText(input.seller, 'Elige el vendedor.'),
      lines,
      ...computeTotals(lines, store.settings().igvRate),
      status: 'draft',
      saleNumber: '',
      notes: optionalText(input.notes),
    });
  },
  update(store, _ctx, current, input) {
    if (current.status !== 'draft' && current.status !== 'sent') {
      fail('Solo se editan cotizaciones en borrador o enviadas.');
    }
    const customer =
      input.customerId && input.customerId !== current.customerId
        ? requireActive(store, 'clientes', input.customerId, 'el cliente')
        : { id: current.customerId, name: current.customerName };
    const issuedAt = requireDate(input.issuedAt, current.issuedAt);
    const validUntil = requireDate(input.validUntil, current.validUntil);
    if (validUntil < issuedAt) fail('La validez no puede ser anterior a la emisión.');
    const lines = input.lines
      ? normalizeLines(store, input.lines, salePrice(store))
      : current.lines;
    return store.update('cotizaciones', current.id, {
      customerId: customer.id,
      customerName: customer.name,
      issuedAt,
      validUntil,
      seller: requireText(input.seller ?? current.seller, 'Elige el vendedor.'),
      lines,
      ...computeTotals(lines, store.settings().igvRate),
      notes: optionalText(input.notes ?? current.notes),
    });
  },
  remove(store, _ctx, current) {
    if (current.status !== 'draft')
      fail('Solo se eliminan cotizaciones en borrador; rechaza las demás.');
    store.remove('cotizaciones', current.id);
  },
  actions: {
    send: {
      label: 'Envió',
      run(store, _ctx, current) {
        if (current.status !== 'draft') fail('Solo se envían cotizaciones en borrador.');
        store.update('cotizaciones', current.id, { status: 'sent' });
      },
    },
    accept: {
      label: 'Aceptó',
      run(store, ctx, current) {
        if (current.status !== 'draft' && current.status !== 'sent') {
          fail('Solo se aceptan cotizaciones en borrador o enviadas.');
        }
        if (current.validUntil < isoDate(ctx.now))
          fail('La cotización venció; actualiza su validez antes de aceptarla.');
        store.update('cotizaciones', current.id, { status: 'accepted' });
      },
    },
    reject: {
      label: 'Rechazó',
      run(store, _ctx, current) {
        if (current.status === 'converted' || current.status === 'rejected') {
          fail('La cotización ya está cerrada.');
        }
        store.update('cotizaciones', current.id, { status: 'rejected' });
      },
    },
  },
};

// ─── Ventas ────────────────────────────────────────────────────────────────────

const ventas: ResourceRules<'ventas'> = {
  create(store, ctx, input) {
    const quote = input.quoteId
      ? requireRecord(store, 'cotizaciones', input.quoteId, 'la cotización')
      : undefined;
    if (quote && quote.status !== 'accepted')
      fail(`La cotización ${quote.number} no está aceptada.`);

    const customer = requireActive(
      store,
      'clientes',
      input.customerId ?? quote?.customerId,
      'el cliente',
    );
    if (quote && quote.customerId !== customer.id)
      fail('La venta debe ser para el cliente de la cotización.');
    const warehouse = requireActive(
      store,
      'almacenes',
      input.warehouseId,
      'el almacén de despacho',
    );
    const lines = normalizeLines(store, input.lines ?? quote?.lines, salePrice(store));
    const totals = computeTotals(lines, store.settings().igvRate);

    const paymentTerm = pickEnum(
      input.paymentTerm,
      ['cash', 'credit'],
      'Elige la condición de pago.',
      'cash',
    );
    if (paymentTerm === 'credit') {
      if (customer.creditDays <= 0)
        fail(`${customer.name} no tiene crédito aprobado; véndele al contado.`);
      const available = round2(customer.creditLimit - customerExposure(store, customer.id));
      if (totals.total > available) {
        fail(
          `La venta supera el crédito disponible de ${customer.name} (S/ ${available.toFixed(2)}).`,
        );
      }
    }

    const number = store.nextNumber('ventas', 'VTA-', 5);
    for (const line of lines) {
      moveStock(store, ctx, {
        productId: line.productId,
        warehouseId: warehouse.id,
        quantity: -line.quantity,
        origin: 'sale',
        reference: number,
      });
    }
    if (quote) store.update('cotizaciones', quote.id, { status: 'converted', saleNumber: number });

    return store.insert('ventas', {
      number,
      customerId: customer.id,
      customerName: customer.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      quoteId: quote?.id ?? '',
      quoteNumber: quote?.number ?? '',
      issuedAt: requireDate(input.issuedAt, isoDate(ctx.now)),
      seller: requireText(input.seller ?? quote?.seller, 'Elige el vendedor.'),
      paymentTerm,
      lines,
      ...totals,
      status: 'pending_invoice',
      invoiceId: '',
      invoiceNumber: '',
      notes: optionalText(input.notes),
    });
  },
  /** Las líneas ya movieron stock: para cambiarlas se anula la venta y se registra otra. */
  update(store, _ctx, current, input) {
    if (current.status !== 'pending_invoice') fail('Solo se editan ventas pendientes de facturar.');
    const paymentTerm = pickEnum(
      input.paymentTerm,
      ['cash', 'credit'],
      'Elige la condición de pago.',
      current.paymentTerm,
    );
    if (paymentTerm === 'credit' && current.paymentTerm === 'cash') {
      const customer = requireRecord(store, 'clientes', current.customerId, 'el cliente');
      const available = round2(
        customer.creditLimit - customerExposure(store, customer.id, current.id),
      );
      if (customer.creditDays <= 0 || current.total > available) {
        fail(`${customer.name} no tiene crédito suficiente para esta venta.`);
      }
    }
    return store.update('ventas', current.id, {
      seller: requireText(input.seller ?? current.seller, 'Elige el vendedor.'),
      paymentTerm,
      notes: optionalText(input.notes ?? current.notes),
    });
  },
  actions: {
    cancel: {
      label: 'Anuló',
      run(store, ctx, current) {
        if (current.status !== 'pending_invoice') {
          fail(
            'Solo se anulan ventas sin facturar; para una facturada, anula el comprobante primero.',
          );
        }
        for (const line of current.lines) {
          moveStock(store, ctx, {
            productId: line.productId,
            warehouseId: current.warehouseId,
            quantity: line.quantity,
            origin: 'sale_cancel',
            reference: current.number,
          });
        }
        if (current.quoteId && store.get('cotizaciones', current.quoteId)) {
          store.update('cotizaciones', current.quoteId, { status: 'accepted', saleNumber: '' });
        }
        store.update('ventas', current.id, { status: 'cancelled' });
      },
    },
  },
};

// ─── Comprobantes ──────────────────────────────────────────────────────────────

function receivableOf(store: Store, invoice: Invoice) {
  const receivable = store.list('cuentas-cobrar').find((row) => row.invoiceId === invoice.id);
  if (!receivable) fail(`El comprobante ${invoice.number} no tiene cuenta por cobrar.`);
  return receivable;
}

const comprobantes: ResourceRules<'comprobantes'> = {
  create(store, ctx, input) {
    const sale = requireRecord(store, 'ventas', input.saleId, 'la venta a facturar');
    if (sale.status !== 'pending_invoice')
      fail(`La venta ${sale.number} ya fue facturada o está anulada.`);
    const customer = requireRecord(store, 'clientes', sale.customerId, 'el cliente');

    const kind = pickEnum(
      input.kind,
      ['factura', 'boleta'],
      'Elige factura o boleta.',
      customer.documentType === 'RUC' ? 'factura' : 'boleta',
    );
    if (kind === 'factura' && customer.documentType !== 'RUC') {
      fail('La factura exige un cliente con RUC; emite una boleta.');
    }

    const issuedAt = requireDate(input.issuedAt, isoDate(ctx.now));
    if (issuedAt < sale.issuedAt) fail('El comprobante no puede ser anterior a la venta.');
    const dueAt = sale.paymentTerm === 'credit' ? addDays(issuedAt, customer.creditDays) : issuedAt;

    const settings = store.settings();
    const series = kind === 'factura' ? settings.invoiceSeries : settings.receiptSeries;
    const number = store.nextNumber(`serie:${series}`, `${series}-`, 8);

    const invoice = store.insert('comprobantes', {
      kind,
      number,
      saleId: sale.id,
      saleNumber: sale.number,
      customerId: customer.id,
      customerName: customer.name,
      customerDocument: `${customer.documentType} ${customer.documentNumber}`,
      warehouseId: sale.warehouseId,
      issuedAt,
      dueAt,
      lines: sale.lines,
      subtotal: sale.subtotal,
      igv: sale.igv,
      total: sale.total,
      creditedAmount: 0,
      status: 'issued',
    });
    store.insert('cuentas-cobrar', {
      invoiceId: invoice.id,
      documentNumber: number,
      customerId: customer.id,
      customerName: customer.name,
      issuedAt,
      dueAt,
      amount: invoice.total,
      paidAmount: 0,
      creditedAmount: 0,
      balance: invoice.total,
      status: 'pending',
    });
    store.update('ventas', sale.id, {
      status: 'invoiced',
      invoiceId: invoice.id,
      invoiceNumber: number,
    });
    return invoice;
  },
  actions: {
    cancel: {
      label: 'Anuló',
      run(store, _ctx, current) {
        if (current.status !== 'issued') fail('El comprobante ya está anulado.');
        const receivable = receivableOf(store, current);
        if (receivable.paidAmount > 0)
          fail('El comprobante tiene cobros; anúlalos en Tesorería antes.');
        if (current.creditedAmount > 0)
          fail('El comprobante tiene notas de crédito; ya no se puede anular.');
        store.update('comprobantes', current.id, { status: 'cancelled' });
        store.update('cuentas-cobrar', receivable.id, { balance: 0, status: 'cancelled' });
        if (store.get('ventas', current.saleId)) {
          store.update('ventas', current.saleId, {
            status: 'pending_invoice',
            invoiceId: '',
            invoiceNumber: '',
          });
        }
      },
    },
  },
};

// ─── Notas de crédito ──────────────────────────────────────────────────────────

/** Unidades de cada producto ya acreditadas en notas anteriores del comprobante. */
function creditedQuantities(store: Store, invoiceId: string): Map<string, number> {
  const credited = new Map<string, number>();
  for (const note of store.list('notas-credito').filter((row) => row.invoiceId === invoiceId)) {
    for (const line of note.lines)
      credited.set(line.productId, (credited.get(line.productId) ?? 0) + line.quantity);
  }
  return credited;
}

const notasCredito: ResourceRules<'notas-credito'> = {
  create(store, ctx, input) {
    const invoice = requireRecord(store, 'comprobantes', input.invoiceId, 'el comprobante');
    if (invoice.status !== 'issued') fail(`El comprobante ${invoice.number} está anulado.`);
    const receivable = receivableOf(store, invoice);
    const reason = pickEnum(input.reason, ['return', 'discount', 'error'], 'Elige el motivo.');

    const invoiced = new Map(invoice.lines.map((line) => [line.productId, line]));
    const credited = creditedQuantities(store, invoice.id);
    const rows = (Array.isArray(input.lines) ? input.lines : []).filter((row) => row.quantity > 0);
    const lines: DocumentLine[] = normalizeLines(
      store,
      rows,
      (id) => invoiced.get(id)?.unitPrice,
    ).map((line) => {
      const original = invoiced.get(line.productId);
      if (!original) fail(`${line.productName} no está en el comprobante ${invoice.number}.`);
      const available = original.quantity - (credited.get(line.productId) ?? 0);
      if (line.quantity > available)
        fail(`De ${line.productName} solo quedan ${available} unidades por acreditar.`);
      if (line.unitPrice > original.unitPrice)
        fail(`El precio de ${line.productName} supera el facturado.`);
      return line;
    });

    const totals = computeTotals(lines, store.settings().igvRate);
    if (totals.total > receivable.balance) {
      fail(
        `La nota (S/ ${totals.total.toFixed(2)}) supera el saldo por cobrar (S/ ${receivable.balance.toFixed(2)}).`,
      );
    }

    const baseSeries = store.settings().creditNoteSeries;
    const series = invoice.kind === 'factura' ? baseSeries : baseSeries.replace(/^F/, 'B');
    const number = store.nextNumber(`serie:${series}`, `${series}-`, 8);
    const warehouse = store.get('almacenes', invoice.warehouseId);

    if (reason === 'return') {
      if (!warehouse) fail('El almacén del comprobante ya no existe.');
      for (const line of lines) {
        moveStock(store, ctx, {
          productId: line.productId,
          warehouseId: warehouse.id,
          quantity: line.quantity,
          origin: 'credit_note',
          reference: number,
        });
      }
    }

    const balance = round2(receivable.balance - totals.total);
    store.update('cuentas-cobrar', receivable.id, {
      creditedAmount: round2(receivable.creditedAmount + totals.total),
      balance,
      status: balanceStatus(receivable.amount, balance),
    });
    store.update('comprobantes', invoice.id, {
      creditedAmount: round2(invoice.creditedAmount + totals.total),
    });

    return store.insert('notas-credito', {
      number,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      warehouseId: invoice.warehouseId,
      warehouseName: warehouse?.name ?? '',
      issuedAt: requireDate(input.issuedAt, isoDate(ctx.now)),
      reason,
      lines,
      ...totals,
      notes: optionalText(input.notes),
    });
  },
};

/** Las cuentas por cobrar nacen del comprobante y se mueven con cobros y notas de crédito. */
const cuentasCobrar: ResourceRules<'cuentas-cobrar'> = {};

export const comercialRules = {
  cotizaciones,
  ventas,
  comprobantes,
  'notas-credito': notasCredito,
  'cuentas-cobrar': cuentasCobrar,
};
