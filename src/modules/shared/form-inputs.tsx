import { Paperclip, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import {
  MODULE_IDS,
  type AccessLevel,
  type ModuleId,
  type Permissions,
} from '@/types/administracion';
import type { Product } from '@/types/maestros';
import type { ResourceKey } from '@/types/resources';
import { cn } from '@/utils/cn';
import { findNavMatchByResource } from '@/utils/navigation';
import { formatCurrency, formatDecimal } from '@/utils/format';

import { LIST_DEFINITIONS } from '../list-registry';
import { inputClass, linesTotals, type FormLine } from './form-styles';
import type { FieldValues, LinesSource, LookupSource, SelectOption } from './list-definition';
import { MODULE_LABEL } from './status';
import { useResourceList } from './useResourceList';

// Las fuentes son uniones por recurso; aquí basta con tratarlas de forma genérica.
interface AnyLookup {
  resource: ResourceKey;
  label?: (row: unknown) => string;
  value?: (row: unknown) => string;
  filter?: (row: unknown, values: FieldValues) => boolean;
}

interface AnyLinesSource {
  field: string;
  resource: ResourceKey;
  lines: (record: unknown) => FormLine[];
}

type Row = { id: string } & Record<string, unknown>;

function rowTitleOf(resource: ResourceKey): (row: unknown) => string {
  return LIST_DEFINITIONS[resource].rowTitle as unknown as (row: unknown) => string;
}

function useRows(resource: ResourceKey) {
  const query = useResourceList(resource);
  return { rows: (query.data ?? []) as unknown as Row[], isLoading: query.isPending };
}

interface SelectBaseProps {
  id: string;
  value: string;
  invalid: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

function NativeSelect({
  id,
  value,
  invalid,
  disabled,
  placeholder,
  onChange,
  options,
}: SelectBaseProps & { options: readonly SelectOption[] }) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      aria-invalid={invalid}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      className={inputClass(invalid, 'h-11 cursor-pointer')}
    >
      <option value="">{placeholder ?? 'Selecciona…'}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export const StaticSelect = NativeSelect;

/** Lista vacía: dice dónde se registra lo que falta (ej.: "se registran en Maestros › Almacenes"). */
function emptyLookupText(resource: ResourceKey): string {
  const text = `No hay ${LIST_DEFINITIONS[resource].entity.plural} disponibles`;
  const match = findNavMatchByResource(resource);
  return match ? `${text} (se registran en ${match.group.label} › ${match.item.label})` : text;
}

/**
 * Selector que lista registros de otro recurso (cliente, orden, comprobante…). Si el valor actual
 * ya no cumple el filtro (por ejemplo, una orden recibida al editar), se sigue mostrando.
 */
export function LookupSelect({
  source,
  values,
  ...props
}: SelectBaseProps & { source: LookupSource; values: FieldValues }) {
  const lookup = source as unknown as AnyLookup;
  const { rows, isLoading } = useRows(lookup.resource);
  const labelOf = lookup.label ?? rowTitleOf(lookup.resource);
  const valueOf = lookup.value ?? ((row: unknown) => (row as Row).id);

  const empty = emptyLookupText(lookup.resource);
  const options = rows
    .filter((row) => valueOf(row) === props.value || (lookup.filter?.(row, values) ?? true))
    .map((row) => ({ value: valueOf(row), label: labelOf(row) }));

  return (
    <NativeSelect
      {...props}
      disabled={props.disabled === true || isLoading}
      placeholder={isLoading ? 'Cargando…' : options.length === 0 ? empty : undefined}
      options={options}
    />
  );
}

interface LinesEditorProps {
  id: string;
  value: FormLine[];
  onChange: (lines: FormLine[]) => void;
  price: 'sale' | 'cost';
  source?: LinesSource;
  sourceId: string;
  sourceLabel: string;
  totals: boolean;
  igvRate: number;
  invalid: boolean;
}

function SourceLoader({
  source,
  sourceId,
  value,
  onChange,
}: {
  source: AnyLinesSource;
  sourceId: string;
  value: FormLine[];
  onChange: (lines: FormLine[]) => void;
}) {
  const { rows } = useRows(source.resource);
  const record = rows.find((row) => row.id === sourceId);
  const loadedFor = useRef<string | undefined>(undefined);
  const isEmpty = value.length === 0;

  // Al elegir el documento de origen se cargan sus líneas una sola vez; luego se ajustan a mano.
  useEffect(() => {
    if (!record || loadedFor.current === sourceId) return;
    loadedFor.current = sourceId;
    if (isEmpty) onChange(source.lines(record));
  }, [record, sourceId, isEmpty, onChange, source]);

  return null;
}

/** Líneas de productos: se agregan del catálogo o se toman del documento de origen. */
export function LinesEditor({
  id,
  value,
  onChange,
  price,
  source,
  sourceId,
  sourceLabel,
  totals,
  igvRate,
  invalid,
}: LinesEditorProps) {
  const { rows } = useRows('productos');
  const products = rows as unknown as Product[];
  const fromSource = source !== undefined;
  const available = products.filter(
    (product) =>
      product.status === 'active' && !value.some((line) => line.productId === product.id),
  );

  function updateLine(index: number, patch: Partial<FormLine>) {
    onChange(value.map((line, position) => (position === index ? { ...line, ...patch } : line)));
  }

  function addProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    onChange([
      ...value,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: price === 'sale' ? product.salePrice : product.costPrice,
      },
    ]);
  }

  if (fromSource && !sourceId) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-muted">
        Elige {sourceLabel.toLowerCase()} para cargar sus productos.
      </p>
    );
  }

  const sum = linesTotals(
    value.filter((line) => line.quantity > 0),
    igvRate,
  );

  return (
    <div
      id={id}
      className={cn(
        'overflow-hidden rounded-xl border',
        invalid ? 'border-rose-300' : 'border-line',
      )}
    >
      {fromSource && (
        <SourceLoader
          source={source as unknown as AnyLinesSource}
          sourceId={sourceId}
          value={value}
          onChange={onChange}
        />
      )}
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs text-ink-subtle">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Producto</th>
            <th className="w-24 px-3 py-2 text-right font-semibold">Cant.</th>
            <th className="w-32 px-3 py-2 text-right font-semibold">P. unit.</th>
            <th className="w-28 px-3 py-2 text-right font-semibold">Importe</th>
            {!fromSource && <th className="w-10" aria-label="Quitar" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {value.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-5 text-center text-ink-muted">
                {fromSource ? 'Cargando productos…' : 'Agrega al menos un producto.'}
              </td>
            </tr>
          )}
          {value.map((line, index) => (
            <tr key={line.productId}>
              <td className="px-3 py-2">
                <p className="font-medium text-ink">{line.productName}</p>
                <p className="text-xs text-ink-subtle">
                  {line.sku}
                  {line.max !== undefined && ` · máx. ${formatDecimal(line.max)}`}
                </p>
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={fromSource ? 0 : 1}
                  max={line.max}
                  step={1}
                  aria-label={`Cantidad de ${line.productName}`}
                  value={Number.isFinite(line.quantity) ? line.quantity : ''}
                  onChange={(event) => {
                    const quantity = Math.trunc(Number(event.target.value));
                    const capped = line.max === undefined ? quantity : Math.min(quantity, line.max);
                    updateLine(index, { quantity: Math.max(0, capped) });
                  }}
                  className={inputClass(false, 'h-9 px-2 text-right tabular-nums')}
                />
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {fromSource ? (
                  formatCurrency(line.unitPrice)
                ) : (
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    aria-label={`Precio unitario de ${line.productName}`}
                    value={Number.isFinite(line.unitPrice) ? line.unitPrice : ''}
                    onChange={(event) => {
                      updateLine(index, { unitPrice: Math.max(0, Number(event.target.value)) });
                    }}
                    className={inputClass(false, 'h-9 px-2 text-right tabular-nums')}
                  />
                )}
              </td>
              <td className="px-3 py-2 text-right font-medium tabular-nums">
                {formatCurrency(line.quantity * line.unitPrice)}
              </td>
              {!fromSource && (
                <td className="px-1 py-2 text-center">
                  <button
                    type="button"
                    aria-label={`Quitar ${line.productName}`}
                    onClick={() => {
                      onChange(value.filter((_, position) => position !== index));
                    }}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {!fromSource && (
        <div className="flex items-center gap-2 border-t border-line bg-surface/60 px-3 py-2.5">
          <Plus className="size-4 shrink-0 text-ink-subtle" aria-hidden />
          <select
            aria-label="Agregar producto"
            value=""
            onChange={(event) => {
              addProduct(event.target.value);
            }}
            className={inputClass(false, 'h-9 cursor-pointer')}
          >
            <option value="">
              {available.length === 0
                ? 'No quedan productos activos por agregar'
                : 'Agregar producto…'}
            </option>
            {available.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} · {product.name} ·{' '}
                {formatCurrency(price === 'sale' ? product.salePrice : product.costPrice)}
              </option>
            ))}
          </select>
        </div>
      )}

      {totals && (
        <dl className="space-y-1 border-t border-line px-4 py-3 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(sum.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ink-muted">
            <dt>IGV ({formatDecimal(igvRate * 100)} %)</dt>
            <dd className="tabular-nums">{formatCurrency(sum.igv)}</dd>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCurrency(sum.total)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export const MAX_FILE_BYTES = 1024 * 1024;

export interface PickedFile {
  content: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('No se pudo leer el archivo.'));
    };
    reader.readAsDataURL(file);
  });
}

/** Archivo adjunto: se guarda como data URL en el navegador, por eso el límite de 1 MB. */
export function FileInput({
  id,
  fileName,
  invalid,
  onPick,
  onError,
}: {
  id: string;
  fileName: string;
  invalid: boolean;
  onPick: (file: PickedFile) => void;
  onError: (message: string) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm transition-colors hover:bg-surface',
        invalid ? 'border-rose-300' : 'border-line',
      )}
    >
      <Paperclip className="size-4 shrink-0 text-ink-subtle" aria-hidden />
      <span
        className={cn('min-w-0 truncate', fileName ? 'font-medium text-ink' : 'text-ink-muted')}
      >
        {fileName || 'Elegir archivo…'}
      </span>
      <input
        id={id}
        type="file"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          if (file.size > MAX_FILE_BYTES) {
            onError('El archivo supera 1 MB.');
            return;
          }
          readAsDataUrl(file)
            .then((content) => {
              onPick({
                content,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
              });
            })
            .catch(() => {
              onError('No se pudo leer el archivo.');
            });
        }}
      />
    </label>
  );
}

