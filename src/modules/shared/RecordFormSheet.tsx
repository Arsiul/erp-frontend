import { useQuery } from '@tanstack/react-query';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { queryKeys } from '@/services/query-keys';
import { settingsService } from '@/services/settings.service';
import { cn } from '@/utils/cn';
import { formatDecimal } from '@/utils/format';

import {
  FileInput,
  LinesEditor,
  LookupSelect,
  PermissionsInput,
  StaticSelect,
  type PickedFile,
} from './form-inputs';
import { inputClass, type FormLine } from './form-styles';
import type { FieldValues, FormField } from './list-definition';

type FormErrors = Record<string, string | undefined>;
export type FormMode = 'create' | 'edit';

export interface RecordFormSheetProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Contexto del alta, por ejemplo "Desde V-000123". */
  description?: string;
  submitLabel: string;
  mode: FormMode;
  fields: readonly FormField<T>[];
  /** El registro a editar o los valores por defecto (y precargados) de uno nuevo. */
  initialValues: FieldValues;
  /** Si lanza un error, su mensaje se muestra en el formulario y este sigue abierto. */
  onSubmit: (values: FieldValues) => Promise<void>;
}

const DEFAULT_IGV_RATE = 0.18;

function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function asLines(value: unknown): FormLine[] {
  return Array.isArray(value) ? (value as FormLine[]) : [];
}

function isActive<T>(field: FormField<T>, mode: FormMode, values: FieldValues): boolean {
  if (field.only && field.only !== mode) return false;
  return field.visible?.(values) ?? true;
}

function isReadOnly<T>(field: FormField<T>, values: FieldValues): boolean {
  return typeof field.readOnly === 'function' ? field.readOnly(values) : Boolean(field.readOnly);
}

function toInputValue<T>(field: FormField<T>, raw: unknown): unknown {
  switch (field.type) {
    case 'lines':
      return asLines(raw);
    case 'permissions':
      return typeof raw === 'object' && raw !== null ? raw : {};
    default:
      return asText(raw);
  }
}

function validateField<T>(field: FormField<T>, values: FieldValues): string | undefined {
  const value = values[field.key];
  switch (field.type) {
    case 'lines':
      return asLines(value).some((line) => line.quantity > 0)
        ? undefined
        : 'Agrega al menos un producto con cantidad.';
    case 'permissions':
      return undefined;
    case 'file':
      return field.required && !asText(value) ? 'Adjunta un archivo.' : undefined;
    case 'number':
    case 'money': {
      const text = asText(value).trim();
      if (!text) return field.required ? 'Este campo es obligatorio.' : undefined;
      const number = Number(text);
      if (!Number.isFinite(number)) return 'Ingresa un número válido.';
      if (field.min !== undefined && number < field.min) {
        return `Debe ser mayor o igual a ${formatDecimal(field.min)}.`;
      }
      return undefined;
    }
    default: {
      const text = asText(value).trim();
      if (!text) return field.required ? 'Este campo es obligatorio.' : undefined;
      if ('pattern' in field && field.pattern && !field.pattern.regex.test(text)) {
        return field.pattern.message;
      }
      return undefined;
    }
  }
}

/** Convierte lo escrito en el formulario a los valores que espera el servicio. */
function toRecordValues<T>(fields: readonly FormField<T>[], values: FieldValues): FieldValues {
  const result: FieldValues = {};
  for (const field of fields) {
    const value = values[field.key];
    switch (field.type) {
      case 'number':
      case 'money': {
        const text = asText(value).trim();
        if (text) result[field.key] = Number(text);
        break;
      }
      case 'lines':
        result[field.key] = asLines(value)
          .filter((line) => line.quantity > 0)
          .map(({ max, ...line }) => line);
        break;
      case 'file':
        result[field.key] = asText(value);
        result.fileName = values.fileName;
        result.fileSize = values.fileSize;
        result.mimeType = values.mimeType;
        break;
      case 'permissions':
        result[field.key] = value;
        break;
      case 'select':
      case 'date':
        result[field.key] = asText(value);
        break;
      default:
        result[field.key] = asText(value).trim();
    }
  }
  return result;
}

function withoutExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Formulario lateral de alta y edición. Resuelve selectores de otros recursos, líneas de productos
 * (del catálogo o del documento de origen) con sus totales, archivos adjuntos y permisos por módulo.
 */
