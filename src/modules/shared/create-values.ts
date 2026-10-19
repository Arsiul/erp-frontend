import type { FieldValues, FormField } from './list-definition';

/**
 * Valores de un alta: de lo precargado solo pasa lo que el formulario no muestra; un campo oculto
 * (ej.: los productos al vender desde una cotización) no debe tapar lo que trae el documento de origen.
 */
export function createValues<T>(
  fields: readonly FormField<T>[] | undefined,
  initialValues: FieldValues,
  values: FieldValues,
): FieldValues {
  const fieldKeys = new Set<string>(fields?.map((field) => field.key));
  const carried = Object.entries(initialValues).filter(([key]) => !fieldKeys.has(key));
  return { ...Object.fromEntries(carried), ...values };
}
