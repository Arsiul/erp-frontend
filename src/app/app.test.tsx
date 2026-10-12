import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppProviders } from './AppProviders';
import { createQueryClient } from './query-client';
import { routes } from './router';

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders queryClient={createQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe('aplicación', () => {
  it('carga el dashboard en la raíz con sus indicadores', async () => {
    renderApp('/');
    // Primera carga del chunk diferido (incluye Recharts): en frío y con la suite en paralelo puede
    // tardar más que la espera por defecto de 1 s.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Panel general' }, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Ventas del mes')).toBeInTheDocument();
    expect(screen.getByText('Últimas ventas')).toBeInTheDocument();
  });

  it('redirige un grupo a su primer submódulo', async () => {
    const router = renderApp('/comercial');
    expect(await screen.findByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/comercial/clientes');
  });

  it('muestra el listado de un submódulo con sus registros y su paso del plan', async () => {
    renderApp('/inventario/kardex');
    expect(await screen.findByRole('heading', { level: 1, name: 'Kardex' })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Submódulos de Inventario' }),
    ).toBeInTheDocument();

    const table = await screen.findByRole('table', { name: 'Kardex' });
    expect(within(table).getAllByRole('row')).toHaveLength(6); // encabezado + 5 movimientos
    expect(within(table).getByText('REC-000063')).toBeInTheDocument();
    expect(screen.getByText(/paso 2 de 9/)).toBeInTheDocument();
  });

  it('filtra el listado con la búsqueda rápida, sin importar tildes', async () => {
    const user = userEvent.setup();
    renderApp('/comercial/clientes');

    const table = await screen.findByRole('table', { name: 'Clientes' });
    expect(within(table).getByText('Rosa Huamán Flores')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar en Clientes' }), 'pacifico');

    expect(within(table).getByText('Inversiones Pacífico Sur S.A.C.')).toBeInTheDocument();
    expect(within(table).queryByText('Rosa Huamán Flores')).not.toBeInTheDocument();
    expect(screen.getByText('1 de 6 registros')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar en Clientes' }));
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en Clientes' }), 'xyz');
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('muestra la página 404 en rutas desconocidas', async () => {
    renderApp('/no-existe');
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument();
  });

  it('navega desde el buscador con el teclado', async () => {
    const user = userEvent.setup();
    const router = renderApp('/comercial/clientes');

    await user.type(await screen.findByRole('combobox', { name: /buscar/i }), 'tesoreria');
    expect(await screen.findByRole('option', { name: /Tesorería/ })).toBeInTheDocument();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { level: 1, name: 'Tesorería' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/finanzas/tesoreria');
  });

  it('recuerda si el menú lateral está contraído', async () => {
    const user = userEvent.setup();
    renderApp('/comercial/clientes');

    await user.click(await screen.findByRole('button', { name: 'Contraer menú lateral' }));

    expect(screen.getByRole('button', { name: 'Expandir menú lateral' })).toBeInTheDocument();
    expect(window.localStorage.getItem('erp.sidebar.panel-open')).toBe('false');
  });
});
