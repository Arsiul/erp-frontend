import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Download } from 'lucide-react';
import { useParams } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { resourcePath } from '@/config/routes';
import { INVOICE_KIND, INVOICE_STATUS, PAYMENT_TERM } from '@/modules/shared/status';
import { queryKeys } from '@/services/query-keys';
import { resourcesService } from '@/services/resources.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency, formatDate, formatDecimal } from '@/utils/format';

/**
 * Comprobante emitido en una página propia, con el formato de impresión. "Descargar PDF" usa el
 * diálogo de impresión del navegador (Guardar como PDF); el archivo toma el número del comprobante.
 */
export function InvoicePage() {
  const { id = '' } = useParams();
  const invoice = useQuery({
    queryKey: queryKeys.resourceRecord('comprobantes', id),
    queryFn: () => resourcesService.get('comprobantes', id),
  });
  const saleId = invoice.data?.saleId ?? '';
  const customerId = invoice.data?.customerId ?? '';
  const sale = useQuery({
    queryKey: queryKeys.resourceRecord('ventas', saleId),
    queryFn: () => resourcesService.get('ventas', saleId),
    enabled: saleId !== '',
  });
  // Maestros puede estar restringido para el usuario: sin cliente se omite la dirección.
  const customer = useQuery({
    queryKey: queryKeys.resourceRecord('clientes', customerId),
    queryFn: () => resourcesService.get('clientes', customerId),
    enabled: customerId !== '',
    retry: false,
  });
  const settings = useQuery({ queryKey: queryKeys.settings, queryFn: () => settingsService.get() });

  const breadcrumbs = [
    { label: 'Inicio', to: '/' },
    { label: 'Comprobantes', to: resourcePath('comprobantes') },
    { label: invoice.data?.number ?? 'Comprobante' },
  ];

  if (invoice.isPending || settings.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Comprobante" breadcrumbs={breadcrumbs} />
        <Skeleton className="h-[640px] w-full" />
      </div>
    );
  }

  if (!invoice.data || !settings.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Comprobante" breadcrumbs={breadcrumbs} />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title="No se encontró el comprobante"
            description="Puede que se haya eliminado o que no tengas acceso."
          />
        </Card>
      </div>
    );
  }

  const doc = invoice.data;
  const company = settings.data;
  const status = INVOICE_STATUS[doc.status];
  const title = `${INVOICE_KIND[doc.kind]} electrónica`;

  function downloadPdf() {
    const previous = document.title;
    document.title = doc.number;
    window.print();
    document.title = previous;
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title={`${INVOICE_KIND[doc.kind]} ${doc.number}`}
          description={`Venta ${doc.saleNumber} · ${doc.customerName}`}
          breadcrumbs={breadcrumbs}
          actions={
            <Button onClick={downloadPdf}>
              <Download className="size-4" aria-hidden />
              Descargar PDF
            </Button>
          }
        />
      </div>

      <Card id="invoice-print" className="mx-auto max-w-4xl p-8 text-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div className="space-y-1">
            <p className="text-lg font-bold text-ink">{company.companyName}</p>
            {company.address && <p className="text-ink-muted">{company.address}</p>}
            {company.phone && <p className="text-ink-muted">Tel.: {company.phone}</p>}
            {company.email && <p className="text-ink-muted">{company.email}</p>}
          </div>
          <div className="min-w-56 rounded-lg border-2 border-ink px-5 py-3 text-center">
            <p className="font-semibold">RUC {company.ruc}</p>
            <p className="mt-1 font-bold uppercase">{title}</p>
            <p className="mt-1 font-mono text-base">{doc.number}</p>
          </div>
        </header>

        <section className="grid gap-x-8 gap-y-2 border-b border-line py-6 sm:grid-cols-2">
          <Field label="Cliente" value={doc.customerName} />
          <Field label={customer.data?.documentType ?? 'Documento'} value={doc.customerDocument} />
          <Field label="Dirección" value={customer.data?.address} />
          <Field label="Fecha de emisión" value={formatDate(doc.issuedAt)} />
          <Field label="Fecha de vencimiento" value={formatDate(doc.dueAt)} />
          <Field
            label="Condición de pago"
            value={sale.data ? PAYMENT_TERM[sale.data.paymentTerm] : undefined}
          />
          <Field label="Venta" value={doc.saleNumber} />
          <Field label="Vendedor" value={sale.data?.seller} />
          <Field label="Almacén" value={sale.data?.warehouseName} />
          <div className="flex items-center gap-2">
            <span className="w-40 shrink-0 text-ink-muted">Estado</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
        </section>

        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted uppercase">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Código</th>
              <th className="py-2 pr-2">Descripción</th>
              <th className="py-2 pr-2 text-right">Cant.</th>
              <th className="py-2 pr-2 text-right">P. unit.</th>
              <th className="py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((line, index) => (
              <tr key={`${line.productId}-${String(index)}`} className="border-b border-line/60">
                <td className="py-2 pr-2 text-ink-muted">{index + 1}</td>
                <td className="py-2 pr-2 font-mono text-xs">{line.sku}</td>
                <td className="py-2 pr-2">{line.productName}</td>
                <td className="py-2 pr-2 text-right">{formatDecimal(line.quantity)}</td>
                <td className="py-2 pr-2 text-right">{formatCurrency(line.unitPrice)}</td>
                <td className="py-2 text-right">{formatCurrency(line.quantity * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-6 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-sm space-y-1 text-xs text-ink-muted">
            {sale.data?.notes && <p>Observaciones: {sale.data.notes}</p>}
            {doc.creditedAmount > 0 && (
              <p>Notas de crédito aplicadas: {formatCurrency(doc.creditedAmount)}</p>
            )}
          </div>
          <dl className="min-w-64 space-y-1">
            <Total label="Op. gravada" value={doc.subtotal} />
            <Total label={`IGV (${String(Math.round(company.igvRate * 100))} %)`} value={doc.igv} />
            <Total label="Importe total" value={doc.total} strong />
          </dl>
        </section>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-40 shrink-0 text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value === undefined || value === '' ? '—' : value}</span>
    </div>
  );
}

function Total({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div
      className={
        strong
          ? 'flex justify-between gap-8 border-t border-line pt-2 text-base font-bold'
          : 'flex justify-between gap-8'
      }
    >
      <dt>{label}</dt>
      <dd>{formatCurrency(value)}</dd>
    </div>
  );
}
