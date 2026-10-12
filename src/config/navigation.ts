import {
  ArrowLeftRight,
  Boxes,
  Building,
  Building2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileInput,
  FileText,
  FolderOpen,
  HandCoins,
  Hash,
  History,
  Landmark,
  LayoutDashboard,
  Package,
  PackageCheck,
  PackageSearch,
  PackageX,
  PieChart,
  PiggyBank,
  Receipt,
  ReceiptText,
  ScrollText,
  Settings,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  TrendingUp,
  Truck,
  Users,
  UserCog,
  Wallet,
  Warehouse,
} from 'lucide-react';

import type { NavGroup } from '@/types/navigation';

/**
 * Fuente única de la estructura del ERP (estructura.md v2).
 * La barra lateral, el panel contextual, las rutas, los breadcrumbs y la búsqueda se generan desde aquí.
 */
export const NAVIGATION: readonly NavGroup[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/',
    icon: LayoutDashboard,
    description: 'Indicadores, alertas y resumen del negocio.',
    sections: [],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    path: '/comercial',
    icon: ShoppingCart,
    description: 'Ciclo de venta: desde la cotización hasta el comprobante.',
    sections: [
      {
        id: 'comercial-principal',
        items: [
          {
            id: 'clientes',
            label: 'Clientes',
            path: '/comercial/clientes',
            icon: Users,
            description:
              'Datos, contactos, condición de pago, línea de crédito y estado de cuenta de cada cliente.',
            buildStep: 3,
          },
          {
            id: 'cotizaciones',
            label: 'Cotizaciones',
            path: '/comercial/cotizaciones',
            icon: FileText,
            description:
              'Propuestas de precio con validez, descuentos e IGV, convertibles en pedido.',
            buildStep: 5,
          },
          {
            id: 'pedidos',
            label: 'Pedidos',
            path: '/comercial/pedidos',
            icon: ClipboardList,
            description:
              'Pedidos de clientes con validación de stock y crédito, y atención parcial.',
            buildStep: 5,
          },
          {
            id: 'ventas',
            label: 'Ventas',
            path: '/comercial/ventas',
            icon: Receipt,
            description:
              'Facturas y boletas emitidas. Cada venta descuenta stock y genera su cuenta por cobrar.',
            buildStep: 5,
          },
          {
            id: 'notas-credito',
            label: 'Notas de crédito',
            path: '/comercial/notas-credito',
            icon: ReceiptText,
            description: 'Devoluciones y descuentos posteriores sobre ventas emitidas.',
            buildStep: 7,
          },
        ],
      },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    path: '/compras',
    icon: Truck,
    description: 'Abastecimiento: reposición, órdenes, recepción y facturas de proveedor.',
    sections: [
      {
        id: 'compras-principal',
        items: [
          {
            id: 'proveedores',
            label: 'Proveedores',
            path: '/compras/proveedores',
            icon: Building2,
            description:
              'Datos, contactos, condiciones de pago y estado de cuenta de cada proveedor.',
            buildStep: 3,
          },
          {
            id: 'reposicion',
            label: 'Reposición de stock',
            path: '/compras/reposicion',
            icon: PackageSearch,
            description:
              'Productos bajo stock mínimo con cantidad sugerida, listos para generar órdenes de compra.',
            buildStep: 7,
          },
          {
            id: 'ordenes-compra',
            label: 'Órdenes de compra',
            path: '/compras/ordenes',
            icon: ClipboardCheck,
            description:
              'Órdenes a proveedores con aprobación, fecha de entrega y almacén de destino.',
            buildStep: 4,
          },
          {
            id: 'recepciones',
            label: 'Recepciones',
            path: '/compras/recepciones',
            icon: PackageCheck,
            description: 'Ingreso de mercadería contra una orden de compra, total o parcial.',
            buildStep: 4,
          },
          {
            id: 'facturas-proveedor',
            label: 'Facturas de proveedor',
            path: '/compras/facturas',
            icon: FileInput,
            description:
              'Facturas recibidas, validadas contra lo recibido. Generan la cuenta por pagar.',
            buildStep: 4,
          },
          {
            id: 'devoluciones-proveedor',
            label: 'Devoluciones a proveedor',
            path: '/compras/devoluciones',
            icon: PackageX,
            description: 'Salida de productos defectuosos o errados hacia el proveedor.',
            buildStep: 7,
          },
        ],
      },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    path: '/inventario',
    icon: Package,
    description: 'Catálogo de productos, existencias por almacén y movimientos internos.',
    sections: [
      {
        id: 'inventario-catalogo',
        title: 'Catálogo',
        items: [
          {
            id: 'productos',
            label: 'Productos',
            path: '/inventario/productos',
            icon: Package,
            description:
              'Código, categoría, marca, unidad, precio, costo, stock mínimo y proveedor habitual.',
            buildStep: 2,
          },
          {
            id: 'catalogos',
            label: 'Categorías y marcas',
            path: '/inventario/catalogos',
            icon: Tags,
            description: 'Categorías, marcas y unidades de medida usadas por los productos.',
            buildStep: 2,
          },
          {
            id: 'almacenes',
            label: 'Almacenes',
            path: '/inventario/almacenes',
            icon: Warehouse,
            description: 'Almacén principal y sedes, con su dirección y responsable.',
            buildStep: 2,
          },
        ],
      },
      {
        id: 'inventario-existencias',
        title: 'Existencias',
        items: [
          {
            id: 'stock',
            label: 'Stock',
            path: '/inventario/stock',
            icon: Boxes,
            description: 'Existencias y valorizado por producto y almacén.',
            buildStep: 2,
          },
          {
            id: 'kardex',
            label: 'Kardex',
            path: '/inventario/kardex',
            icon: History,
            description: 'Historial de entradas, salidas y saldos valorizados por producto.',
            buildStep: 2,
          },
          {
            id: 'transferencias',
            label: 'Transferencias',
            path: '/inventario/transferencias',
            icon: ArrowLeftRight,
            description: 'Traslado de mercadería entre almacenes con confirmación de recepción.',
            buildStep: 7,
          },
          {
            id: 'ajustes',
            label: 'Ajustes',
            path: '/inventario/ajustes',
            icon: SlidersHorizontal,
            description: 'Correcciones por inventario físico, merma o rotura, con aprobación.',
            buildStep: 7,
          },
        ],
      },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    path: '/finanzas',
    icon: Wallet,
    description: 'Lo que nos deben, lo que debemos y dónde está el dinero.',
    sections: [
      {
        id: 'finanzas-principal',
        items: [
          {
            id: 'cuentas-cobrar',
            label: 'Cuentas por cobrar',
            path: '/finanzas/cuentas-cobrar',
            icon: HandCoins,
            description: 'Saldos pendientes de clientes, antigüedad de deuda y registro de cobros.',
            buildStep: 6,
          },
          {
            id: 'cuentas-pagar',
            label: 'Cuentas por pagar',
            path: '/finanzas/cuentas-pagar',
            icon: CreditCard,
            description:
              'Obligaciones con proveedores, calendario de vencimientos y registro de pagos.',
            buildStep: 6,
          },
          {
            id: 'tesoreria',
            label: 'Tesorería',
            path: '/finanzas/tesoreria',
            icon: Landmark,
            description:
              'Cajas y cuentas bancarias, movimientos, cierres de caja y transferencias.',
            buildStep: 6,
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
    description: 'Repositorio central de archivos de la empresa en la nube.',
    sections: [
      {
        id: 'documentos-principal',
        items: [
          {
            id: 'repositorio',
            label: 'Repositorio',
            path: '/documentos/repositorio',
            icon: FolderOpen,
            description:
              'Comprobantes, contratos, fichas técnicas y otros archivos, vinculados a cada operación.',
            buildStep: 8,
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
    description: 'Información consolidada y exportable para la toma de decisiones.',
    sections: [
      {
        id: 'reportes-areas',
        title: 'Por área',
        items: [
          {
            id: 'reportes-comerciales',
            label: 'Comerciales',
            path: '/reportes/comerciales',
            icon: TrendingUp,
            description: 'Ventas por período, cliente, vendedor y producto; conversión y utilidad.',
            buildStep: 9,
          },
          {
            id: 'reportes-compras',
            label: 'Compras',
            path: '/reportes/compras',
            icon: ShoppingBag,
            description:
              'Compras por proveedor y producto, órdenes pendientes y comparativo de precios.',
            buildStep: 9,
          },
          {
            id: 'reportes-inventario',
            label: 'Inventario',
            path: '/reportes/inventario',
            icon: Boxes,
            description: 'Stock valorizado, productos críticos, sin movimiento y rotación.',
            buildStep: 9,
          },
          {
            id: 'reportes-financieros',
            label: 'Financieros',
            path: '/reportes/financieros',
            icon: PiggyBank,
            description: 'Antigüedad de deuda, morosidad, calendario de pagos y flujo de caja.',
            buildStep: 9,
          },
        ],
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    path: '/sistema',
    icon: Settings,
    description: 'Seguridad, auditoría y configuración del ERP.',
    sections: [
      {
        id: 'sistema-seguridad',
        title: 'Seguridad',
        items: [
          {
            id: 'usuarios',
            label: 'Usuarios',
            path: '/sistema/usuarios',
            icon: UserCog,
            description: 'Alta, bloqueo y baja de usuarios, con sus roles y almacén por defecto.',
            buildStep: 1,
          },
          {
            id: 'roles',
            label: 'Roles y permisos',
            path: '/sistema/roles',
            icon: ShieldCheck,
            description: 'Roles del negocio y permisos por submódulo y acción.',
            buildStep: 1,
          },
          {
            id: 'auditoria',
            label: 'Auditoría',
            path: '/sistema/auditoria',
            icon: ScrollText,
            description: 'Registro inmutable de quién hizo qué, dónde y cuándo.',
            buildStep: 1,
          },
        ],
      },
      {
        id: 'sistema-configuracion',
        title: 'Configuración',
        items: [
          {
            id: 'empresa',
            label: 'Empresa',
            path: '/sistema/empresa',
            icon: Building,
            description: 'Razón social, RUC, logo, IGV y moneda.',
            buildStep: 1,
          },
          {
            id: 'series',
            label: 'Series de comprobantes',
            path: '/sistema/series',
            icon: Hash,
            description: 'Series y correlativos de facturas, boletas y notas de crédito por sede.',
            buildStep: 1,
          },
          {
            id: 'parametros',
            label: 'Parámetros',
            path: '/sistema/parametros',
            icon: Settings2,
            description: 'Reglas del negocio: descuentos, crédito, stock y aprobaciones.',
            buildStep: 1,
          },
        ],
      },
    ],
  },
];

/** Total de pasos del plan de construcción (estructura.md §9.2). */
export const BUILD_STEPS_TOTAL = 9;
