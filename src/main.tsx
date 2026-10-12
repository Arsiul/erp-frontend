import '@fontsource-variable/inter';
import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';

import { AppProviders } from './app/AppProviders';
import { createQueryClient } from './app/query-client';
import { createAppRouter } from './app/router';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('No se encontró el elemento #root en index.html');

const queryClient = createQueryClient();
const router = createAppRouter();

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
