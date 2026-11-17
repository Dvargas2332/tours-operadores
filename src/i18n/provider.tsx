/**
 * Provider de internacionalización (i18n): idioma (ES/EN) y función t() con
 * fallback al español.
 */
import { useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { I18nContext, type I18nState } from './context';
import type { Diccionario, Idioma } from './types';
import esCommon from './es/common';
import enCommon from './en/common';
import esBuscador from './es/buscador';
import enBuscador from './en/buscador';
import esDetalle from './es/detalle';
import enDetalle from './en/detalle';
import esShell from './es/shell';
import enShell from './en/shell';

const TEXTOS: Record<Idioma, Diccionario> = {
  es: { ...esCommon, ...esBuscador, ...esDetalle, ...esShell },
  en: { ...enCommon, ...enBuscador, ...enDetalle, ...enShell },
};

export function I18nProvider({ children }: { children: ReactNode }) {
  // El sitio quedó en español al eliminar la bienvenida; ya no hay selector.
  const idioma: Idioma = 'es';

  const t = useCallback(
    (clave: string, vars?: Record<string, string | number>) => {
      let s = TEXTOS[idioma][clave] ?? TEXTOS.es[clave] ?? clave;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      }
      return s;
    },
    [idioma],
  );

  // Sin selector de nacionalidad, el sitio muestra las tarifas de Costa Rica.
  const esCostaRica = true;
  // El operador (nombre/logo) solo se muestra al admin; los clientes ven tours anónimos.
  const { autenticado } = useAuth();
  const mostrarOperador = autenticado;

  const value = useMemo<I18nState>(
    () => ({ idioma, t, esCostaRica, mostrarOperador }),
    [idioma, t, esCostaRica, mostrarOperador],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
