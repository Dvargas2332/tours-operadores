/**
 * Provider de internacionalización (i18n): idioma (ES/EN), nacionalidad del
 * cliente y función t() con fallback al español. Las preferencias se persisten
 * en localStorage para no volver a preguntar en visitas futuras.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { I18nContext, type I18nState } from './context';
import type { Diccionario, Idioma } from './types';
import esCommon from './es/common';
import enCommon from './en/common';
import esWelcome from './es/welcome';
import enWelcome from './en/welcome';
import esBuscador from './es/buscador';
import enBuscador from './en/buscador';
import esDetalle from './es/detalle';
import enDetalle from './en/detalle';
import esShell from './es/shell';
import enShell from './en/shell';

const TEXTOS: Record<Idioma, Diccionario> = {
  es: { ...esCommon, ...esWelcome, ...esBuscador, ...esDetalle, ...esShell },
  en: { ...enCommon, ...enWelcome, ...enBuscador, ...enDetalle, ...enShell },
};

const IDIOMA_KEY = 'tours-idioma';
const NACIONALIDAD_KEY = 'tours-nacionalidad';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdiomaState] = useState<Idioma>(
    () => (localStorage.getItem(IDIOMA_KEY) as Idioma) || 'es',
  );
  const [idiomaElegido, setIdiomaElegido] = useState(() => localStorage.getItem(IDIOMA_KEY) != null);
  const [nacionalidad, setNacionalidadState] = useState<string | null>(() =>
    localStorage.getItem(NACIONALIDAD_KEY),
  );

  const setIdioma = useCallback((i: Idioma) => {
    localStorage.setItem(IDIOMA_KEY, i);
    setIdiomaState(i);
    setIdiomaElegido(true);
  }, []);

  const setNacionalidad = useCallback((n: string) => {
    localStorage.setItem(NACIONALIDAD_KEY, n);
    setNacionalidadState(n);
  }, []);

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

  const esCostaRica = nacionalidad === 'Costa Rica';
  const preferenciasListas = idiomaElegido && nacionalidad != null;
  // El operador (nombre/logo) solo se muestra al admin; los clientes ven tours anónimos.
  const { autenticado } = useAuth();
  const mostrarOperador = autenticado;

  const value = useMemo<I18nState>(
    () => ({ idioma, idiomaElegido, setIdioma, t, nacionalidad, setNacionalidad, preferenciasListas, esCostaRica, mostrarOperador }),
    [idioma, idiomaElegido, setIdioma, t, nacionalidad, setNacionalidad, preferenciasListas, esCostaRica, mostrarOperador],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
