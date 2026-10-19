import type { CustomerDocumentType } from '@/types/maestros';

import type { Store } from '../store';

import { fail, optionalText, requireNumber, requireText } from './context';
import {
  activationActions,
  activeStatus,
  assertUnique,
  pickEnum,
  requireActive,
  requireRecord,
  type RecordInput,
  type ResourceRules,
} from './rules';
import { ensureStockRow } from './stock';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalEmail(value: unknown): string {
  const email = optionalText(value).toLowerCase();
  if (email && !EMAIL.test(email)) fail('El correo no es válido.');
  return email;
}

function validRuc(value: unknown): string {
  const ruc = optionalText(value);
  if (!/^(10|15|17|20)\d{9}$/.test(ruc))
    fail('El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.');
  return ruc;
}

function customerDocument(type: CustomerDocumentType, value: unknown): string {
  const number = optionalText(value).toUpperCase();
  if (type === 'RUC') return validRuc(number);
  if (type === 'DNI' && !/^\d{8}$/.test(number)) fail('El DNI debe tener 8 dígitos.');
  if (type === 'CE' && !/^[A-Z0-9]{9,12}$/.test(number))
    fail('El carné de extranjería debe tener de 9 a 12 caracteres.');
  return number;
}

function wholeNumber(value: unknown, message: string): number {
  const number = requireNumber(value ?? 0, message);
  if (!Number.isInteger(number)) fail(message);
  return number;
}

/** ¿Algún documento comercial o de compras usa el producto en sus líneas? */
function productInDocuments(store: Store, productId: string): boolean {
  const uses = (rows: readonly { lines: readonly { productId: string }[] }[]) =>
    rows.some((row) => row.lines.some((line) => line.productId === productId));
  return (
    uses(store.list('cotizaciones')) ||
    uses(store.list('ventas')) ||
    uses(store.list('ordenes-compra')) ||
    uses(store.list('recepciones')) ||
    store.list('ajustes').some((row) => row.productId === productId) ||
    store.list('transferencias').some((row) => row.productId === productId)
  );
}

// ─── Clientes ──────────────────────────────────────────────────────────────────

function customerValues(store: Store, input: RecordInput<'clientes'>, exceptId?: string) {
  const documentType = pickEnum(
    input.documentType,
    ['RUC', 'DNI', 'CE'],
    'Elige el tipo de documento.',
  );
  const documentNumber = customerDocument(documentType, input.documentNumber);
  assertUnique(
    store.list('clientes'),
    documentNumber,
    (row) => row.documentNumber,
    'Ya existe un cliente con ese documento.',
    exceptId,
  );
  const creditDays = wholeNumber(
    input.creditDays,
    'Los días de crédito deben ser un entero desde 0.',
  );
  const creditLimit = requireNumber(
    input.creditLimit ?? 0,
    'El límite de crédito no puede ser negativo.',
  );
  if (creditDays > 0 && creditLimit <= 0)
    fail('Un cliente con días de crédito necesita un límite de crédito.');
  return {
    name: requireText(input.name, 'Escribe la razón social o el nombre.'),
    documentType,
    documentNumber,
    email: optionalEmail(input.email),
    phone: optionalText(input.phone),
    address: optionalText(input.address),
    creditDays,
    creditLimit,
    status: activeStatus(input.status),
  };
}

const clientes: ResourceRules<'clientes'> = {
  create(store, _ctx, input) {
    return store.insert('clientes', {
      code: store.nextNumber('clientes', 'CLI-', 4),
      ...customerValues(store, input),
    });
  },
  update(store, _ctx, current, input) {
    return store.update(
      'clientes',
      current.id,
      customerValues(store, { ...current, ...input }, current.id),
    );
  },
  remove(store, _ctx, current) {
    const used =
      store.list('cotizaciones').some((row) => row.customerId === current.id) ||
      store.list('ventas').some((row) => row.customerId === current.id);
    if (used) fail('El cliente tiene cotizaciones o ventas; desactívalo en lugar de eliminarlo.');
    store.remove('clientes', current.id);
  },
  actions: activationActions('clientes'),
};

