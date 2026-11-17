/**
 * Hook de acceso a datos con caché en módulo.
 * Consume los fetchers async una sola vez
 * por sesión y comparte el resultado entre componentes (sidebar, páginas).
 */
import { useEffect, useState } from 'react';
import { fetchOperadores, fetchTours } from '@/data/mock-tours';
import type { Operador, Tour } from '@/data/mock-tours';

export interface ToursData {
  tours: Tour[];
  operadores: Operador[];
}

let cache: ToursData | null = null;
let inflight: Promise<ToursData> | null = null;

export function clearToursCache() {
  cache = null;
}

function load(): Promise<ToursData> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = Promise.all([fetchTours(), fetchOperadores()])
      .then(([tours, operadores]) => {
        // Las vistas de catálogo ocultan operadores desactivados y sus tours.
        // Administración los sigue viendo porque consulta los fetchers directos.
        const activos = operadores.filter((o) => o.activo);
        const idsActivos = new Set(activos.map((o) => o.id));
        cache = {
          tours: tours.filter((t) => t.activo && idsActivos.has(t.operador.id)),
          operadores: activos,
        };
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useToursData(): ToursData | null {
  const [data, setData] = useState<ToursData | null>(cache);

  useEffect(() => {
    let vivo = true;
    load()
      .then((d) => {
        if (vivo) setData(d);
      })
      .catch(() => {
        // Sin sesión u otro error: dejamos null (RequireAuth redirige a /login).
      });
    return () => {
      vivo = false;
    };
  }, []);

  return data;
}
