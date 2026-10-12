import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

function readValue<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Estado persistido en localStorage, solo para preferencias de interfaz.
 * Si el almacenamiento no está disponible (modo privado, bloqueado), funciona como un useState normal.
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readValue(key, fallback, isValid));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sin almacenamiento disponible: la preferencia solo dura la sesión actual.
    }
  }, [key, value]);

  return [value, setValue];
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}
