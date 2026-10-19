import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { mockDb } from '@/services/mocks/mock-db';
import { sessionService } from '@/services/session.service';

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
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cotizaciones' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/comercial/cotizaciones');
  });

  it('muestra el listado de un submódulo con sus registros', async () => {
    const movements = mockDb.read((store) => store.list('kardex'));
    renderApp('/inventario/kardex');
    expect(await screen.findByRole('heading', { level: 1, name: 'Kardex' })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Submódulos de Inventario' }),
    ).toBeInTheDocument();

    const table = await screen.findByRole('table', { name: 'Kardex' });
    expect(within(table).getAllByRole('row')).toHaveLength(movements.length + 1);
  }, 15_000);

  it('filtra el listado con la búsqueda rápida', async () => {
    const [first, second] = mockDb.read((store) => store.list('clientes'));
    if (!first || !second) throw new Error('La demo necesita al menos dos clientes.');
    const user = userEvent.setup();
    renderApp('/maestros/clientes');

    const table = await screen.findByRole('table', { name: 'Clientes' });
    expect(within(table).getByText(second.name)).toBeInTheDocument();

    const search = screen.getByRole('searchbox', { name: 'Buscar en Clientes' });
    await user.type(search, first.documentNumber);

    expect(within(table).getByText(first.name)).toBeInTheDocument();
    expect(within(table).queryByText(second.name)).not.toBeInTheDocument();
    expect(screen.getByText(/^1 de \d+ registros$/)).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'xyz-sin-coincidencias');
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('muestra la página 404 en rutas desconocidas', async () => {
    renderApp('/no-existe');
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument();
  });

  it('navega desde el buscador con el teclado', async () => {
    const user = userEvent.setup();
    const router = renderApp('/maestros/clientes');

    await user.type(await screen.findByRole('combobox', { name: /buscar/i }), 'movimientos');
    expect(await screen.findByRole('option', { name: /Movimientos/ })).toBeInTheDocument();
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Movimientos' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/tesoreria/movimientos');
  });

  it('recuerda si el menú lateral está contraído', async () => {
    const user = userEvent.setup();
    renderApp('/maestros/clientes');

    await user.click(await screen.findByRole('button', { name: 'Contraer menú lateral' }));

    expect(screen.getByRole('button', { name: 'Expandir menú lateral' })).toBeInTheDocument();
    expect(window.localStorage.getItem('erp.sidebar.panel-open')).toBe('false');
  });

  it('pide iniciar sesión antes de entrar y vuelve a la pantalla pedida', async () => {
    const admin = mockDb.read((store) => store.get('usuarios', 'usr-admin'));
    if (!admin) throw new Error('La demo no tiene al administrador.');
    sessionService.logout();
    const user = userEvent.setup();
    const router = renderApp('/maestros/clientes');

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');

    await user.clear(screen.getByLabelText('Correo'));
    await user.type(screen.getByLabelText('Correo'), admin.email);
    await user.type(screen.getByLabelText('Contraseña'), 'demo');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('table', { name: 'Clientes' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/maestros/clientes');
  });
});
