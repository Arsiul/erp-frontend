import type { Customer, Product, Supplier, Warehouse } from '@/types/maestros';
import type { BankAccount } from '@/types/tesoreria';

import { createRecord, runAction, type BusinessContext, type RecordInput } from '../business';
import { customerExposure } from '../business/comercial';
import { isoDateTime, round2 } from '../business/context';
import { computeTotals } from '../business/documents';
import { moveStock, stockId } from '../business/stock';
import { createStore, type MockDatabase } from '../store';

import { BASE_USERS, baseDatabase } from './base';

/** La semilla arma la demo sobre sus propios catálogos: si falta uno, es un error de la semilla. */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`La semilla no tiene ${what}.`);
  return value;
}

/** Días de historia que se simulan hasta hoy. */
const HISTORY_DAYS = 180;
const SEED = 20260418;

type Actor = 'usr-admin' | 'usr-ventas' | 'usr-compras' | 'usr-tesoreria';

interface LineInput {
  productId: string;
  quantity: number;
}

// ─── Catálogo de partida ───────────────────────────────────────────────────────

const CATEGORIES: RecordInput<'categorias'>[] = [
  { name: 'Laptops', description: 'Equipos portátiles para oficina y uso profesional.' },
  { name: 'Monitores', description: 'Pantallas para estaciones de trabajo.' },
  { name: 'Periféricos', description: 'Teclados, mouse, cámaras y audio.' },
  { name: 'Redes', description: 'Routers, switches y conectividad.' },
  { name: 'Almacenamiento', description: 'Discos sólidos y externos.' },
];

/** `category` y `supplier` son posiciones en CATEGORIES y SUPPLIERS. */
const PRODUCTS = [
  {
    sku: 'LAP-001',
    name: 'Laptop 14" Core i5 16 GB',
    category: 0,
    supplier: 0,
    salePrice: 3299,
    costPrice: 2650,
    minStock: 5,
  },
  {
    sku: 'LAP-002',
    name: 'Laptop 15.6" Ryzen 7 32 GB',
    category: 0,
    supplier: 0,
    salePrice: 4590,
    costPrice: 3720,
    minStock: 3,
  },
  {
    sku: 'MON-001',
    name: 'Monitor 24" IPS Full HD',
    category: 1,
    supplier: 1,
    salePrice: 589,
    costPrice: 430,
    minStock: 8,
  },
  {
    sku: 'MON-002',
    name: 'Monitor 27" QHD 165 Hz',
    category: 1,
    supplier: 1,
    salePrice: 1290,
    costPrice: 980,
    minStock: 4,
  },
  {
    sku: 'PER-001',
    name: 'Teclado mecánico inalámbrico',
    category: 2,
    supplier: 2,
    salePrice: 249,
    costPrice: 160,
    minStock: 15,
  },
  {
    sku: 'PER-002',
    name: 'Mouse ergonómico inalámbrico',
    category: 2,
    supplier: 2,
    salePrice: 119,
    costPrice: 68,
    minStock: 20,
  },
  {
    sku: 'PER-003',
    name: 'Webcam Full HD con micrófono',
    category: 2,
    supplier: 2,
    salePrice: 199,
    costPrice: 128,
    minStock: 10,
  },
  {
    sku: 'PER-004',
    name: 'Audífonos con cancelación de ruido',
    category: 2,
    supplier: 2,
    salePrice: 459,
    costPrice: 320,
    minStock: 8,
  },
  {
    sku: 'RED-001',
    name: 'Router Wi-Fi 6 doble banda',
    category: 3,
    supplier: 3,
    salePrice: 389,
    costPrice: 265,
    minStock: 6,
  },
  {
    sku: 'RED-002',
    name: 'Switch 24 puertos gigabit',
    category: 3,
    supplier: 3,
    salePrice: 899,
    costPrice: 640,
    minStock: 3,
  },
  {
    sku: 'SSD-001',
    name: 'SSD NVMe 1 TB',
    category: 4,
    supplier: 1,
    salePrice: 329,
    costPrice: 230,
    minStock: 12,
  },
  {
    sku: 'HDD-001',
    name: 'Disco externo 2 TB USB-C',
    category: 4,
    supplier: 1,
    salePrice: 349,
    costPrice: 245,
    minStock: 10,
  },
] as const;

