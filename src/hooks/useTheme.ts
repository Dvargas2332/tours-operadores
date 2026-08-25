/**
 * Tema claro/oscuro persistido en localStorage (design.md §2, §6.2).
 * Aplica/quita la clase `.dark` en <html>.
 */
import { useCallback, useEffect, useState } from 'react';

export type Tema = 'light' | 'dark';

const KEY = 'tourhub-tema';

function temaInicial(): Tema {
  if (typeof window === 'undefined') return 'light';
  const guardado = window.localStorage.getItem(KEY);
  if (guardado === 'dark' || guardado === 'light') return guardado;
  return 'light'; // recepción iluminada: claro por defecto
}

export function useTheme() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    window.localStorage.setItem(KEY, tema);
  }, [tema]);

  const toggle = useCallback(() => {
    setTema((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { tema, toggle };
}
