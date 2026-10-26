import type { StoredDocument } from '@/types/documentos';
import type { ResourceKey, ResourceMap } from '@/types/resources';

import type { ResourceCapabilities } from '../mocks/business';
import { sessionService } from '../session.service';
import { ApiError, api, download } from './client';
import { API_URL } from './config';

type Values = Record<string, unknown>;

const NOTHING: ResourceCapabilities = { create: false, update: false, remove: false, actions: [] };

/** Prefijo de la URL que identifica un archivo guardado en el servidor (no un data URL local). */
const FILE_URL_PREFIX = `${API_URL}/documentos/`;

const path = (resource: ResourceKey, id?: string) =>
  id === undefined ? `/${resource}` : `/${resource}/${encodeURIComponent(id)}`;

/**
 * El backend no devuelve el contenido de los documentos: `content` pasa a ser la URL de descarga,
 * así la ficha sigue mostrando el archivo y el formulario de edición no exige subirlo otra vez.
 */
function withFileUrl<K extends ResourceKey>(resource: K, row: ResourceMap[K]): ResourceMap[K] {
  if (resource !== 'documentos') return row;
  const doc = row as StoredDocument;
  return { ...doc, content: `${FILE_URL_PREFIX}${encodeURIComponent(doc.id)}/file` } as ResourceMap[K];
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header = '', payload = ''] = dataUrl.split(',', 2);
  const mime = /^data:([^;,]+)/.exec(header)?.[1] ?? 'application/octet-stream';
  if (!header.includes(';base64')) return new Blob([decodeURIComponent(payload)], { type: mime });
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Multipart de POST/PATCH /documentos: el archivo viaja solo si el usuario eligió uno nuevo. */
function documentForm(values: Values): FormData {
  const form = new FormData();
  for (const key of ['name', 'category', 'linkedResource', 'linkedId'] as const) {
    const value = values[key];
    if (typeof value === 'string' || typeof value === 'number') form.append(key, String(value));
  }
  const content = values.content;
  if (typeof content === 'string' && content.startsWith('data:')) {
    const fileName = typeof values.fileName === 'string' && values.fileName ? values.fileName : 'archivo';
    form.append('file', dataUrlToBlob(content), fileName);
  }
  return form;
}

export const remote = {
  async list<K extends ResourceKey>(resource: K): Promise<ResourceMap[K][]> {
    const rows = await api.get<ResourceMap[K][]>(path(resource));
    return rows.map((row) => withFileUrl(resource, row));
  },

  unseen(resource: ResourceKey): Promise<string[]> {
    return api.get<string[]>(`${path(resource)}/unseen`);
  },

  async markSeen(resource: ResourceKey, id: string): Promise<void> {
    await api.post(`${path(resource, id)}/seen`);
  },

  async get<K extends ResourceKey>(resource: K, id: string): Promise<ResourceMap[K] | null> {
    try {
      return withFileUrl(resource, await api.get<ResourceMap[K]>(path(resource, id)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async create<K extends ResourceKey>(resource: K, values: object): Promise<ResourceMap[K]> {
    const saved =
      resource === 'documentos'
        ? await api.postForm<ResourceMap[K]>(path(resource), documentForm(values as Values))
        : await api.post<ResourceMap[K]>(path(resource), values);
    return withFileUrl(resource, saved);
  },

  async update<K extends ResourceKey>(
    resource: K,
    id: string,
    values: object,
  ): Promise<ResourceMap[K]> {
    const saved =
      resource === 'documentos'
        ? await api.patchForm<ResourceMap[K]>(path(resource, id), documentForm(values as Values))
        : await api.patch<ResourceMap[K]>(path(resource, id), values);
    return withFileUrl(resource, saved);
  },

  async remove(resource: ResourceKey, id: string): Promise<void> {
    await api.delete(path(resource, id));
  },

  async runAction<K extends ResourceKey>(
    resource: K,
    id: string,
    actionId: string,
  ): Promise<ResourceMap[K]> {
    const saved = await api.post<ResourceMap[K]>(
      `${path(resource, id)}/${encodeURIComponent(actionId)}`,
    );
    return withFileUrl(resource, saved);
  },

  /** Capacidades que GET /auth/me informó para el rol actual. */
  capabilities(resource: ResourceKey): ResourceCapabilities {
    return sessionService.capabilitiesOf(resource) ?? NOTHING;
  },
};

/** true si `url` apunta a un archivo del servidor, que necesita el token para descargarse. */
export function isServerFile(url: string): boolean {
  return url.startsWith(FILE_URL_PREFIX);
}

/** Descarga un archivo del servidor con el token y lo guarda con su nombre. */
export async function saveServerFile(url: string, fileName: string): Promise<void> {
  const blob = await download(url.slice(API_URL.length));
  const href = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => {
      URL.revokeObjectURL(href);
    }, 0);
  }
}
