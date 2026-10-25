/** Vista de resultados de tours compartida entre el buscador y los operadores. */
export type Vista = 'grid' | 'lista';

export const VISTA_KEY = 'tourhub-vista';

/** Preferencia guardada del usuario; cae en `grid` si no hay nada válido. */
export function vistaInicial(): Vista {
  if (typeof window === 'undefined') return 'grid';
  return window.localStorage.getItem(VISTA_KEY) === 'lista' ? 'lista' : 'grid';
}