const WAREHOUSES: RecordInput<'almacenes'>[] = [
  { name: 'Almacén Central', address: 'Av. Nicolás Ayllón 2480, Ate', manager: 'Jorge Salazar' },
  { name: 'Tienda Miraflores', address: 'Av. Larco 615, Miraflores', manager: 'Lucía Paredes' },
];

const CUSTOMERS: RecordInput<'clientes'>[] = [
  {
    name: 'Corporación Minera del Sur S.A.C.',
    documentType: 'RUC',
    documentNumber: '20512345678',
    email: 'compras@minerasur.demo',
    phone: '054 281 400',
    address: 'Calle Mercaderes 212, Arequipa',
    creditDays: 30,
    creditLimit: 60000,
  },
  {
    name: 'Clínica San Gabriel S.A.',
    documentType: 'RUC',
    documentNumber: '20487654321',
    email: 'logistica@sangabriel.demo',
    phone: '01 614 9000',
    address: 'Av. Javier Prado Este 1066, San Isidro',
    creditDays: 30,
    creditLimit: 40000,
  },
  {
    name: 'Estudio Contable Rivera & Asociados S.R.L.',
    documentType: 'RUC',
    documentNumber: '20601122334',
    email: 'administracion@riveraasociados.demo',
    phone: '01 422 3185',
    address: 'Jr. Huancavelica 340, Cercado de Lima',
    creditDays: 15,
    creditLimit: 15000,
  },
  {
    name: 'Colegio Santa Rosa de los Andes S.A.C.',
    documentType: 'RUC',
    documentNumber: '20556677889',
    email: 'tesoreria@santarosaandes.demo',
    phone: '01 348 2210',
    address: 'Av. Los Próceres 870, Santiago de Surco',
    creditDays: 30,
    creditLimit: 25000,
  },
  {
    name: 'Constructora Huallaga E.I.R.L.',
    documentType: 'RUC',
    documentNumber: '20609988776',
    email: 'pagos@huallaga.demo',
    phone: '062 513 377',
    address: 'Jr. Dos de Mayo 1140, Huánuco',
    creditDays: 45,
    creditLimit: 50000,
  },
  {
    name: 'Ana María Torres Vega',
    documentType: 'RUC',
    documentNumber: '10456789012',
    email: 'atorres.diseno@correo.demo',
    phone: '987 654 321',
    address: 'Calle Las Begonias 155, Lince',
    creditDays: 15,
    creditLimit: 8000,
  },
  {
    name: 'Carlos Mendoza Ríos',
    documentType: 'DNI',
    documentNumber: '45678912',
    email: 'cmendoza@correo.demo',
    phone: '956 112 448',
    address: '',
    creditDays: 0,
    creditLimit: 0,
  },
  {
    name: 'Rosa Huamán Paucar',
    documentType: 'DNI',
    documentNumber: '70123456',
    email: '',
    phone: '943 778 015',
    address: '',
    creditDays: 0,
    creditLimit: 0,
  },
];

/** Peso de cada cliente al elegir quién compra. */
const CUSTOMER_WEIGHTS = [5, 3, 2, 3, 3, 2, 3, 3];
/** El cliente que paga tarde: deja cuentas vencidas en la demo. */
const LATE_PAYER = 4;

const SUPPLIERS: RecordInput<'proveedores'>[] = [
  {
    name: 'TecnoImport Perú S.A.C.',
    ruc: '20545678901',
    contactName: 'Raúl Cárdenas',
    email: 'ventas@tecnoimport.demo',
    phone: '01 705 3300',
    address: 'Av. Argentina 3093, Callao',
    paymentDays: 30,
  },
  {
    name: 'Distribuidora Visual Andina S.A.C.',
    ruc: '20567890123',
    contactName: 'Patricia Linares',
    email: 'pedidos@visualandina.demo',
    phone: '01 440 7812',
    address: 'Av. República de Panamá 4575, Surquillo',
    paymentDays: 30,
  },
  {
    name: 'Periféricos del Pacífico S.R.L.',
    ruc: '20578901234',
    contactName: 'Diego Ramírez',
    email: 'comercial@perifericospacifico.demo',
    phone: '01 330 9120',
    address: 'Jr. Paruro 1386, Cercado de Lima',
    paymentDays: 15,
  },
  {
    name: 'Redes Integrales S.A.C.',
    ruc: '20589012345',
    contactName: 'Milagros Ochoa',
    email: 'ventas@redesintegrales.demo',
    phone: '01 717 4466',
    address: 'Av. Angamos Este 1551, Surquillo',
    paymentDays: 45,
  },
];