// ─── Proveedores ───────────────────────────────────────────────────────────────

function supplierValues(store: Store, input: RecordInput<'proveedores'>, exceptId?: string) {
  const ruc = validRuc(input.ruc);
  assertUnique(
    store.list('proveedores'),
    ruc,
    (row) => row.ruc,
    'Ya existe un proveedor con ese RUC.',
    exceptId,
  );
  return {
    name: requireText(input.name, 'Escribe la razón social.'),
    ruc,
    contactName: optionalText(input.contactName),
    email: optionalEmail(input.email),
    phone: optionalText(input.phone),
    address: optionalText(input.address),
    paymentDays: wholeNumber(input.paymentDays, 'Los días de pago deben ser un entero desde 0.'),
    status: activeStatus(input.status),
  };
}

const proveedores: ResourceRules<'proveedores'> = {
  create(store, _ctx, input) {
    return store.insert('proveedores', {
      code: store.nextNumber('proveedores', 'PRV-', 4),
      ...supplierValues(store, input),
    });
  },
  update(store, _ctx, current, input) {
    return store.update(
      'proveedores',
      current.id,
      supplierValues(store, { ...current, ...input }, current.id),
    );
  },
  remove(store, _ctx, current) {
    const used =
      store.list('ordenes-compra').some((row) => row.supplierId === current.id) ||
      store.list('facturas-proveedor').some((row) => row.supplierId === current.id);
    if (used) fail('El proveedor tiene órdenes o facturas; desactívalo en lugar de eliminarlo.');
    store.remove('proveedores', current.id);
  },
  actions: activationActions('proveedores'),
};

// ─── Categorías ────────────────────────────────────────────────────────────────

function categoryValues(store: Store, input: RecordInput<'categorias'>, exceptId?: string) {
  const name = requireText(input.name, 'Escribe el nombre de la categoría.');
  assertUnique(
    store.list('categorias'),
    name,
    (row) => row.name,
    'Ya existe una categoría con ese nombre.',
    exceptId,
  );
  return { name, description: optionalText(input.description), status: activeStatus(input.status) };
}

const categorias: ResourceRules<'categorias'> = {
  create(store, _ctx, input) {
    return store.insert('categorias', {
      code: store.nextNumber('categorias', 'CAT-', 3),
      ...categoryValues(store, input),
    });
  },
  update(store, _ctx, current, input) {
    const updated = store.update(
      'categorias',
      current.id,
      categoryValues(store, { ...current, ...input }, current.id),
    );
    if (updated.name !== current.name) {
      for (const product of store
        .list('productos')
        .filter((row) => row.categoryId === current.id)) {
        store.update('productos', product.id, { categoryName: updated.name });
        for (const row of store.list('stock').filter((stock) => stock.productId === product.id)) {
          store.update('stock', row.id, { categoryName: updated.name });
        }
      }
    }
    return updated;
  },
  remove(store, _ctx, current) {
    if (store.list('productos').some((row) => row.categoryId === current.id)) {
      fail('La categoría tiene productos; muévelos a otra categoría antes de eliminarla.');
    }
    store.remove('categorias', current.id);
  },
  actions: activationActions('categorias'),
};

// ─── Productos ─────────────────────────────────────────────────────────────────

function productValues(
  store: Store,
  input: RecordInput<'productos'>,
  current?: { id: string; categoryId: string },
) {
  const sku = requireText(input.sku, 'Escribe el SKU.').toUpperCase();
  assertUnique(
    store.list('productos'),
    sku,
    (row) => row.sku,
    'Ya existe un producto con ese SKU.',
    current?.id,
  );
  // Un producto puede seguir en una categoría que se desactivó; solo se exige activa al cambiarla.
  const category =
    current && input.categoryId === current.categoryId
      ? requireRecord(store, 'categorias', input.categoryId, 'la categoría')
      : requireActive(store, 'categorias', input.categoryId, 'la categoría');
  const salePrice = requireNumber(input.salePrice, 'El precio de venta debe ser mayor que cero.');
  if (salePrice <= 0) fail('El precio de venta debe ser mayor que cero.');
  return {
    sku,
    name: requireText(input.name, 'Escribe el nombre del producto.'),
    categoryId: category.id,
    categoryName: category.name,
    unit: requireText(input.unit, 'Elige la unidad de medida.'),
    salePrice,
    costPrice: requireNumber(input.costPrice ?? 0, 'El costo no puede ser negativo.'),
    minStock: wholeNumber(input.minStock, 'El stock mínimo debe ser un entero desde 0.'),
    status: activeStatus(input.status),
  };
}

