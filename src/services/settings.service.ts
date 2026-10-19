import type { Settings } from '@/types/administracion';

import { BusinessError } from './mocks/business';
import { isoDateTime } from './mocks/business/context';
import { withLatency } from './mocks/latency';
import { mockDb } from './mocks/mock-db';
import { sessionService } from './session.service';

const SERIES_PATTERN = /^[A-Z][A-Z0-9]{3}$/;

function fail(message: string): never {
  throw new BusinessError(message);
}

function text(value: string, message: string): string {
  const trimmed = value.trim();
  return trimmed || fail(message);
}

function series(value: string, label: string): string {
  const normalized = value.trim().toUpperCase();
  if (!SERIES_PATTERN.test(normalized))
    fail(`La serie de ${label} debe tener 4 caracteres, empezando por una letra (ej.: F001).`);
  return normalized;
}

/** Valida y normaliza la configuración antes de guardarla. */
export function validateSettings(values: Settings): Settings {
  const ruc = values.ruc.trim();
  if (!/^\d{11}$/.test(ruc)) fail('El RUC debe tener 11 dígitos.');
  if (!Number.isFinite(values.igvRate) || values.igvRate < 0 || values.igvRate > 0.5) {
    fail('El IGV debe estar entre 0 % y 50 %.');
  }
  if (
    !Number.isInteger(values.quoteValidityDays) ||
    values.quoteValidityDays < 1 ||
    values.quoteValidityDays > 365
  ) {
    fail('La vigencia de las cotizaciones debe estar entre 1 y 365 días.');
  }
  const normalized: Settings = {
    companyName: text(values.companyName, 'Escribe la razón social.'),
    ruc,
    address: values.address.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    igvRate: values.igvRate,
    invoiceSeries: series(values.invoiceSeries, 'facturas'),
    receiptSeries: series(values.receiptSeries, 'boletas'),
    creditNoteSeries: series(values.creditNoteSeries, 'notas de crédito'),
    quoteValidityDays: values.quoteValidityDays,
  };
  const used = [normalized.invoiceSeries, normalized.receiptSeries, normalized.creditNoteSeries];
  if (new Set(used).size !== used.length)
    fail('Cada tipo de comprobante necesita una serie distinta.');
  return normalized;
}

/** Datos de la empresa y parámetros de facturación (IGV, series, vigencia de cotizaciones). */
export const settingsService = {
  get(): Promise<Settings> {
    return withLatency(() => mockDb.read((store) => store.settings()));
  },

  save(values: Settings): Promise<Settings> {
    return withLatency(() => {
      const session = sessionService.assertAccess('administracion', 'write');
      const settings = validateSettings(values);
      return mockDb.transaction((store) => {
        store.saveSettings(settings);
        store.insert('auditoria', {
          date: isoDateTime(new Date()),
          userName: session.user.name,
          module: 'administracion',
          resource: 'configuracion',
          action: 'Actualizó',
          reference: 'Configuración',
        });
        return settings;
      });
    });
  },
};
