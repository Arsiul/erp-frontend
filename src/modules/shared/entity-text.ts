import type { EntityName } from './list-definition';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Frases de interfaz concordadas en género con el registro ("Nuevo cliente", "Cotización eliminada"). */
export function entityText({ singular, gender }: EntityName) {
  const feminine = gender === 'f';
  const article = feminine ? 'la' : 'el';
  const ending = feminine ? 'a' : 'o';

  return {
    newLabel: `${feminine ? 'Nueva' : 'Nuevo'} ${singular}`,
    editLabel: `Editar ${singular}`,
    created: `${capitalize(singular)} cread${ending}.`,
    updated: `${capitalize(singular)} actualizad${ending}.`,
    deleted: `${capitalize(singular)} eliminad${ending}.`,
    deleteTitle: `¿Eliminar ${article} ${singular}?`,
  };
}