const productos: ResourceRules<'productos'> = {
  create(store, _ctx, input) {
    const product = store.insert('productos', productValues(store, input));
    for (const warehouse of store.list('almacenes').filter((row) => row.status === 'active')) {
      ensureStockRow(store, product.id, warehouse.id);
    }
    return product;
  },
  update(store, _ctx, current, input) {
    const updated = store.update(
      'productos',
      current.id,
      productValues(store, { ...current, ...input }, current),
    );
    for (const row of store.list('stock').filter((stock) => stock.productId === current.id)) {
      store.update('stock', row.id, {
        productName: updated.name,
        sku: updated.sku,
        categoryName: updated.categoryName,
        unit: updated.unit,
        ...(updated.minStock !== current.minStock && { minStock: updated.minStock }),
      });
    }
    return updated;
  },
  remove(store, _ctx, current) {
    if (
      store.list('kardex').some((row) => row.productId === current.id) ||
      productInDocuments(store, current.id)
    ) {
      fail('El producto ya tiene movimientos; desactívalo en lugar de eliminarlo.');
    }
    for (const row of store.list('stock').filter((stock) => stock.productId === current.id)) {
      store.remove('stock', row.id);
    }
    store.remove('productos', current.id);
  },
  actions: activationActions('productos'),
};

// ─── Almacenes ─────────────────────────────────────────────────────────────────

function warehouseValues(store: Store, input: RecordInput<'almacenes'>, exceptId?: string) {
  const name = requireText(input.name, 'Escribe el nombre del almacén.');
  assertUnique(
    store.list('almacenes'),
    name,
    (row) => row.name,
    'Ya existe un almacén con ese nombre.',
    exceptId,
  );
  return {
    name,
    address: optionalText(input.address),
    manager: optionalText(input.manager),
    status: activeStatus(input.status),
  };
}

const almacenes: ResourceRules<'almacenes'> = {
  create(store, _ctx, input) {
    const warehouse = store.insert('almacenes', {
      code: store.nextNumber('almacenes', 'ALM-', 2),
      ...warehouseValues(store, input),
    });
    for (const product of store.list('productos')) ensureStockRow(store, product.id, warehouse.id);
    return warehouse;
  },
  update(store, _ctx, current, input) {
    const updated = store.update(
      'almacenes',
      current.id,
      warehouseValues(store, { ...current, ...input }, current.id),
    );
    if (updated.name !== current.name) {
      for (const row of store.list('stock').filter((stock) => stock.warehouseId === current.id)) {
        store.update('stock', row.id, { warehouseName: updated.name });
      }
    }
    return updated;
  },
  remove(store, _ctx, current) {
    const used =
      store.list('kardex').some((row) => row.warehouseId === current.id) ||
      store.list('ventas').some((row) => row.warehouseId === current.id) ||
      store.list('ordenes-compra').some((row) => row.warehouseId === current.id) ||
      store
        .list('transferencias')
        .some(
          (row) =>
            row.originWarehouseId === current.id || row.destinationWarehouseId === current.id,
        );
    if (used) fail('El almacén ya tiene movimientos; desactívalo en lugar de eliminarlo.');
    for (const row of store.list('stock').filter((stock) => stock.warehouseId === current.id)) {
      store.remove('stock', row.id);
    }
    store.remove('almacenes', current.id);
  },
  actions: activationActions('almacenes'),
};

export const maestrosRules = { clientes, proveedores, categorias, productos, almacenes };
