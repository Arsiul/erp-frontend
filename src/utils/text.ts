/** Minúsculas y sin tildes, para búsquedas tolerantes ("órdenes" coincide con "ordenes"). */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

const NON_WORD = /[^\p{L}\p{N}]+/u;

/**
 * Indica si todos los términos de la búsqueda aparecen en los textos, ignorando tildes y mayúsculas.
 * Un término simple debe coincidir con el inicio de una palabra ("venta" no encuentra "Inventario");
 * un término con símbolos ("F001-0023") se busca tal cual en cualquier parte.
 */
export function matchesSearch(texts: readonly string[], query: string): boolean {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = normalizeText(texts.join(' '));
  const words = haystack.split(NON_WORD).filter(Boolean);

  return terms.every((term) =>
    NON_WORD.test(term) ? haystack.includes(term) : words.some((word) => word.startsWith(term)),
  );
}

/** Iniciales de un nombre: "Usuario Demo" → "UD". */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}
