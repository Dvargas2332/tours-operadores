import { createContext, useContext } from 'react';
import type { Idioma } from './types';

export interface I18nState {
  idioma: Idioma;
  t: (clave: string, vars?: Record<string, string | number>) => string;
  esCostaRica: boolean;
  /** true solo para el admin (sesión activa): muestra nombre/logo de operadores. */
  mostrarOperador: boolean;
}

export const I18nContext = createContext<I18nState | null>(null);

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>');
  return ctx;
}
