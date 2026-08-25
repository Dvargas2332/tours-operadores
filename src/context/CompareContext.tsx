/**
 * Selección de tours para el comparador (0–3), compartida entre el
 * buscador, la barra flotante, el badge de la sidebar y /comparar.
 * Persistida en localStorage.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export const MAX_COMPARAR = 3;
const KEY = 'tourhub-comparar';

interface CompareContextValue {
  seleccionados: number[];
  toggle: (id: number) => void;
  quitar: (id: number) => void;
  limpiar: () => void;
  estaSeleccionado: (id: number) => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function leerInicial(): number[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => Number.isInteger(n)).slice(0, MAX_COMPARAR) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [seleccionados, setSeleccionados] = useState<number[]>(leerInicial);

  useEffect(() => {
    window.localStorage.setItem(KEY, JSON.stringify(seleccionados));
  }, [seleccionados]);

  const toggle = useCallback((id: number) => {
    setSeleccionados((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARAR) return prev; // máximo 3
      return [...prev, id];
    });
  }, []);

  const quitar = useCallback((id: number) => {
    setSeleccionados((prev) => prev.filter((x) => x !== id));
  }, []);

  const limpiar = useCallback(() => setSeleccionados([]), []);

  const estaSeleccionado = useCallback((id: number) => seleccionados.includes(id), [seleccionados]);

  const value = useMemo(
    () => ({ seleccionados, toggle, quitar, limpiar, estaSeleccionado }),
    [seleccionados, toggle, quitar, limpiar, estaSeleccionado],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare debe usarse dentro de <CompareProvider>');
  return ctx;
}
