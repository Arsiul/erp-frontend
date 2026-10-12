import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppProviders } from '@/app/AppProviders';
import { createQueryClient } from '@/app/query-client';
import { routes } from '@/app/router';

function renderApp(path: string) {
  render(
    <AppProviders queryClient={createQueryClient()}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
    </AppProviders>,
  );
  return userEvent.setup();
}

describe('acciones sobre registros', () => {
  it('abre el detalle al hacer clic en una fila', async () => {
    const user = renderApp('/compras/proveedores');
    const table = await screen.findByRole('table', { name: 'Proveedores' });

    await user.click(within(table).getByText('Pinturas Color Total S.A.C.'));

    const sheet = await screen.findByRole('dialog', { name: 'Pinturas Color Total S.A.C.' });
    expect(within(sheet).getByText('Carmen Ruiz')).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: /Editar/ })).toBeInTheDocument();
  });

  it('edita un cliente desde el menú de acciones', async () => {
    const user = renderApp('/comercial/clientes');
    await screen.findByRole('table', { name: 'Clientes' });

    await user.click(
      screen.getByRole('button', { name: 'Acciones de Ferretería San Martín E.I.R.L.' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }));

    const form = await screen.findByRole('dialog', { name: 'Editar cliente' });
    const name = within(form).getByLabelText(/Razón social o nombre/);
    await user.clear(name);
    await user.type(name, 'Ferretería San Martín Norte E.I.R.L.');
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Ferretería San Martín Norte E.I.R.L.')).toBeInTheDocument();
    expect(await screen.findByText('Cliente actualizado.')).toBeInTheDocument();
  });

  it('valida el formulario antes de crear', async () => {
    const user = renderApp('/compras/proveedores');
    await screen.findByRole('table', { name: 'Proveedores' });

    await user.click(screen.getByRole('button', { name: 'Nuevo proveedor' }));
    const form = await screen.findByRole('dialog', { name: 'Nuevo proveedor' });
    await user.type(within(form).getByLabelText(/RUC/), '123');
    await user.click(within(form).getByRole('button', { name: 'Crear' }));

    expect(within(form).getByText('Este campo es obligatorio.')).toBeInTheDocument();
    expect(within(form).getByText('El RUC debe tener 11 dígitos.')).toBeInTheDocument();
  });

  it('solo permite eliminar cuando corresponde y pide confirmación', async () => {
    const user = renderApp('/comercial/clientes');
    await screen.findByRole('table', { name: 'Clientes' });

    // Un cliente con deuda no se puede eliminar.
    await user.click(
      screen.getByRole('button', { name: 'Acciones de Constructora Los Cedros S.A.C.' }),
    );
    expect(screen.queryByRole('menuitem', { name: 'Eliminar' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    // Uno sin deuda sí.
    await user.click(screen.getByRole('button', { name: 'Acciones de Rosa Huamán Flores' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    const confirm = await screen.findByRole('alertdialog', { name: '¿Eliminar el cliente?' });
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(screen.queryByText('Rosa Huamán Flores')).not.toBeInTheDocument();
    });
    expect(screen.getByText('5 registros')).toBeInTheDocument();
  });

  it('aplica una acción de estado con confirmación', async () => {
    const user = renderApp('/compras/ordenes');
    await screen.findByRole('table', { name: 'Órdenes de compra' });

    await user.click(screen.getByRole('button', { name: 'Acciones de OC-000091' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Aprobar' }));
    const confirm = await screen.findByRole('alertdialog', {
      name: '¿Aprobar la orden de compra?',
    });
    await user.click(within(confirm).getByRole('button', { name: 'Aprobar' }));

    expect(await screen.findByText('OC-000091 aprobada.')).toBeInTheDocument();
    const row = screen.getByText('OC-000091').closest('tr');
    expect(row && within(row).getByText('Aprobada')).toBeInTheDocument();
  });

  it('vacía todos los datos y los restaura desde el menú de configuración', async () => {
    const user = renderApp('/inventario/productos');
    await screen.findByRole('table', { name: 'Productos' });

    await user.click(screen.getByRole('button', { name: 'Configuración' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Vaciar todos los datos' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Vaciar todo' }),
    );

    expect(await screen.findByText('Aún no hay registros')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Productos' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Configuración' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Restaurar datos de ejemplo' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Restaurar' }),
    );

    expect(await screen.findByRole('table', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByText('Cemento Portland Tipo I 42.5 kg')).toBeInTheDocument();
  });
});