const LEVELS: { value: AccessLevel; label: string }[] = [
  { value: 'none', label: 'Sin acceso' },
  { value: 'read', label: 'Consulta' },
  { value: 'write', label: 'Registro' },
];

/** Nivel de acceso por módulo: sin acceso, solo consulta o registro (crear y ejecutar acciones). */
export function PermissionsInput({
  value,
  onChange,
}: {
  value: Partial<Permissions>;
  onChange: (permissions: Permissions) => void;
}) {
  const current = Object.fromEntries(
    MODULE_IDS.map((module) => [module, value[module] ?? 'none']),
  ) as Permissions;

  function setLevel(module: ModuleId, level: AccessLevel) {
    onChange({ ...current, [module]: level });
  }

  return (
    <div className="divide-y divide-line rounded-xl border border-line">
      {MODULE_IDS.map((module) => (
        <div key={module} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <span className="text-sm font-medium text-ink">{MODULE_LABEL[module]}</span>
          <div
            role="radiogroup"
            aria-label={`Acceso a ${MODULE_LABEL[module]}`}
            className="flex gap-1"
          >
            {LEVELS.map((level) => {
              const checked = current[module] === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    setLevel(module, level.value);
                  }}
                  className={cn(
                    'cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                    checked
                      ? 'bg-primary-600 text-white'
                      : 'text-ink-muted hover:bg-surface hover:text-ink',
                  )}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
