import type { DocumentLine, DocumentTotals } from '@/types/comercial';

import type { Store } from '../store';

import { fail, round2 } from './context';

/** Subtotal, IGV y total de un conjunto de líneas. */
export function computeTotals(lines: readonly DocumentLine[], igvRate: number): DocumentTotals {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  const igv = round2(subtotal * igvRate);
  return { subtotal, igv, total: round2(subtotal + igv) };
}

export function totalsFromSubtotal(subtotal: number, igvRate: number): DocumentTotals {
  const igv = round2(subtotal * igvRate);
  return { subtotal: round2(subtotal), igv, total: round2(subtotal + igv) };
}

/**
 * Valida las líneas que llegan del formulario y completa nombre y SKU desde el catálogo.
 * `priceOf` decide el precio cuando la línea no lo trae (precio de venta o costo).
 */
export function normalizeLines(
  store: Store,
  input: unknown,
  priceOf: (productId: string) => number | undefined = () => undefined,
): DocumentLine[] {
  const rows = Array.isArray(input) ? (input as Partial<DocumentLine>[]) : [];
  const lines = rows.filter((row) => row.productId);
  if (lines.length === 0) fail('Agrega al menos un producto.');

  const seen = new Set<string>();
  return lines.map((row) => {
    const product = store.get('productos', String(row.productId));
    if (!product) fail('Uno de los productos ya no existe.');
    if (seen.has(product.id))
      fail(`${product.name} está repetido; junta las cantidades en una línea.`);
    seen.add(product.id);

    const quantity = Number(row.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      fail(`La cantidad de ${product.name} debe ser un entero mayor que cero.`);
    }
    const unitPrice = row.unitPrice ?? priceOf(product.id);
    if (unitPrice === undefined || !Number.isFinite(unitPrice) || unitPrice < 0) {
      fail(`El precio de ${product.name} no es válido.`);
    }
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity,
      unitPrice: round2(unitPrice),
    };
  });
}

/** Estado de una cuenta por cobrar o pagar según su saldo. */
export function balanceStatus(amount: number, balance: number): 'pending' | 'partial' | 'paid' {
  if (balance <= 0) return 'paid';
  return balance < amount ? 'partial' : 'pending';
}
