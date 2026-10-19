import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Save } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { toast } from 'sonner';

import { DemoDataBadge } from '@/components/DemoDataBadge';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSession } from '@/hooks/useSession';
import { inputClass } from '@/modules/shared/form-styles';
import { queryKeys } from '@/services/query-keys';
import { settingsService } from '@/services/settings.service';
import type { Settings } from '@/types/administracion';
import type { NavGroup, NavItem } from '@/types/navigation';
import { getGroupEntryPath } from '@/utils/navigation';

interface SettingsPageProps {
  group: NavGroup;
  item: NavItem;
}

/** El formulario trabaja con texto; el IGV se edita en porcentaje. */
type Draft = Record<keyof Settings, string>;

function toDraft(settings: Settings): Draft {
  return {
    companyName: settings.companyName,
    ruc: settings.ruc,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    igvRate: String(Math.round(settings.igvRate * 10000) / 100),
    invoiceSeries: settings.invoiceSeries,
    receiptSeries: settings.receiptSeries,
    creditNoteSeries: settings.creditNoteSeries,
    quoteValidityDays: String(settings.quoteValidityDays),
  };
}

function fromDraft(draft: Draft): Settings {
  return {
    ...draft,
    igvRate: Number(draft.igvRate) / 100,
    quoteValidityDays: Number(draft.quoteValidityDays),
  };
}

interface FieldSpec {
  key: keyof Settings;
  label: string;
  type?: 'text' | 'email' | 'number' | 'tel';
  hint?: string;
  wide?: boolean;
}

const SECTIONS: readonly { title: string; description: string; fields: readonly FieldSpec[] }[] = [
  {
    title: 'Empresa',
    description: 'Datos que aparecen en los comprobantes.',
    fields: [
      { key: 'companyName', label: 'Razón social', wide: true },
      { key: 'ruc', label: 'RUC', hint: '11 dígitos' },
      { key: 'phone', label: 'Teléfono', type: 'tel' },
      { key: 'address', label: 'Dirección', wide: true },
      { key: 'email', label: 'Correo', type: 'email' },
    ],
  },
  {
    title: 'Facturación',
    description:
      'Se aplica a las cotizaciones, ventas y comprobantes que se registren desde ahora.',
    fields: [
      { key: 'igvRate', label: 'IGV (%)', type: 'number', hint: 'Entre 0 y 50' },
      { key: 'quoteValidityDays', label: 'Vigencia de cotizaciones (días)', type: 'number' },
      { key: 'invoiceSeries', label: 'Serie de facturas', hint: 'Ej.: F001' },
      { key: 'receiptSeries', label: 'Serie de boletas', hint: 'Ej.: B001' },
      { key: 'creditNoteSeries', label: 'Serie de notas de crédito', hint: 'Ej.: FC01' },
    ],
  },
];

function SettingsForm({ initial, canWrite }: { initial: Settings; canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => toDraft(initial));
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (values: Settings) => settingsService.save(values),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.settings, saved);
      void queryClient.invalidateQueries({ queryKey: ['resources', 'auditoria'] });
      setDraft(toDraft(saved));
      toast.success('Configuración guardada');
    },
  });

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(initial));

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await save.mutateAsync(fromDraft(draft));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.');
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-6" noValidate>
      {SECTIONS.map((section) => (
        <Card key={section.title} className="pb-5">
          <CardHeader title={section.title} description={section.description} />
          <div className="grid gap-4 px-5 pt-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <label
                key={field.key}
                className={`grid gap-1.5 text-sm font-medium text-ink ${field.wide ? 'sm:col-span-2' : ''}`}
              >
                {field.label}
                <input
                  type={field.type ?? 'text'}
                  step={field.key === 'igvRate' ? '0.01' : undefined}
                  className={inputClass(false, 'h-10')}
                  value={draft[field.key]}
                  disabled={!canWrite || save.isPending}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, [field.key]: event.target.value }));
                  }}
                />
                {field.hint && (
                  <span className="text-xs font-normal text-ink-subtle">{field.hint}</span>
                )}
              </label>
            ))}
          </div>
        </Card>
      ))}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {canWrite ? (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            disabled={!dirty || save.isPending}
            onClick={() => {
              setDraft(toDraft(initial));
              setError(null);
            }}
          >
            Descartar
          </Button>
          <Button type="submit" disabled={!dirty || save.isPending}>
            <Save className="size-4" aria-hidden />
            {save.isPending ? 'Guardando…' : 'Guardar configuración'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Tu rol solo permite consultar la configuración.</p>
      )}
    </form>
  );
}

/** Datos de la empresa y parámetros de facturación. */
export function SettingsPage({ group, item }: SettingsPageProps) {
  const { can } = useSession();
  const settings = useQuery({ queryKey: queryKeys.settings, queryFn: () => settingsService.get() });

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.label}
        description={item.description}
        breadcrumbs={[
          { label: 'Inicio', to: '/' },
          { label: group.label, to: getGroupEntryPath(group) },
          { label: item.label },
        ]}
        actions={<DemoDataBadge />}
      />
      {settings.isPending ? (
        <div className="space-y-4" role="status" aria-label="Cargando configuración">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      ) : settings.isError ? (
        <Card>
          <EmptyState
            icon={CircleAlert}
            title="No se pudo cargar la configuración"
            description={settings.error.message}
          />
        </Card>
      ) : (
        <SettingsForm initial={settings.data} canWrite={can('administracion', 'write')} />
      )}
    </div>
  );
}
