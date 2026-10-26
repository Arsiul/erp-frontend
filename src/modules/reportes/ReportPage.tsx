import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CircleAlert, Download, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { DataTable } from '@/components/data-table/DataTable';
import type { Column } from '@/components/data-table/types';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { inputClass } from '@/modules/shared/form-styles';
import { queryKeys } from '@/services/query-keys';
import { reportsService } from '@/services/reports.service';
import type { NavGroup, NavItem } from '@/types/navigation';
import type { ReportColumn, ReportFilters, ReportId, ReportKpi, ReportRow } from '@/types/reports';
import { downloadCsv, toCsv } from '@/utils/csv';
import { todayIso } from '@/utils/dates';
import { formatCompactCurrency, formatCurrency, formatInteger } from '@/utils/format';
import { getGroupEntryPath } from '@/utils/navigation';

type TableRow = ReportRow & { id: string };

interface ReportPageProps {
  report: ReportId;
  group: NavGroup;
  item: NavItem;
}

function asText(value: ReportRow[string] | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function asNumber(value: ReportRow[string] | undefined): number {
  return typeof value === 'number' ? value : 0;
}

/** Columna del reporte → columna de la tabla compartida (misma presentación y mismo CSV). */
function toColumn({ id, header, kind }: ReportColumn): Column<TableRow> {
  switch (kind) {
    case 'money':
      return { id, header, kind: 'money', value: (row) => asNumber(row[id]) };
    case 'number':
      return { id, header, kind: 'number', value: (row) => asNumber(row[id]) };
    case 'percent':
      return { id, header, kind: 'number', unit: '%', value: (row) => asNumber(row[id]) };
    case 'date':
      return { id, header, kind: 'date', value: (row) => asText(row[id]) };
    case 'code':
      return { id, header, kind: 'code', value: (row) => asText(row[id]) };
    case 'text':
      return { id, header, kind: 'text', value: (row) => asText(row[id]) };
  }
}

function KpiTile({ kpi }: { kpi: ReportKpi }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-semibold text-ink-subtle">{kpi.label}</p>
      <p className="mt-1 text-xl font-bold text-ink tabular-nums">
        {kpi.kind === 'money' ? formatCurrency(kpi.value) : formatInteger(kpi.value)}
      </p>
    </Card>
  );
}

/** Reporte con filtros, indicadores, gráfico y detalle exportable a CSV. */
export function ReportPage({ report, group, item }: ReportPageProps) {
  const [filters, setFilters] = useState<ReportFilters>({});

  const spec = useQuery({
    queryKey: queryKeys.reportFilters(report),
    queryFn: () => reportsService.filters(report),
  });
  const result = useQuery({
    queryKey: queryKeys.report(report, filters),
    queryFn: () => reportsService.run(report, filters),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo(() => (result.data?.columns ?? []).map(toColumn), [result.data]);
  const rows = useMemo<TableRow[]>(
    () => (result.data?.rows ?? []).map((row, index) => ({ ...row, id: String(index) })),
    [result.data],
  );
  const hasFilters = Boolean(filters.from ?? filters.to ?? filters.party);

  function setFilter(key: keyof ReportFilters, value: string) {
    setFilters((current) => {
      const { [key]: _previous, ...rest } = current;
      return value ? { ...rest, [key]: value } : rest;
    });
  }

  function exportCsv() {
    downloadCsv(`reporte-${report}-${todayIso()}.csv`, toCsv(columns, rows));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Reporte de ${item.label.toLowerCase()}`}
        description={item.description}
        breadcrumbs={[
          { label: 'Inicio', to: '/' },
          { label: group.label, to: getGroupEntryPath(group) },
          { label: item.label },
        ]}
      />

      <Card className="flex flex-wrap items-end gap-4 px-5 py-4">
        {spec.data?.dates && (
          <>
            <label className="grid gap-1 text-xs font-semibold text-ink-subtle">
              Desde
              <input
                type="date"
                className={inputClass(false)}
                value={filters.from ?? ''}
                max={filters.to}
                onChange={(event) => {
                  setFilter('from', event.target.value);
                }}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-subtle">
              Hasta
              <input
                type="date"
                className={inputClass(false)}
                value={filters.to ?? ''}
                min={filters.from}
                onChange={(event) => {
                  setFilter('to', event.target.value);
                }}
              />
            </label>
          </>
        )}
        {spec.data?.party && (
          <label className="grid min-w-52 gap-1 text-xs font-semibold text-ink-subtle">
            {spec.data.party.label}
            <select
              className={inputClass(false)}
              value={filters.party ?? ''}
              onChange={(event) => {
                setFilter('party', event.target.value);
              }}
            >
              <option value="">Todos</option>
              {spec.data.party.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="ml-auto flex gap-2">
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({});
              }}
            >
              Quitar filtros
            </Button>
          )}
          <Button variant="soft" disabled={rows.length === 0} onClick={exportCsv}>
            <Download className="size-4" aria-hidden />
            Exportar CSV
          </Button>
        </div>
      </Card>

      {result.isPending ? (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          role="status"
          aria-label="Calculando reporte"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : result.isError ? (
        <Card>
          <EmptyState
            icon={CircleAlert}
            title="No se pudo calcular el reporte"
            description={result.error.message}
            action={
              <Button
                variant="soft"
                onClick={() => {
                  void result.refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {result.data.kpis.map((kpi) => (
              <KpiTile key={kpi.id} kpi={kpi} />
            ))}
          </div>

          {result.data.chart.some((point) => point.value > 0) && (
            <Card>
              <CardHeader title={result.data.title} description="Montos en soles" />
              <div className="h-64 px-2 pt-4 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...result.data.chart]}
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--color-line)"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      cursor={{ fill: 'var(--color-surface)' }}
                    />
                    <Bar
                      dataKey="value"
                      name="Monto"
                      fill="var(--color-primary-600)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            {rows.length > 0 ? (
              <DataTable columns={columns} rows={rows} label={result.data.title} />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Sin datos para estos filtros"
                description="Amplía el rango de fechas o quita los filtros."
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
