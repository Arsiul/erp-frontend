# ERP EnterpriseCloud — Frontend

Interfaz web del ERP para la empresa ficticia _Andes Tech Distribuciones S.A.C._ El documento maestro
(semana 07) sirvió de referencia funcional; la ubicación de los módulos y los flujos se rediseñaron.

> **Sin backend.** Todo funciona con datos simulados: la base vive en memoria y se guarda en
> `localStorage` (clave `erp.mock-db`), así que los cambios sobreviven a una recarga. En el encabezado,
> **Limpiar datos** deja el sistema en blanco para empezar desde cero (se conservan usuarios y
> configuración) y **Cargar datos simulados** vuelve a los datos de ejemplo.

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

## Acceso de demostración

Contraseña de todos los usuarios: **`demo`**. Cada rol ve solo sus grupos; las acciones sin permiso se
ocultan o se desactivan.

| Usuario                    | Rol                     |
| -------------------------- | ----------------------- |
| `admin@andestech.demo`     | Administrador (todo)    |
| `ventas@andestech.demo`    | Ventas                  |
| `compras@andestech.demo`   | Compras                 |
| `tesoreria@andestech.demo` | Tesorería               |
| `gerencia@andestech.demo`  | Consulta (solo lectura) |

## Módulos

| Grupo          | Pantallas                                                                          |
| -------------- | ---------------------------------------------------------------------------------- |
| Inicio         | Dashboard con indicadores y alertas que llevan al registro pendiente               |
| Maestros       | Clientes, Proveedores, Productos, Categorías, Almacenes, Cuentas bancarias         |
| Comercial      | Cotizaciones, Ventas, Comprobantes, Notas de crédito, **Cuentas por cobrar**       |
| Compras        | Órdenes de compra, Recepciones, Facturas de proveedor, **Cuentas por pagar**       |
| Inventario     | Stock, Kardex, Ajustes, Transferencias                                             |
| Tesorería      | Movimientos: cobros, pagos y otros ingresos o egresos de las cuentas bancarias     |
| Documentos     | Repositorio de archivos asociados a los registros                                  |
| Reportes       | Ventas, Compras, Inventario valorizado, Cobros y pagos (con filtros y exportación) |
| Administración | Usuarios, Roles y permisos, Auditoría, Configuración (empresa, IGV, series)        |

**Maestros va primero:** todo lo que se elige en otros módulos (clientes, proveedores, productos,
almacenes, cuentas bancarias) se registra ahí. Con el sistema en blanco, un selector vacío dice dónde
registrar lo que falta.

Ninguna pantalla es solo de vista: cada una registra, ejecuta un proceso (enviar, aprobar, completar,
anular...) o lleva al paso siguiente. Una prueba (`src/modules/list-registry.test.ts`) lo verifica.

## Flujos

Cada acción de "paso siguiente" abre el módulo destino con el registro de origen ya cargado
(`?from=<id>`). El cierre de cada ciclo (**Registrar cobro**, **Registrar pago**, **Registrar
movimiento** desde una cuenta bancaria) abre el formulario sobre la misma pantalla, sin salir del grupo:

- **Ciclo comercial:** cotización → venta → **Facturar** → comprobante (F001 factura / B001 boleta,
  IGV desde Configuración) → cuenta por cobrar (si es a crédito) → **Registrar cobro** (desde la misma
  cuenta por cobrar) → movimiento de Tesorería. La venta descuenta stock; una nota de crédito devuelve stock y reduce la cuenta por cobrar.
- **Ciclo de compras:** orden de compra → **Aprobar** → **Recibir mercadería** → recepción (ingresa stock) →
  **Registrar factura** → factura del proveedor → cuenta por pagar → **Registrar pago** (desde la misma
  cuenta por pagar) → movimiento de Tesorería.
- **Inventario:** ajustes y transferencias mueven stock y quedan en el kardex.

No hay envío a SUNAT: los comprobantes se numeran y calculan, pero no se transmiten.

## Estructura

```
src/
├── app/            # arranque: proveedores, router, guards de sesión y permisos, pruebas de integración
├── components/     # componentes compartidos (ui/: Button, Card, Badge, Tooltip...)
├── config/         # navegación (fuente única de grupos y pantallas) y datos de la app
├── hooks/          # hooks compartidos (sesión, permisos, recursos)
├── layouts/        # AppLayout: barra de íconos, panel contextual, encabezado, menú móvil
├── modules/        # un directorio por grupo; shared/ tiene el listado, el formulario y el detalle genéricos
├── pages/          # login, sin acceso, 404, error, carga inicial
├── services/       # servicios que usan los componentes (mañana, la API REST)
│   └── mocks/      # base simulada: store, semilla y reglas de negocio por grupo (business/)
├── styles/         # CSS global y tokens de diseño
├── test/           # configuración de pruebas
├── types/          # tipos de dominio
└── utils/          # funciones puras (formato, texto, navegación, cn)
```

## Convenciones

**La navegación tiene una sola fuente.** `src/config/navigation.ts` define grupos y pantallas. De ahí
salen la barra lateral, el panel contextual, las rutas, los breadcrumbs y la búsqueda.

**Cada recurso se describe una vez.** `src/modules/<grupo>/lists.ts` define columnas, formulario,
procesos y pasos siguientes; `src/modules/list-registry.ts` los reúne y `modules/shared/` los dibuja.

**Las reglas de negocio están en `src/services/mocks/business/`.** Validan, numeran, mueven stock y
saldos, y registran auditoría dentro de una transacción. Los componentes nunca leen los mocks: usan
hooks de TanStack Query que llaman a `src/services/*.service.ts`. Al conectar la API solo cambia el
cuerpo de los servicios.

**Colores solo desde tokens.** Están en `@theme` (`src/styles/index.css`). Estados: verde = pagado,
ámbar = pendiente, rojo = vencido, índigo = parcial o informativo, gris = anulado.

**Código en inglés, interfaz en español.** Identificadores y tipos en inglés; textos y rutas de
pantalla en español.

### Agregar un recurso

1. Tipo en `src/types/` y clave en `RESOURCE_KEYS` (`src/types/resources.ts`).
2. Reglas en `src/services/mocks/business/<grupo>.ts` y datos en la semilla.
3. Definición de listado en `src/modules/<grupo>/lists.ts`.
4. Pantalla en `src/config/navigation.ts`.

Las pruebas de `list-registry.test.ts` fallan si falta alguno de esos pasos.

## Accesibilidad

- Navegación completa por teclado, foco visible y enlace "Saltar al contenido".
- Buscador como combobox ARIA (flechas, Enter, Escape; atajo `Ctrl/⌘ + K`).
- Menús, diálogos y tooltips con Radix (gestión de foco y `Escape`).
- Animaciones desactivadas si el sistema pide reducir movimiento.

## Pendiente

- Conexión a la API REST (`VITE_API_URL`, ver `.env.example`) y autenticación real.
- Emisión electrónica a SUNAT.
