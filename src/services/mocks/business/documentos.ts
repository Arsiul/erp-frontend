import { RESOURCE_KEYS, type ResourceKey } from '@/types/resources';

import type { Store } from '../store';

import { fail, isoDateTime, optionalText, requireText } from './context';
import { pickEnum, type RecordInput, type ResourceRules } from './rules';

/** Límite del archivo guardado en localStorage. */
export const MAX_DOCUMENT_BYTES = 1024 * 1024;

const CATEGORIES = ['contract', 'invoice', 'guide', 'order', 'other'] as const;

/** Etiqueta legible del registro vinculado: su número, código o nombre. */
function recordLabel(record: object): string {
  for (const field of ['number', 'documentNumber', 'code', 'sku', 'name'] as const) {
    const value = (record as Record<string, unknown>)[field];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

function linkValues(store: Store, input: RecordInput<'documentos'>) {
  const linkedResource = optionalText(input.linkedResource);
  const linkedId = optionalText(input.linkedId);
  if (!linkedResource || !linkedId) return { linkedResource: '', linkedId: '', linkedLabel: '' };
  if (!RESOURCE_KEYS.includes(linkedResource as ResourceKey))
    fail('El módulo vinculado no existe.');
  const record = store.get(linkedResource as ResourceKey, linkedId);
  if (!record) fail('El registro vinculado ya no existe.');
  return { linkedResource, linkedId, linkedLabel: recordLabel(record) };
}

function fileValues(input: RecordInput<'documentos'>) {
  const content = requireText(input.content, 'Adjunta un archivo.');
  if (!content.startsWith('data:')) fail('El archivo no es válido.');
  const fileSize = Number(input.fileSize);
  if (!Number.isFinite(fileSize) || fileSize <= 0) fail('El archivo está vacío.');
  if (fileSize > MAX_DOCUMENT_BYTES) fail('El archivo supera 1 MB.');
  return {
    fileName: requireText(input.fileName, 'Adjunta un archivo.'),
    fileSize,
    mimeType: optionalText(input.mimeType) || 'application/octet-stream',
    content,
  };
}

const documentos: ResourceRules<'documentos'> = {
  create(store, ctx, input) {
    return store.insert('documentos', {
      name: requireText(input.name, 'Escribe un nombre para el documento.'),
      category: pickEnum(input.category, CATEGORIES, 'Elige la categoría.', 'other'),
      ...linkValues(store, input),
      ...fileValues(input),
      uploadedAt: isoDateTime(ctx.now),
      uploadedBy: ctx.userName,
    });
  },
  update(store, _ctx, current, input) {
    const merged = { ...current, ...input };
    const replacesFile = Boolean(input.content) && input.content !== current.content;
    return store.update('documentos', current.id, {
      name: requireText(merged.name, 'Escribe un nombre para el documento.'),
      category: pickEnum(merged.category, CATEGORIES, 'Elige la categoría.'),
      ...linkValues(store, merged),
      ...(replacesFile && fileValues(merged)),
    });
  },
  remove(store, _ctx, current) {
    store.remove('documentos', current.id);
  },
};

export const documentosRules = { documentos };
