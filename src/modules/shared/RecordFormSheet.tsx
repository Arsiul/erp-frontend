import { LoaderCircle } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/utils/cn';

import type { FormField } from './list-definition';

type FormValues = Record<string, string>;
type FormErrors = Record<string, string | undefined>;

export interface RecordFormSheetProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  fields: readonly FormField<T>[];
  /** Valores iniciales: el registro a editar o los valores por defecto de uno nuevo. */
  initialValues: Partial<Omit<T, 'id'>>;
  onSubmit: (values: Partial<Omit<T, 'id'>>) => Promise<void>;
}

function toInputValue(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' ? value : '';
}

function validate<T>(fields: readonly FormField<T>[], values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const field of fields) {
    const raw = (values[field.key] ?? '').trim();
    if (field.required && raw === '') {
      errors[field.key] = 'Este campo es obligatorio.';
      continue;
    }
    if (raw === '') continue;
    if (field.type === 'number' || field.type === 'money') {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) errors[field.key] = 'Escribe un número.';
      else if (field.min !== undefined && parsed < field.min)
        errors[field.key] = `Debe ser mayor o igual a ${String(field.min)}.`;
    } else if ('pattern' in field && field.pattern && !field.pattern.regex.test(raw)) {
      errors[field.key] = field.pattern.message;
    }
  }
  return errors;
}

/**
 * Convierte los textos del formulario al tipo de cada campo.
 * Los campos ya fueron validados, y cada clave pertenece al registro (lo garantiza FormField<T>):
 * por eso la conversión final al tipo del registro es segura.
 */
function toRecordValues<T>(fields: readonly FormField<T>[], values: FormValues) {
  const result: Record<string, string | number> = {};
  for (const field of fields) {
    const raw = (values[field.key] ?? '').trim();
    result[field.key] = field.type === 'number' || field.type === 'money' ? Number(raw || 0) : raw;
  }
  return result as Partial<Omit<T, 'id'>>;
}

/**
 * Formulario genérico de alta y edición, generado a partir de la definición de campos.
 * Quien lo usa debe darle una `key` distinta en cada apertura para que parta de `initialValues`.
 */
export function RecordFormSheet<T>({
  open,
  onOpenChange,
  title,
  submitLabel,
  fields,
  initialValues,
  onSubmit,
}: RecordFormSheetProps<T>) {
  const formId = useId();
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(fields.map((field) => [field.key, toInputValue(initialValues[field.key])])),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    const nextErrors = validate(fields, values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSaving(true);
    try {
      await onSubmit(toRecordValues(fields, values));
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!isSaving) onOpenChange(next);
      }}
      title={title}
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
        className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2"
      >
        {fields.map((field) => {
          const inputId = `${formId}-${field.key}`;
          const error = errors[field.key];
          const describedBy = error
            ? `${inputId}-error`
            : field.hint
              ? `${inputId}-hint`
              : undefined;
          const common = {
            id: inputId,
            name: field.key,
            value: values[field.key] ?? '',
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
            disabled: isSaving,
            className: cn(
              'w-full rounded-xl border bg-white px-3.5 text-sm text-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-ink-subtle focus:ring-4 disabled:opacity-60',
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                : 'border-line hover:border-primary-200 focus:border-primary-400 focus:ring-primary-100',
            ),
            onChange: (event: { target: { value: string } }) => {
              setValues((current) => ({ ...current, [field.key]: event.target.value }));
              if (error) setErrors((current) => ({ ...current, [field.key]: undefined }));
            },
          };

          return (
            <div key={field.key} className={cn(field.fullWidth && 'sm:col-span-2')}>
              <label
                htmlFor={inputId}
                className="mb-1.5 block text-xs font-semibold text-ink-muted"
              >
                {field.label}
                {field.required && <span className="text-rose-500"> *</span>}
              </label>

              {field.type === 'select' ? (
                <select {...common} className={cn(common.className, 'h-10 cursor-pointer')}>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  {...common}
                  rows={3}
                  placeholder={field.placeholder}
                  className={cn(common.className, 'resize-none py-2.5')}
                />
              ) : (
                <div className="relative">
                  {field.type === 'money' && (
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-subtle">
                      S/
                    </span>
                  )}
                  <input
                    {...common}
                    type={field.type === 'money' ? 'number' : field.type}
                    inputMode={
                      field.type === 'money' || field.type === 'number' ? 'decimal' : undefined
                    }
                    step={
                      field.type === 'money' ? '0.01' : field.type === 'number' ? '1' : undefined
                    }
                    placeholder={field.placeholder}
                    className={cn(
                      common.className,
                      'h-10',
                      field.type === 'money' && 'pl-9 tabular-nums',
                    )}
                  />
                </div>
              )}

              {error ? (
                <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-rose-600">
                  {error}
                </p>
              ) : (
                field.hint && (
                  <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-subtle">
                    {field.hint}
                  </p>
                )
              )}
            </div>
          );
        })}
      </form>
    </Sheet>
  );
}