const ACCOUNTS: RecordInput<'cuentas-bancarias'>[] = [
  {
    bank: 'BCP',
    name: 'BCP Cta. Cte. Soles',
    accountNumber: '193-2045678-0-12',
    openingBalance: 180000,
  },
  {
    bank: 'Interbank',
    name: 'Interbank Cta. Cte. Soles',
    accountNumber: '200-3001234567',
    openingBalance: 90000,
  },
  { bank: 'Efectivo', name: 'Caja tienda', accountNumber: 'CAJA-01', openingBalance: 3000 },
];

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// ─── Utilidades ────────────────────────────────────────────────────────────────

/** PRNG con semilla fija: la demo sale igual en cada reinicio. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Las líneas del formulario solo traen producto y cantidad; la regla completa el resto. */
function asLines<T>(rows: readonly LineInput[]): T[] {
  return rows as unknown as T[];
}

function textFile(fileName: string, text: string) {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return {
    fileName,
    mimeType: 'text/plain',
    fileSize: bytes.length,
    content: `data:text/plain;base64,${btoa(binary)}`,
  };
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/**
 * Arma la base demo recorriendo 180 días de operación con las mismas reglas que usa la interfaz:
 * cotizaciones, ventas, comprobantes, cobros, compras, recepciones, pagos e inventario.
 * Antes de cada operación se comprueba lo que la regla exigiría (stock, crédito, saldo); si aun así
 * una regla falla es un error de la semilla y se deja propagar.
 */
export function buildDemoDatabase(today: Date = new Date()): MockDatabase {
  const db = baseDatabase();
  const store = createStore(db);
  const random = mulberry32(SEED);
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const chance = (probability: number) => random() < probability;
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;

  // ─── Reloj: cada operación del día avanza unos minutos ───────────────────────

  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const usedMinutes = new Map<number, number>();
  const users = new Map(BASE_USERS.map((user) => [user.id, user]));

  const dateOf = (day: number) =>
    new Date(midnight.getFullYear(), midnight.getMonth(), midnight.getDate() + day);
  const dayOf = (iso: string) => {
    const [year = 0, month = 1, date = 1] = iso.split('-').map(Number);
    return Math.round(
      (new Date(year, month - 1, date).getTime() - midnight.getTime()) / 86_400_000,
    );
  };

  function ctxAt(day: number, actor: Actor): BusinessContext {
    const minutes = usedMinutes.get(day) ?? 0;
    usedMinutes.set(day, minutes + int(4, 12));
    const base = dateOf(day);
    let now = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 8, 30 + minutes);
    if (now > today) now = new Date(today);
    const user = users.get(actor);
    return { userId: actor, userName: user?.name ?? actor, now };
  }

  // ─── Agenda: lo que cae después de hoy no se ejecuta y queda pendiente ───────

  const agenda = new Map<number, (() => void)[]>();
  let currentDay = -HISTORY_DAYS;
  function at(day: number, task: () => void): void {
    const when = Math.max(day, currentDay);
    if (when > 0) return;
    const tasks = agenda.get(when) ?? [];
    tasks.push(task);
    agenda.set(when, tasks);
  }

  // ─── Maestros ────────────────────────────────────────────────────────────────

  const setupDay = -HISTORY_DAYS;
  const adminCtx = () => ctxAt(setupDay, 'usr-admin');

  const warehouses: Warehouse[] = WAREHOUSES.map((input) =>
    createRecord(store, adminCtx(), 'almacenes', input),
  );
  const [central, shop] = warehouses as [Warehouse, Warehouse];
  const categories = CATEGORIES.map((input) =>
    createRecord(store, adminCtx(), 'categorias', input),
  );
  const products: Product[] = PRODUCTS.map((item) =>
    createRecord(store, adminCtx(), 'productos', {
      sku: item.sku,
      name: item.name,
      categoryId: categories[item.category]?.id,
      unit: 'UND',
      salePrice: item.salePrice,
      costPrice: item.costPrice,
      minStock: item.minStock,
    }),
  );
  const customers: Customer[] = CUSTOMERS.map((input) =>
    createRecord(store, adminCtx(), 'clientes', input),
  );
  const suppliers: Supplier[] = SUPPLIERS.map((input) =>
    createRecord(store, adminCtx(), 'proveedores', input),
  );
  const accounts: BankAccount[] = ACCOUNTS.map((input) =>
    createRecord(store, adminCtx(), 'cuentas-bancarias', input),
  );
  const [bcp, interbank, cashBox] = accounts as [BankAccount, BankAccount, BankAccount];

  const supplierOf = new Map(
    PRODUCTS.map((item, index) => [products[index]?.id ?? '', item.supplier]),
  );
  const igvRate = store.settings().igvRate;

  const stockOf = (productId: string, warehouseId: string) =>
    store.get('stock', stockId(productId, warehouseId))?.quantity ?? 0;
  const balanceOf = (account: BankAccount) =>
    store.get('cuentas-bancarias', account.id)?.balance ?? 0;
  const productById = (id: string) => products.find((product) => product.id === id);

  // Stock inicial al costo.
  const initialCtx = ctxAt(setupDay, 'usr-compras');
  for (const product of products) {
    for (const [warehouse, factor] of [
      [central, 6],
      [shop, 2],
    ] as const) {
      moveStock(store, initialCtx, {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: product.minStock * factor + int(0, product.minStock),
        origin: 'initial',
        reference: 'Inventario inicial',
        unitCost: product.costPrice,
      });
    }
  }

  function addDocument(
    day: number,
    actor: Actor,
    input: RecordInput<'documentos'> & { text: string },
  ): void {
    const { text, ...values } = input;
    createRecord(store, ctxAt(day, actor), 'documentos', {
      ...values,
      ...textFile(`${values.name ?? 'documento'}.txt`, text),
    });
  }

  addDocument(setupDay, 'usr-admin', {
    name: 'Contrato marco de suministro',
    category: 'contract',
    linkedResource: 'clientes',
    linkedId: customers[0]?.id,
    text: 'Contrato marco de suministro de equipos de cómputo.\nVigencia: 12 meses.\nCrédito: 30 días.',
  });
  addDocument(setupDay, 'usr-admin', {
    name: 'Política de créditos y cobranzas',
    category: 'other',
    text: 'Clientes con RUC: crédito de 15 a 45 días según evaluación.\nClientes con DNI: solo contado.',
  });

  // ─── Comercial: cotización → venta → comprobante → cobro ─────────────────────

  function pickCustomer(): Customer {
    const total = CUSTOMER_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
    let roll = random() * total;
    for (const [index, weight] of CUSTOMER_WEIGHTS.entries()) {
      roll -= weight;
      if (roll < 0) return must(customers[index], 'el cliente sorteado');
    }
    return must(customers[0], 'clientes');
  }

  /** Productos y cantidades de un pedido; con almacén, se ajustan al stock disponible. */
  function planLines(customer: Customer, warehouseId?: string): LineInput[] {
    const business = customer.documentType === 'RUC';
    const chosen = new Set<Product>();
    const count = business ? int(1, 3) : int(1, 2);
    while (chosen.size < count) chosen.add(pick(products));

    const lines: LineInput[] = [];
    for (const product of chosen) {
      const big = product.salePrice > 1000;
      let quantity = business ? int(1, big ? 3 : 6) : int(1, big ? 1 : 2);
      if (warehouseId) quantity = Math.min(quantity, stockOf(product.id, warehouseId));
      if (quantity > 0) lines.push({ productId: product.id, quantity });
    }
    return lines;
  }

  const fitsStock = (lines: readonly LineInput[], warehouseId: string) =>
    lines.every((line) => line.quantity <= stockOf(line.productId, warehouseId));

  function totalOf(lines: readonly LineInput[]): number {
    const priced = lines.map((line) => {
      const product = productById(line.productId);
      return {
        productId: line.productId,
        productName: product?.name ?? '',
        sku: product?.sku ?? '',
        quantity: line.quantity,
        unitPrice: product?.salePrice ?? 0,
      };
    });
    return computeTotals(priced, igvRate).total;
  }

  /** Crédito si el cliente lo tiene y le alcanza; si no, contado. */
  function termFor(customer: Customer, total: number): 'cash' | 'credit' {
    if (customer.creditDays <= 0 || !chance(0.75)) return 'cash';
    const available = round2(customer.creditLimit - customerExposure(store, customer.id));
    return total <= available ? 'credit' : 'cash';
  }

  function afterSale(day: number, saleId: string): void {
    if (chance(0.03)) {
      runAction(store, ctxAt(day, 'usr-ventas'), 'ventas', saleId, 'cancel');
      return;
    }
    const invoiceDay = chance(0.7) ? day : day + 1;
    at(invoiceDay, () => {
      invoiceSale(invoiceDay, saleId);
    });
  }

  function directSale(day: number, customer: Customer): void {
    const warehouse = customer.documentType === 'RUC' && chance(0.85) ? central : shop;
    const lines = planLines(customer, warehouse.id);
    if (lines.length === 0) return;
    const sale = createRecord(store, ctxAt(day, 'usr-ventas'), 'ventas', {
      customerId: customer.id,
      warehouseId: warehouse.id,
      lines: asLines(lines),
      paymentTerm: termFor(customer, totalOf(lines)),
      seller: 'Lucía Paredes',
    });
    afterSale(day, sale.id);
  }

  function quoteSale(day: number, customer: Customer): void {
    const lines = planLines(customer);
    const quote = createRecord(store, ctxAt(day, 'usr-ventas'), 'cotizaciones', {
      customerId: customer.id,
      lines: asLines(lines),
      seller: 'Lucía Paredes',
    });
    runAction(store, ctxAt(day, 'usr-ventas'), 'cotizaciones', quote.id, 'send');

    const decisionDay = day + int(1, 4);
    at(decisionDay, () => {
      const current = store.get('cotizaciones', quote.id);
      if (current?.status !== 'sent') return;
      const roll = random();
      if (roll < 0.12) return; // Sin respuesta: queda enviada hasta vencer.
      if (roll < 0.3 || !fitsStock(current.lines, central.id)) {
        runAction(store, ctxAt(decisionDay, 'usr-ventas'), 'cotizaciones', quote.id, 'reject');
        return;
      }
      runAction(store, ctxAt(decisionDay, 'usr-ventas'), 'cotizaciones', quote.id, 'accept');
      const sale = createRecord(store, ctxAt(decisionDay, 'usr-ventas'), 'ventas', {
        quoteId: quote.id,
        warehouseId: central.id,
        paymentTerm: termFor(customer, current.total),
      });
      afterSale(decisionDay, sale.id);
    });
  }

  const receivableOf = (invoiceId: string) =>
    store.list('cuentas-cobrar').find((row) => row.invoiceId === invoiceId);

  function invoiceSale(day: number, saleId: string): void {
    const sale = store.get('ventas', saleId);
    if (sale?.status !== 'pending_invoice') return;
    const invoice = createRecord(store, ctxAt(day, 'usr-ventas'), 'comprobantes', { saleId });
    const receivable = receivableOf(invoice.id);
    if (!receivable) return;

    if (sale.paymentTerm === 'cash') {
      const inCash = invoice.kind === 'boleta' || chance(0.3);
      at(day, () => {
        collect(day, receivable.id, 1, inCash ? cashBox : bcp);
      });
      return;
    }

    if (chance(0.06)) {
      const noteDay = day + int(2, 6);
      at(noteDay, () => {
        creditNote(noteDay, invoice.id);
      });
    }

    const late = sale.customerId === customers[LATE_PAYER]?.id;
    if (chance(late ? 0.2 : 0.06)) return; // Nunca se cobra: queda vencida.
    const dueDay = dayOf(invoice.dueAt);
    const account = chance(0.6) ? bcp : interbank;
    if (chance(0.15)) {
      const firstDay = dueDay - int(2, 8);
      const restDay = dueDay + int(3, 15);
      at(firstDay, () => {
        collect(firstDay, receivable.id, 0.5, account);
      });
      at(restDay, () => {
        collect(restDay, receivable.id, 1, account);
      });
      return;
    }
    const payDay = dueDay + (late ? int(5, 30) : int(-6, 4));
    at(payDay, () => {
      collect(payDay, receivable.id, 1, account);
    });
  }

  function collect(
    day: number,
    receivableId: string,
    fraction: number,
    account: BankAccount,
  ): void {
    const receivable = store.get('cuentas-cobrar', receivableId);
    if (!receivable || receivable.status === 'cancelled' || receivable.balance <= 0) return;
    createRecord(store, ctxAt(day, 'usr-tesoreria'), 'movimientos', {
      accountId: account.id,
      concept: 'collection',
      amount: round2(receivable.balance * fraction),
      receivableId,
      method: account.id === cashBox.id ? 'cash' : 'transfer',
    });
  }

  function creditNote(day: number, invoiceId: string): void {
    const invoice = store.get('comprobantes', invoiceId);
    const receivable = receivableOf(invoiceId);
    const line = invoice?.lines[0];
    if (!invoice || !receivable || !line || invoice.status !== 'issued') return;
    if (computeTotals([{ ...line, quantity: 1 }], igvRate).total > receivable.balance) return;
    createRecord(store, ctxAt(day, 'usr-ventas'), 'notas-credito', {
      invoiceId,
      reason: 'return',
      lines: asLines([{ productId: line.productId, quantity: 1 }]),
      notes: 'Devolución por falla de fábrica dentro de la garantía.',
    });
  }

  // ─── Compras: orden → aprobación → recepción → factura → pago ────────────────

  let guideCounter = 0;
  const supplierInvoiceCounter = suppliers.map(() => 0);
  let documentedReceipts = 0;

  /** Unidades ya pedidas y por llegar, para no volver a pedirlas. */
  function inbound(productId: string): number {
    return store
      .list('ordenes-compra')
      .filter((order) => order.status === 'approved' || order.status === 'partial')
      .flatMap((order) => order.lines)
      .filter((line) => line.productId === productId)
      .reduce((sum, line) => sum + line.quantity - line.receivedQuantity, 0);
  }

  function replenish(day: number): void {
    suppliers.forEach((supplier, index) => {
      const lines: LineInput[] = [];
      for (const product of products.filter((row) => supplierOf.get(row.id) === index)) {
        const projected = stockOf(product.id, central.id) + inbound(product.id);
        if (projected < product.minStock * 3) {
          lines.push({ productId: product.id, quantity: product.minStock * 6 - projected });
        }
      }
      if (lines.length === 0) return;

      const ctx = ctxAt(day, 'usr-compras');
      const order = createRecord(store, ctx, 'ordenes-compra', {
        supplierId: supplier.id,
        warehouseId: central.id,
        lines: asLines(lines),
      });
      if (chance(0.05)) {
        runAction(store, ctxAt(day, 'usr-compras'), 'ordenes-compra', order.id, 'cancel');
        return;
      }
      runAction(store, ctxAt(day, 'usr-compras'), 'ordenes-compra', order.id, 'approve');
      const receiveDay = day + int(3, 6);
      at(receiveDay, () => {
        receive(receiveDay, order.id, chance(0.2));
      });
    });
  }

  function receive(day: number, orderId: string, partial: boolean): void {
    const order = store.get('ordenes-compra', orderId);
    if (!order || (order.status !== 'approved' && order.status !== 'partial')) return;
    const lines = order.lines
      .map((line) => {
        const pending = line.quantity - line.receivedQuantity;
        return {
          productId: line.productId,
          quantity: partial ? Math.ceil(pending * 0.6) : pending,
        };
      })
      .filter((line) => line.quantity > 0);
    if (lines.length === 0) return;

    guideCounter += 1;
    const receipt = createRecord(store, ctxAt(day, 'usr-compras'), 'recepciones', {
      purchaseOrderId: orderId,
      lines: asLines(lines),
      guideNumber: `EG01-${pad(guideCounter, 6)}`,
    });
    if (documentedReceipts < 3) {
      documentedReceipts += 1;
      addDocument(day, 'usr-compras', {
        name: `Guía de remisión ${receipt.guideNumber}`,
        category: 'guide',
        linkedResource: 'recepciones',
        linkedId: receipt.id,
        text: `Guía ${receipt.guideNumber}\nProveedor: ${receipt.supplierName}\nOrden: ${receipt.purchaseOrderNumber}`,
      });
    }
    if (partial)
      at(day + 3, () => {
        receive(day + 3, orderId, false);
      });
    const billDay = day + int(0, 2);
    at(billDay, () => {
      bill(billDay, receipt.id);
    });
  }

  function bill(day: number, receiptId: string): void {
    const receipt = store.get('recepciones', receiptId);
    if (receipt?.status !== 'pending_bill') return;
    const index = suppliers.findIndex((supplier) => supplier.id === receipt.supplierId);
    supplierInvoiceCounter[index] = (supplierInvoiceCounter[index] ?? 0) + 1;
    const invoice = createRecord(store, ctxAt(day, 'usr-compras'), 'facturas-proveedor', {
      receiptId,
      documentNumber: `F${pad(index + 1, 3)}-${pad(supplierInvoiceCounter[index] ?? 0, 6)}`,
    });
    const payable = store.list('cuentas-pagar').find((row) => row.supplierInvoiceId === invoice.id);
    if (!payable) return;

    const dueDay = dayOf(invoice.dueAt);
    if (chance(0.1)) {
      const firstDay = dueDay - int(1, 5);
      at(firstDay, () => {
        pay(firstDay, payable.id, 0.5);
      });
      at(dueDay + 7, () => {
        pay(dueDay + 7, payable.id, 1);
      });
      return;
    }
    const payDay = dueDay + int(-4, 1);
    at(payDay, () => {
      pay(payDay, payable.id, 1);
    });
  }

  /** Paga desde la cuenta que tenga fondos (dejando un colchón); si ninguna, reintenta en 3 días. */
  function pay(day: number, payableId: string, fraction: number): void {
    const payable = store.get('cuentas-pagar', payableId);
    if (!payable || payable.status === 'cancelled' || payable.balance <= 0) return;
    const amount = round2(payable.balance * fraction);
    const account = [bcp, interbank].find((row) => balanceOf(row) - amount >= 5000);
    if (!account) {
      at(day + 3, () => {
        pay(day + 3, payableId, fraction);
      });
      return;
    }
    createRecord(store, ctxAt(day, 'usr-tesoreria'), 'movimientos', {
      accountId: account.id,
      concept: 'payment',
      amount,
      payableId,
      method: 'transfer',
    });
  }

  // ─── Inventario y tesorería del día a día ────────────────────────────────────

  function restockShop(day: number): void {
    let made = 0;
    for (const product of products) {
      if (made >= 3) return;
      const inShop = stockOf(product.id, shop.id);
      if (inShop >= product.minStock) continue;
      const quantity = product.minStock * 2 - inShop;
      if (stockOf(product.id, central.id) - quantity < product.minStock) continue;
      const transfer = createRecord(store, ctxAt(day, 'usr-compras'), 'transferencias', {
        productId: product.id,
        originWarehouseId: central.id,
        destinationWarehouseId: shop.id,
        quantity,
        notes: 'Reposición de tienda',
      });
      runAction(store, ctxAt(day, 'usr-compras'), 'transferencias', transfer.id, 'complete');
      made += 1;
    }
  }

  function monthlyAdjustments(day: number, month: number): void {
    const damaged = pick(products);
    if (stockOf(damaged.id, shop.id) > 0) {
      createRecord(store, ctxAt(day, 'usr-compras'), 'ajustes', {
        productId: damaged.id,
        warehouseId: shop.id,
        type: 'decrease',
        quantity: 1,
        reason: 'damage',
        notes: 'Unidad dañada en exhibición.',
      });
    }
    if (month % 2 === 0) {
      createRecord(store, ctxAt(day, 'usr-compras'), 'ajustes', {
        productId: pick(products).id,
        warehouseId: central.id,
        type: 'increase',
        quantity: 1,
        reason: 'count',
        notes: 'Diferencia encontrada en el inventario cíclico.',
      });
    }
  }

  function expense(
    day: number,
    account: BankAccount,
    amount: number,
    counterparty: string,
    reference: string,
  ): void {
    if (balanceOf(account) < amount) return;
    createRecord(store, ctxAt(day, 'usr-tesoreria'), 'movimientos', {
      accountId: account.id,
      concept: 'other',
      type: 'expense',
      amount,
      counterparty,
      reference,
      method: 'transfer',
    });
  }

  /** Los sábados la caja de la tienda se deposita en el BCP. */
  function depositCash(day: number): void {
    const amount = round2(balanceOf(cashBox) - 500);
    if (amount < 1000) return;
    createRecord(store, ctxAt(day, 'usr-tesoreria'), 'movimientos', {
      accountId: cashBox.id,
      concept: 'other',
      type: 'expense',
      amount,
      counterparty: 'Depósito en BCP',
      reference: 'Depósito de caja',
      method: 'deposit',
    });
    createRecord(store, ctxAt(day, 'usr-tesoreria'), 'movimientos', {
      accountId: bcp.id,
      concept: 'other',
      type: 'income',
      amount,
      counterparty: 'Caja tienda',
      reference: 'Depósito de caja',
      method: 'deposit',
    });
  }

  // ─── Simulación día por día ──────────────────────────────────────────────────

  for (currentDay = -HISTORY_DAYS; currentDay <= 0; currentDay += 1) {
    const day = currentDay;
    const date = dateOf(day);
    const weekday = date.getDay();
    const monthName = MONTHS[date.getMonth()] ?? '';

    if (weekday === 1) replenish(day);
    if (weekday !== 0 && day > setupDay) {
      const sales = 1 + (chance(0.55) ? 1 : 0) + (chance(0.2) ? 1 : 0);
      for (let index = 0; index < sales; index += 1) {
        const customer = pickCustomer();
        if (customer.documentType === 'RUC' && chance(0.3)) quoteSale(day, customer);
        else directSale(day, customer);
      }
    }
    if (weekday === 3 || weekday === 6) restockShop(day);
    if (date.getDate() === 20) monthlyAdjustments(day, date.getMonth());
    if (date.getDate() === 1)
      expense(day, bcp, 6500, 'Inmobiliaria Los Olivos S.A.C.', `Alquiler ${monthName}`);
    if (date.getDate() === 10)
      expense(day, interbank, 920, 'Servicios de luz, agua e internet', `Servicios ${monthName}`);
    if (date.getDate() === 28)
      expense(day, bcp, 14800, 'Planilla de personal', `Planilla ${monthName}`);

    // Las tareas de hoy pueden agendar otras para hoy mismo: el for…of las alcanza.
    for (const task of agenda.get(day) ?? []) task();
    agenda.delete(day);

    if (weekday === 6) depositCash(day);
  }

  // ─── Pendientes garantizados para que cada módulo tenga algo que hacer hoy ───

  const pendingCustomer = must(customers[1], 'el cliente de la cotización pendiente');
  createRecord(store, ctxAt(0, 'usr-ventas'), 'cotizaciones', {
    customerId: pendingCustomer.id,
    lines: asLines(planLines(pendingCustomer)),
    seller: 'Lucía Paredes',
    notes: 'Renovación de equipos del área de admisión.',
  });

  if (!store.list('ventas').some((sale) => sale.status === 'pending_invoice')) {
    const walkIn = must(customers[6], 'el cliente de mostrador');
    const lines = planLines(walkIn, shop.id);
    if (lines.length > 0) {
      createRecord(store, ctxAt(0, 'usr-ventas'), 'ventas', {
        customerId: walkIn.id,
        warehouseId: shop.id,
        lines: asLines(lines),
        seller: 'Lucía Paredes',
      });
    }
  }

  const orderFor = (supplierIndex: number) => {
    const supplier = must(suppliers[supplierIndex], 'el proveedor de la orden');
    const product = must(
      products.find((row) => supplierOf.get(row.id) === supplierIndex),
      'un producto del proveedor',
    );
    const order = createRecord(store, ctxAt(0, 'usr-compras'), 'ordenes-compra', {
      supplierId: supplier.id,
      warehouseId: central.id,
      lines: asLines([{ productId: product.id, quantity: product.minStock * 2 }]),
    });
    runAction(store, ctxAt(0, 'usr-compras'), 'ordenes-compra', order.id, 'approve');
    return order;
  };

  if (!store.list('ordenes-compra').some((order) => order.status === 'approved')) orderFor(3);
  if (!store.list('recepciones').some((receipt) => receipt.status === 'pending_bill')) {
    const order = orderFor(2);
    guideCounter += 1;
    createRecord(store, ctxAt(0, 'usr-compras'), 'recepciones', {
      purchaseOrderId: order.id,
      lines: asLines(
        order.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      ),
      guideNumber: `EG01-${pad(guideCounter, 6)}`,
    });
  }

  if (!store.list('transferencias').some((transfer) => transfer.status === 'pending')) {
    const product = products.find((row) => stockOf(row.id, central.id) > row.minStock + 2);
    if (product) {
      createRecord(store, ctxAt(0, 'usr-compras'), 'transferencias', {
        productId: product.id,
        originWarehouseId: central.id,
        destinationWarehouseId: shop.id,
        quantity: 2,
        notes: 'Pedido de la tienda para exhibición.',
      });
    }
  }

  // ─── Últimos accesos ─────────────────────────────────────────────────────────

  const lastAccess: [string, number][] = [
    ['usr-ventas', 0],
    ['usr-compras', 0],
    ['usr-tesoreria', -1],
    ['usr-consulta', -4],
  ];
  for (const [userId, day] of lastAccess) {
    store.update('usuarios', userId, { lastAccessAt: isoDateTime(ctxAt(day, 'usr-admin').now) });
  }

  // Los datos de ejemplo no cuentan como recién registrados.
  db.unseen = {};
  db.state = 'demo';
  return db;
}
