import { ArrowRight, Receipt } from 'lucide-react';
import { Link } from 'react-router';

import { DataTable } from '@/components/data-table/DataTable';
import type { Column } from '@/components/data-table/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SALE_STATUS } from '@/modules/shared/status';
import type { RecentSale } from '@/types/dashboard';

const COLUMNS: readonly Column<RecentSale>[] = [
  { id: 'number', header: 'Venta', kind: 'code', value: (row) => row.number },
  { id: 'customer', header: 'Cliente', kind: 'muted', value: (row) => row.customerName },
  {
    id: 'invoice',
    header: 'Comprobante',
    kind: 'code',
    value: (row) => row.invoiceNumber || '—',
    hideBelow: 'md',
  },
  { id: 'issued', header: 'Fecha', kind: 'date', value: (row) => row.issuedAt },
  { id: 'total', header: 'Total', kind: 'money', value: (row) => row.total },
  { id: 'status', header: 'Estado', kind: 'badge', value: (row) => SALE_STATUS[row.status] },
];

export function RecentSalesCard({ sales }: { sales: RecentSale[] }) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader
        title="Últimas ventas"
        description="Registradas recientemente, con su comprobante si ya se facturaron"
        action={
          <Link
            to="/comercial/ventas"
            className="inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-primary-700 transition-colors hover:text-primary-900"
          >
            Ver todas
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />
      {sales.length > 0 ? (
        <DataTable columns={COLUMNS} rows={sales} label="Últimas ventas" className="mt-4" />
      ) : (
        <EmptyState
          icon={Receipt}
          title="Sin ventas registradas"
          description="Las ventas del período aparecerán aquí."
        />
      )}
    </Card>
  );
}
