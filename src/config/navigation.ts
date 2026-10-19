import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileMinus,
  FileText,
  FolderOpen,
  HandCoins,
  History,
  Landmark,
  LayoutDashboard,
  Package,
  PackageCheck,
  PackageSearch,
  PieChart,
  Receipt,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react';

import type { NavGroup } from '@/types/navigation';

/**
 * Fuente única de la estructura del ERP.
 * Cada grupo reúne un ciclo completo (Comercial: cotización → venta → comprobante → cobranza;
 * Compras: orden → recepción → factura → pago) y las acciones de cada registro llevan al paso
 * siguiente. La barra lateral, las rutas, los breadcrumbs y la búsqueda se generan desde aquí.
 */
export const NAVIGATION: readonly NavGroup[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/',
    icon: LayoutDashboard,
    description: 'Indicadores, alertas y últimas ventas.',
    sections: [],
  },
  {
    id: 'maestros',
    label: 'Maestros',
    path: '/maestros',
    icon: Building2,
    module: 'maestros',
    description:
      'Clientes, proveedores, productos, almacenes y cuentas bancarias que usan los demás módulos.',
    sections: [
      {
        id: 'maestros-terceros',
        title: 'Terceros',
        items: [
          {
            id: 'clientes',
            label: 'Clientes',
            path: '/maestros/clientes',
            icon: Users,
            description: 'Datos fiscales, condición de pago y línea de crédito de cada cliente.',
            view: { kind: 'resource', resource: 'clientes' },
          },
          {
            id: 'proveedores',
            label: 'Proveedores',
            path: '/maestros/proveedores',
            icon: Truck,
            description: 'Datos fiscales, contacto y condición de pago de cada proveedor.',
            view: { kind: 'resource', resource: 'proveedores' },
          },
        ],
      },
      {
        id: 'maestros-catalogo',
        title: 'Catálogo',
        items: [
          {
            id: 'productos',
            label: 'Productos',
            path: '/maestros/productos',
            icon: Package,
            description: 'SKU, precio de venta, costo y unidad de cada producto.',
            view: { kind: 'resource', resource: 'productos' },
          },
          {
            id: 'categorias',
            label: 'Categorías',
            path: '/maestros/categorias',
            icon: Tags,
            description: 'Agrupación de productos para filtros y reportes.',
            view: { kind: 'resource', resource: 'categorias' },
          },
          {
            id: 'almacenes',
            label: 'Almacenes',
            path: '/maestros/almacenes',
            icon: Warehouse,
            description: 'Locales donde se guarda y despacha la mercadería.',
            view: { kind: 'resource', resource: 'almacenes' },
          },
        ],
      },
      {
        id: 'maestros-finanzas',
        title: 'Finanzas',
        items: [
          {
            id: 'cuentas-bancarias',
            label: 'Cuentas bancarias',
            path: '/maestros/cuentas-bancarias',
            icon: Wallet,
            description: 'Bancos y cajas con su saldo actual.',
            view: { kind: 'resource', resource: 'cuentas-bancarias' },
          },
        ],
      },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    path: '/comercial',
    icon: ShoppingCart,
    module: 'comercial',
    description: 'Ciclo de venta: cotización, venta, comprobante y cobranza.',
    sections: [
      {
        id: 'comercial-ventas',
        title: 'Ventas',
        items: [
          {
            id: 'cotizaciones',
            label: 'Cotizaciones',
            path: '/comercial/cotizaciones',
            icon: ClipboardList,
            description: 'Propuestas al cliente; una cotización aceptada se convierte en venta.',
            view: { kind: 'resource', resource: 'cotizaciones' },
          },
          {
            id: 'ventas',
            label: 'Ventas',
            path: '/comercial/ventas',
            icon: ShoppingBag,
            description: 'Venta confirmada: descuenta stock y queda lista para facturar.',
            view: { kind: 'resource', resource: 'ventas' },
          },
          {
            id: 'comprobantes',
            label: 'Comprobantes',
            path: '/comercial/comprobantes',
            icon: Receipt,
            description:
              'Facturas y boletas emitidas desde las ventas; generan la cuenta por cobrar.',
            view: { kind: 'resource', resource: 'comprobantes' },
          },
          {
            id: 'notas-credito',
            label: 'Notas de crédito',
            path: '/comercial/notas-credito',
            icon: FileMinus,
            description: 'Devoluciones y descuentos sobre un comprobante emitido.',
            view: { kind: 'resource', resource: 'notas-credito' },
          },
        ],
      },
      {
        id: 'comercial-cobranza',
        title: 'Cobranza',
        items: [
          {
            id: 'cuentas-cobrar',
            label: 'Cuentas por cobrar',
            path: '/comercial/cuentas-cobrar',
            icon: HandCoins,
            description: 'Saldos pendientes de clientes; desde aquí se registra el cobro.',
            view: { kind: 'resource', resource: 'cuentas-cobrar' },
          },
        ],
      },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    path: '/compras',
    icon: PackageCheck,
    module: 'compras',
    description: 'Ciclo de compra: orden, recepción, factura del proveedor y pago.',
    sections: [
      {
        id: 'compras-abastecimiento',
        title: 'Abastecimiento',
        items: [
          {
            id: 'ordenes-compra',
            label: 'Órdenes de compra',
            path: '/compras/ordenes-compra',
            icon: ScrollText,
            description: 'Pedido al proveedor; al aprobarse queda lista para recibir.',
            view: { kind: 'resource', resource: 'ordenes-compra' },
          },
          {
            id: 'recepciones',
            label: 'Recepciones',
            path: '/compras/recepciones',
            icon: Boxes,
            description: 'Ingreso de mercadería contra una orden; aumenta el stock.',
            view: { kind: 'resource', resource: 'recepciones' },
          },
          {
            id: 'facturas-proveedor',
            label: 'Facturas de proveedor',
            path: '/compras/facturas-proveedor',
            icon: FileText,
            description: 'Factura recibida por lo ingresado; genera la cuenta por pagar.',
            view: { kind: 'resource', resource: 'facturas-proveedor' },
          },
        ],
      },
      {
        id: 'compras-pagos',
        title: 'Pagos',
        items: [
          {
            id: 'cuentas-pagar',
            label: 'Cuentas por pagar',
            path: '/compras/cuentas-pagar',
            icon: ReceiptText,
            description: 'Saldos pendientes con proveedores; desde aquí se registra el pago.',
            view: { kind: 'resource', resource: 'cuentas-pagar' },
          },
        ],
      },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    path: '/inventario',
    icon: PackageSearch,
    module: 'inventario',
    description: 'Existencias por almacén, kardex, ajustes y transferencias.',
    sections: [
      {
        id: 'inventario-principal',
        items: [
          {
            id: 'stock',
            label: 'Stock',
            path: '/inventario/stock',
            icon: Package,
            description: 'Existencias y costo promedio por producto y almacén.',
            view: { kind: 'resource', resource: 'stock' },
          },
          {
            id: 'kardex',
            label: 'Kardex',
            path: '/inventario/kardex',
            icon: History,
            description: 'Cada entrada y salida, con el documento que la originó.',
            view: { kind: 'resource', resource: 'kardex' },
          },
          {
            id: 'ajustes',
            label: 'Ajustes',
            path: '/inventario/ajustes',
            icon: SlidersHorizontal,
            description: 'Correcciones por conteo, merma o daño.',
            view: { kind: 'resource', resource: 'ajustes' },
          },
          {
            id: 'transferencias',
            label: 'Transferencias',
            path: '/inventario/transferencias',
            icon: ArrowLeftRight,
            description: 'Traslado de mercadería entre almacenes.',
            view: { kind: 'resource', resource: 'transferencias' },
          },
        ],
      },
    ],
  },
  {
    id: 'tesoreria',
    label: 'Tesorería',
    path: '/tesoreria',
    icon: Landmark,
    module: 'tesoreria',
    description: 'Cobros, pagos y otros movimientos de dinero de las cuentas bancarias.',
    sections: [
      {
        id: 'tesoreria-principal',
        items: [
          {
            id: 'movimientos',
            label: 'Movimientos',
            path: '/tesoreria/movimientos',
            icon: ArrowDownUp,
            description: 'Cobros a clientes, pagos a proveedores y otros ingresos o egresos.',
            view: { kind: 'resource', resource: 'movimientos' },
          },
        ],
      },
    ],
  },
  {
    id: 'documentos',
    label: 'Documentos',
    path: '/documentos',
    icon: FolderOpen,
    module: 'documentos',
    description: 'Archivos adjuntos a clientes, ventas, compras y comprobantes.',
    sections: [
      {
        id: 'documentos-principal',
        items: [
          {
            id: 'repositorio',
            label: 'Repositorio',
            path: '/documentos/repositorio',
            icon: FolderOpen,
            description: 'Sube, vincula y descarga contratos, guías, facturas y otros archivos.',
            view: { kind: 'resource', resource: 'documentos' },
          },
        ],
      },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    path: '/reportes',
    icon: PieChart,
    module: 'reportes',
    description: 'Reportes por área con filtros y exportación a CSV.',
    sections: [
      {
        id: 'reportes-areas',
        items: [
          {
            id: 'reporte-ventas',
            label: 'Ventas',
            path: '/reportes/ventas',
            icon: BarChart3,
            description: 'Ventas por periodo, cliente y producto.',
            view: { kind: 'report', report: 'ventas' },
          },
          {
            id: 'reporte-compras',
            label: 'Compras',
            path: '/reportes/compras',
            icon: BarChart3,
            description: 'Compras por periodo y proveedor.',
            view: { kind: 'report', report: 'compras' },
          },
          {
            id: 'reporte-inventario',
            label: 'Inventario valorizado',
            path: '/reportes/inventario',
            icon: BarChart3,
            description: 'Existencias y valor por almacén y categoría.',
            view: { kind: 'report', report: 'inventario' },
          },
          {
            id: 'reporte-saldos',
            label: 'Cobros y pagos',
            path: '/reportes/saldos',
            icon: BarChart3,
            description: 'Antigüedad de saldos por cobrar y por pagar.',
            view: { kind: 'report', report: 'saldos' },
          },
        ],
      },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    path: '/administracion',
    icon: ShieldCheck,
    module: 'administracion',
    description: 'Usuarios, roles, auditoría y configuración de la empresa.',
    sections: [
      {
        id: 'administracion-seguridad',
        title: 'Seguridad',
        items: [
          {
            id: 'usuarios',
            label: 'Usuarios',
            path: '/administracion/usuarios',
            icon: UserCog,
            description: 'Cuentas de acceso y el rol de cada una.',
            view: { kind: 'resource', resource: 'usuarios' },
          },
          {
            id: 'roles',
            label: 'Roles y permisos',
            path: '/administracion/roles',
            icon: ShieldCheck,
            description: 'Qué módulos puede consultar o registrar cada rol.',
            view: { kind: 'resource', resource: 'roles' },
          },
          {
            id: 'auditoria',
            label: 'Auditoría',
            path: '/administracion/auditoria',
            icon: History,
            description: 'Quién hizo qué y cuándo en cada módulo.',
            view: { kind: 'resource', resource: 'auditoria' },
          },
        ],
      },
      {
        id: 'administracion-empresa',
        title: 'Empresa',
        items: [
          {
            id: 'configuracion',
            label: 'Configuración',
            path: '/administracion/configuracion',
            icon: Settings,
            description:
              'Razón social, RUC, IGV, series de comprobantes y vigencia de cotizaciones.',
            view: { kind: 'settings' },
          },
        ],
      },
    ],
  },
];
