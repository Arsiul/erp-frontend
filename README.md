# ERP EnterpriseCloud — Frontend

Interfaz web del ERP para el caso de estudio _Distribuidora Ferretera Andina S.A.C._ (empresa ficticia).
La estructura de módulos sigue `../estructura.md` (v2).

> **Estado actual:** shell completo de la aplicación (navegación, layout, búsqueda, notificaciones) y
> **dashboard con datos de demostración**. Los demás submódulos muestran una pantalla "en preparación".
> No hay backend: los datos salen de `src/services/mocks/`.

## Stack

| Área                   | Tecnología                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| Base                   | React 19 + TypeScript (estricto) + Vite                               |
| Estilos                | Tailwind CSS 4 con tokens de diseño en `src/styles/index.css`         |
| Rutas                  | React Router (data router, carga diferida por ruta)                   |
| Datos                  | TanStack Query (caché, estados de carga y error)                      |
| Animación              | Motion (respeta "reducir movimiento" del sistema)                     |
| Componentes accesibles | Radix UI (menús, tooltips, diálogo)                                   |
| Gráficos               | Recharts (solo se descarga con el dashboard)                          |
| Íconos                 | Lucide                                                                |
| Calidad                | ESLint (reglas tipadas estrictas), Prettier, Vitest + Testing Library |

## Requisitos

- Node.js 22 o superior

## Scripts

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo en http://localhost:5173
npm run build        # verificación de tipos + build de producción en dist/
npm run preview      # servir el build de producción
npm run typecheck    # solo verificación de tipos
npm run lint         # ESLint
npm run format       # formatear con Prettier
npm run test         # pruebas (una pasada)
npm run test:watch   # pruebas en modo observación
```

## Estructura

```
src/
├── app/            # arranque: proveedores, router, cliente de caché, pruebas de integración
├── components/     # componentes compartidos
│   └── ui/         # primitivas de interfaz (Button, Card, Badge, Tooltip...)
├── config/         # configuración estática: navegación, datos de la app, accesos rápidos
├── hooks/          # hooks compartidos
├── layouts/        # AppLayout: barra de íconos, panel contextual, encabezado, menú móvil
├── modules/        # un directorio por grupo del ERP (hoy solo dashboard)
├── pages/          # páginas genéricas: módulo en preparación, 404, error, carga inicial
├── services/       # acceso a datos (hoy mocks; mañana la API REST)
├── styles/         # CSS global y tokens de diseño
├── test/           # configuración de pruebas
├── types/          # tipos de dominio compartidos
└── utils/          # funciones puras (formato, texto, navegación, cn)
```

## Convenciones

**La navegación tiene una sola fuente.** `src/config/navigation.ts` define grupos y submódulos. De ahí
salen la barra lateral, el panel contextual, las rutas, los breadcrumbs y la búsqueda. Para agregar o
mover una pantalla se edita solo ese archivo.

**Los componentes nunca leen mocks directamente.** Leen datos con hooks de TanStack Query (`useAlerts`,
`useDashboardSummary`), que llaman a `src/services/*.service.ts`. Al conectar la API (Fase 6) solo
cambia el cuerpo de cada servicio; la firma y los componentes se mantienen.

**Colores solo desde tokens.** Los colores de marca, superficies y texto están en `@theme`
(`src/styles/index.css`). Los componentes usan clases como `bg-primary-600` o `text-ink-muted`, nunca
hexadecimales sueltos. Los estados tienen color fijo: verde = pagado, ámbar = pendiente,
rojo = vencido, índigo = parcial o informativo, gris = anulado.

**Código en inglés, interfaz en español.** Identificadores, tipos y rutas de API en inglés; textos
visibles y rutas de pantalla en español.

### Implementar un módulo nuevo

1. Crear `src/modules/<grupo>/` con `pages/`, `components/` y `hooks/`.
2. Definir los tipos en `src/types/` y el servicio en `src/services/`.
3. En `src/app/router.tsx`, reemplazar el placeholder de esa ruta por una ruta `lazy` que importe la
   página del módulo (igual que el dashboard).
4. Agregar pruebas junto al código (`*.test.ts(x)`).

## Accesibilidad

- Navegación completa por teclado, foco visible y enlace "Saltar al contenido".
- Buscador como combobox ARIA (flechas, Enter, Escape; atajo `Ctrl/⌘ + K`).
- Menús, tooltips y menú móvil con Radix (gestión de foco y `Escape`).
- Animaciones desactivadas si el sistema pide reducir movimiento.

## Pendiente por fases (fuera de esta entrega)

- Autenticación y permisos (el usuario mostrado es fijo: `DEMO_USER` en `src/config/app.ts`).
- Conexión a la API REST (`VITE_API_URL`, ver `.env.example`).
- Funcionalidad de cada submódulo, según el plan de construcción de `estructura.md` §9.2.
