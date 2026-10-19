import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, beforeEach } from 'vitest';

import { mockDb } from '@/services/mocks/mock-db';
import { sessionService } from '@/services/session.service';

// Las pruebas verifican comportamiento, no animaciones: todo llega a su estado final al instante.
MotionGlobalConfig.skipAnimations = true;

// Por defecto se prueba con el administrador; las pruebas de permisos inician sesión con otro usuario.
beforeEach(() => {
  sessionService.signInAs('usr-admin');
});

afterEach(() => {
  cleanup();
  // Cada prueba parte de los datos de demostración originales.
  mockDb.reset();
  window.localStorage.clear();
});

// jsdom no implementa estas APIs del navegador; las usan Motion, Radix y Recharts.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (typeof window.ResizeObserver !== 'function') {
  class ResizeObserverStub {
    observe(): void {
      // Sin layout real en jsdom.
    }
    unobserve(): void {
      // Sin layout real en jsdom.
    }
    disconnect(): void {
      // Sin layout real en jsdom.
    }
  }
  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverStub });
}

Element.prototype.scrollTo = () => undefined;