export function RecordFormSheet<T>({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  mode,
  fields,
  initialValues,
  onSubmit,
}: RecordFormSheetProps<T>) {
  const formId = useId();
  const [values, setValues] = useState<FieldValues>(() => ({
    ...initialValues,
    ...Object.fromEntries(
      fields.map((field) => [field.key, toInputValue(field, initialValues[field.key])]),
    ),
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const activeFields = fields.filter((field) => isActive(field, mode, values));
  const hasLines = activeFields.some((field) => field.type === 'lines');

  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsService.get(),
    enabled: hasLines,
  });
  const igvRate = settings.data?.igvRate ?? DEFAULT_IGV_RATE;

  function setField(key: string, value: unknown) {
    setValues((previous) => {
      const next: FieldValues = { ...previous, [key]: value };
      // Cambiar el documento de origen descarta las líneas que se habían cargado de él.
      for (const field of fields) {
        if (field.type === 'lines' && field.source?.field === key && previous[key] !== value) {
          next[field.key] = [];
        }
      }
      return next;
    });
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function pickFile(key: string, file: PickedFile) {
    const hasNameField = fields.some((field) => field.key === 'name');
    setValues((previous) => ({
      ...previous,
      [key]: file.content,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      ...(hasNameField && !asText(previous.name).trim()
        ? { name: withoutExtension(file.fileName) }
        : {}),
    }));
    setErrors((previous) => ({ ...previous, [key]: undefined, name: undefined }));
  }

  async function handleSubmit() {
    const nextErrors: FormErrors = Object.fromEntries(
      activeFields.map((field) => [field.key, validateField(field, values)]),
    );
    setErrors(nextErrors);
    setSubmitError(undefined);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSaving(true);
    try {
      await onSubmit(toRecordValues(activeFields, values));
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  }

  function renderControl(field: FormField<T>, id: string, invalid: boolean) {
    const value = values[field.key];
    const disabled = isSaving || isReadOnly(field, values);
    const change = (next: unknown) => {
      setField(field.key, next);
    };

    switch (field.type) {
      case 'select': {
        const source =
          typeof field.optionsFrom === 'function' ? field.optionsFrom(values) : field.optionsFrom;
        const common = {
          id,
          value: asText(value),
          invalid,
          disabled,
          placeholder: field.placeholder,
          onChange: change,
        };
        return source ? (
          <LookupSelect key={source.resource} {...common} source={source} values={values} />
        ) : (
          <StaticSelect {...common} options={field.options ?? []} />
        );
      }
      case 'lines': {
        const sourceField = field.source
          ? fields.find((candidate) => candidate.key === field.source?.field)
          : undefined;
        return (
          <LinesEditor
            id={id}
            value={asLines(value)}
            onChange={change}
            price={field.price}
            source={field.source}
            sourceId={field.source ? asText(values[field.source.field]) : ''}
            sourceLabel={sourceField?.label ?? 'el documento de origen'}
            totals={Boolean(field.totals)}
            igvRate={igvRate}
            invalid={invalid}
          />
        );
      }
      case 'file':
        return (
          <FileInput
            id={id}
            fileName={asText(values.fileName)}
            invalid={invalid}
            onPick={(file) => {
              pickFile(field.key, file);
            }}
            onError={(message) => {
              setErrors((previous) => ({ ...previous, [field.key]: message }));
            }}
          />
        );
      case 'permissions':
        return <PermissionsInput value={value ?? {}} onChange={change} />;
      case 'textarea':
        return (
          <textarea
            id={id}
            rows={3}
            value={asText(value)}
            disabled={disabled}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            onChange={(event) => {
              change(event.target.value);
            }}
            className={inputClass(invalid, 'resize-y py-2.5')}
          />
        );
      default: {
        const isMoney = field.type === 'money';
        const isNumber = field.type === 'number' || isMoney;
        return (
          <div className="relative">
            {isMoney && (
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-ink-subtle">
                S/
              </span>
            )}
            <input
              id={id}
              type={isNumber ? 'number' : field.type}
              inputMode={isMoney ? 'decimal' : isNumber ? 'numeric' : undefined}
              step={isMoney ? '0.01' : undefined}
              min={isNumber && 'min' in field ? field.min : undefined}
              value={asText(value)}
              disabled={disabled}
              placeholder={field.placeholder}
              aria-invalid={invalid}
              onChange={(event) => {
                change(event.target.value);
              }}
              className={inputClass(invalid, cn('h-11', isMoney && 'pl-10'))}
            />
          </div>
        );
      }
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!isSaving) onOpenChange(next);
      }}
      size={hasLines ? 'lg' : 'md'}
      title={title}
      description={description}
      footer={
        <>
          <Button
            variant="ghost"
            disabled={isSaving}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSaving}>
            {isSaving && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="grid gap-x-4 gap-y-5 sm:grid-cols-2"
      >
        {submitError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 sm:col-span-2"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {submitError}
          </p>
        )}
        {activeFields.map((field) => {
          const id = `${formId}-${field.key}`;
          const error = errors[field.key];
          const wide =
            field.fullWidth === true || field.type === 'lines' || field.type === 'permissions';
          const isGroup = field.type === 'lines' || field.type === 'permissions';
          const labelClass = 'mb-1.5 block text-sm font-semibold text-ink';
          return (
            <div key={field.key} className={cn('min-w-0', wide && 'sm:col-span-2')}>
              {isGroup ? (
                <p className={labelClass}>{field.label}</p>
              ) : (
                <label htmlFor={id} className={labelClass}>
                  {field.label}
                  {field.required && <span className="ml-0.5 text-rose-500">*</span>}
                </label>
              )}
              {renderControl(field, id, Boolean(error))}
              {error ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
              ) : (
                field.hint && <p className="mt-1.5 text-xs text-ink-subtle">{field.hint}</p>
              )}
            </div>
          );
        })}
      </form>
    </Sheet>
  );
}
