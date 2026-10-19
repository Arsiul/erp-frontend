import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppProviders } from '@/app/AppProviders';
import { createQueryClient } from '@/app/query-client';
import { routes } from '@/app/router';
import * as business from '@/services/mocks/business';
import { isoDate } from '@/services/mocks/business/context';
import { mockDb } from '@/services/mocks/mock-db';
import type { Store } from '@/services/mocks/store';

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders queryClient={createQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { user: userEvent.setup(), router };
}

/** Un registro de la demo; los nombres no se fijan en la prueba para no atarla a la semilla. */
function demo<T>(fn: (store: Store) => T | undefined, what: string): T {
  const value = mockDb.read(fn);
  if (value === undefined) throw new Error(`La demo no tiene ${what}.`);
  return value;
}

/** Agrega a la demo un registro que la prueba necesita y la semilla no trae. */
function seed<T>(fn: (store: Store, ctx: business.BusinessContext) => T): T {
  return mockDb.transaction((store) =>
    fn(store, { userId: 'usr-admin', userName: 'Administrador', now: new Date() }),
  );
}

describe('acciones sobre registros', () => {
  it('abre el detalle al hacer clic en una fila', async () => {
    const supplier = demo((store) => store.list('proveedores')[0], 'proveedores');
    const { user } = renderApp('/maestros/proveedores');
    const table = await screen.findByRole('table', { name: 'Proveedores' });

    await user.click(within(table).getByText(supplier.name));

    const sheet = await screen.findByRole('dialog', { name: supplier.name });
    expect(within(sheet).getByRole('button', { name: /Editar/ })).toBeInTheDocument();
  });

  it('edita un cliente desde el menú de acciones', async () => {
    const customer = demo((store) => store.list('clientes')[0], 'clientes');
    const renamed = `${customer.name} (Norte)`;
    const { user } = renderApp('/maestros/clientes');
    await screen.findByRole('table', { name: 'Clientes' });

    await user.click(screen.getByRole('button', { name: `Acciones de ${customer.name}` }));
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }));

    const form = await screen.findByRole('dialog', { name: 'Editar cliente' });
    const name = within(form).getByLabelText(/Nombre o razón social/);
    await user.clear(name);
    await user.type(name, renamed);
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(`Cambios guardados en ${renamed}`)).toBeInTheDocument();
    expect(
      within(screen.getByRole('table', { name: 'Clientes' })).getByText(renamed),
    ).toBeInTheDocument();
  });

  it('valida el formulario antes de registrar', async () => {
    const { user } = renderApp('/maestros/proveedores');
    await screen.findByRole('table', { name: 'Proveedores' });

    await user.click(screen.getByRole('button', { name: 'Nuevo proveedor' }));
    const form = await screen.findByRole('dialog', { name: 'Nuevo proveedor' });
    await user.type(within(form).getByLabelText(/RUC/), '123');
    await user.click(within(form).getByRole('button', { name: 'Registrar' }));

    expect(within(form).getAllByText('Este campo es obligatorio.').length).toBeGreaterThan(0);
    expect(within(form).getByText('El RUC debe tener 11 dígitos.')).toBeInTheDocument();
  });

  it('elimina con confirmación y rechaza borrar un cliente con operaciones', async () => {
    const used = demo((store) => {
      const sold = new Set(store.list('ventas').map((row) => row.customerId));
      return store.list('clientes').find((row) => sold.has(row.id));
    }, 'clientes con ventas');
    const unused = seed((store, ctx) =>
      business.createRecord(store, ctx, 'clientes', {
        documentType: 'RUC',
        documentNumber: '20999999991',
        name: 'Cliente Sin Operaciones S.A.C.',
        email: 'compras@sinoperaciones.pe',
        creditDays: 0,
        creditLimit: 0,
        status: 'active',
      }),
    );
    const { user } = renderApp('/maestros/clientes');
    await screen.findByRole('table', { name: 'Clientes' });

    await user.click(screen.getByRole('button', { name: `Acciones de ${used.name}` }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    let confirm = await screen.findByRole('alertdialog', { name: 'Eliminar cliente' });
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText(/desactívalo en lugar de eliminarlo/)).toBeInTheDocument();
    expect(
      within(screen.getByRole('table', { name: 'Clientes' })).getByText(used.name),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Acciones de ${unused.name}` }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    confirm = await screen.findByRole('alertdialog', { name: 'Eliminar cliente' });
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText(`Se eliminó ${unused.name}`)).toBeInTheDocument();
    await waitFor(() => {
      const table = screen.getByRole('table', { name: 'Clientes' });
      expect(within(table).queryByText(unused.name)).not.toBeInTheDocument();
    });
  });

  it('aprueba una orden de compra con confirmación', async () => {
    const order = seed((store, ctx) => {
      const supplier = store.list('proveedores').find((row) => row.status === 'active');
      const warehouse = store.list('almacenes')[0];
      const product = store.list('productos')[0];
      if (!supplier || !warehouse || !product)
        throw new Error('La demo no tiene maestros para la orden.');
      return business.createRecord(store, ctx, 'ordenes-compra', {
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        issuedAt: isoDate(ctx.now),
        lines: [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 5,
            receivedQuantity: 0,
            unitPrice: product.costPrice,
          },
        ],
      });
    });
    expect(order.status).toBe('draft');
    const { user } = renderApp('/compras/ordenes-compra');
    await screen.findByRole('table', { name: 'Órdenes de compra' });

    await user.click(screen.getByRole('button', { name: `Acciones de ${order.number}` }));
    await user.click(await screen.findByRole('menuitem', { name: 'Aprobar' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Aprobar orden de compra' });
    await user.click(within(confirm).getByRole('button', { name: 'Aprobar' }));

    expect(
      await screen.findByText(`${order.number} quedó aprobada; ya puedes recibir la mercadería.`),
    ).toBeInTheDocument();
    const row = screen.getByRole('button', { name: `Acciones de ${order.number}` }).closest('tr');
    expect(row && within(row).getByText('Aprobada')).toBeInTheDocument();
  });

  it('factura una venta abriendo el comprobante con la venta ya cargada', async () => {
    const sale = demo(
      (store) => store.list('ventas').find((row) => row.status === 'pending_invoice'),
      'ventas por facturar',
    );
    const { user, router } = renderApp('/comercial/ventas');
    await screen.findByRole('table', { name: 'Ventas' });

    await user.click(screen.getByRole('button', { name: `Acciones de ${sale.number}` }));
    await user.click(await screen.findByRole('menuitem', { name: 'Facturar' }));

    const form = await screen.findByRole('dialog', { name: 'Emitir comprobante' });
    expect(router.state.location.pathname).toBe('/comercial/comprobantes');
    expect(within(form).getByLabelText(/Venta a facturar/)).toHaveValue(sale.id);
  }, 15_000);

  it('registra una venta desde una cotización aceptada con sus productos', async () => {
    // La semilla varía con la fecha: se busca una cotización que algún almacén pueda despachar.
    const { quote, warehouse } = demo((store) => {
      const hasStock = (warehouseId: string, productId: string, quantity: number) =>
        store
          .list('stock')
          .some(
            (row) =>
              row.warehouseId === warehouseId &&
              row.productId === productId &&
              row.quantity >= quantity,
          );
      const warehouses = store.list('almacenes').filter((row) => row.status === 'active');
      for (const quote of store.list('cotizaciones').filter((row) => row.status === 'accepted')) {
        const warehouse = warehouses.find((w) =>
          quote.lines.every((line) => hasStock(w.id, line.productId, line.quantity)),
        );
        if (warehouse) return { quote, warehouse };
      }
      return undefined;
    }, 'cotizaciones aceptadas con stock');
    const { user } = renderApp('/comercial/cotizaciones');
    await screen.findByRole('table', { name: 'Cotizaciones' });

    await user.click(screen.getByRole('button', { name: `Acciones de ${quote.number}` }));
    await user.click(await screen.findByRole('menuitem', { name: 'Crear venta' }));
    const form = await screen.findByRole('dialog', { name: /Nueva venta/ });
    // El selector se habilita cuando llegan los almacenes.
    const warehouseSelect = within(form).getByLabelText(/Almacén de despacho/);
    await waitFor(() => {
      expect(warehouseSelect).toBeEnabled();
    });
    await user.selectOptions(warehouseSelect, warehouse.id);
    await user.click(within(form).getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText(/Registro creado/)).toBeInTheDocument();
    const sale = mockDb.read((store) =>
      store.list('ventas').find((row) => row.quoteId === quote.id),
    );
    expect(sale?.lines).toHaveLength(quote.lines.length);
  }, 15_000);

  it('registra el cobro sin salir de cuentas por cobrar', async () => {
    const receivable = demo(
      (store) =>
        store.list('cuentas-cobrar').find((row) => row.balance > 0 && row.status !== 'cancelled'),
      'cuentas por cobrar con saldo',
    );
    const account = demo(
      (store) => store.list('cuentas-bancarias').find((row) => row.status === 'active'),
      'cuentas bancarias activas',
    );
    const { user, router } = renderApp('/comercial/cuentas-cobrar');
    await screen.findByRole('table', { name: 'Cuentas por cobrar' });

    await user.click(
      screen.getByRole('button', { name: `Acciones de ${receivable.documentNumber}` }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Registrar cobro' }));
    const form = await screen.findByRole('dialog', { name: /Nuevo movimiento/ });
    const accountSelect = within(form).getByRole('combobox', { name: /^Cuenta(?! por)/ });
    await waitFor(() => {
      expect(accountSelect).toBeEnabled();
    });
    await user.selectOptions(accountSelect, account.id);
    await user.click(within(form).getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText(/Registro creado/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/comercial/cuentas-cobrar');
    expect(mockDb.read((store) => store.get('cuentas-cobrar', receivable.id)?.balance)).toBe(0);
  }, 15_000);

  it('marca lo recién registrado como nuevo y lo deja arriba hasta abrirlo', async () => {
    const supplier = (name: string, ruc: string) =>
      seed((store, ctx) =>
        business.createRecord(store, ctx, 'proveedores', {
          name,
          ruc,
          contactName: 'Compras',
          email: 'ventas@proveedor.pe',
          phone: '014445566',
          address: 'Av. Industrial 120, Lima',
          paymentDays: 30,
          status: 'active',
        }),
      );
    const older = supplier('Proveedor Reciente Uno S.A.C.', '20999999981');
    const newer = supplier('Proveedor Reciente Dos S.A.C.', '20999999982');
    const { user } = renderApp('/maestros/proveedores');
    const table = await screen.findByRole('table', { name: 'Proveedores' });
    // Sin roles: con el detalle abierto, la tabla queda oculta para la accesibilidad.
    const bodyRows = () => [...table.querySelectorAll('tbody tr')];

    await waitFor(() => {
      expect(within(table).getAllByText('Nuevo')).toHaveLength(2);
    });
    expect(bodyRows()[0]).toHaveTextContent(newer.name);
    expect(bodyRows()[1]).toHaveTextContent(older.name);

    await user.click(within(table).getByText(newer.name));
    await screen.findByRole('dialog', { name: newer.name });

    // El que sigue sin abrir pasa adelante; el abierto pierde la marca.
    await waitFor(() => {
      expect(bodyRows()[0]).toHaveTextContent(older.name);
    });
    expect(bodyRows()[0]).toHaveTextContent('Nuevo');
    expect(table.querySelectorAll('tbody tr')[1]).not.toHaveTextContent('Nuevo');
    expect(mockDb.read((store) => store.unseen('proveedores'))).toEqual([older.id]);
  });

  it('limpia todos los datos y vuelve a cargar los simulados desde la cabecera', async () => {
    const product = demo((store) => store.list('productos')[0], 'productos');
    const { user } = renderApp('/maestros/productos');
    await screen.findByRole('table', { name: 'Productos' });

    expect(screen.getByRole('button', { name: 'Cargar datos simulados' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Limpiar datos' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Limpiar datos' }),
    );

    expect(await screen.findByText('Aún no hay productos')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Productos' })).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Limpiar datos' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cargar datos simulados' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cargar datos' }),
    );

    expect(await screen.findByRole('table', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByText(product.name)).toBeInTheDocument();
  });
});
