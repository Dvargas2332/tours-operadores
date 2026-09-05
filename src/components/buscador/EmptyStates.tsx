/**
 * Estados del área de resultados (buscador.md §5): inicial, sin resultados
 * y error. Ilustraciones SVG hechas a mano (public/) + copy cálido.
 */
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { ChipsSugerencias } from '@/components/buscador/SearchBar';
import type { Sugerencia } from '@/components/buscador/SearchBar';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Estado inicial: antes de buscar o filtrar */
export function EstadoInicial({ totalTours, totalOperadores, onElegir }: {
  totalTours: number;
  totalOperadores: number;
  onElegir: (s: Sugerencia) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <motion.img
        src="./empty-initial.svg"
        alt="Volcán Arenal al atardecer con lago y kayaks"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="w-[280px] max-w-full"
      />
      {/* Pulso de respiración sutil */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.015, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden"
      />
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
        className="mt-6 text-h3 text-ink"
      >
        {totalTours > 0 ? 'Encuentra el tour perfecto' : 'Aún no hay tours cargados'}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.16, ease: EASE }}
        className="mt-2 max-w-md text-small text-ink-muted"
      >
        {totalTours > 0
          ? `Escribe lo que necesitas o usa los filtros. ${totalTours} tours de ${totalOperadores} operadores listos para consultar.`
          : 'Agrega operadores y sus tarifarios desde Administración para empezar a buscar.'}
      </motion.p>
      {totalTours > 0 && (
        <div className="mt-6 flex justify-center">
          <ChipsSugerencias grandes onElegir={onElegir} />
        </div>
      )}
    </div>
  );
}

/** Sin resultados: sugerencia dinámica de qué filtro quitar */
export function EstadoSinResultados({
  sugerencia,
  onLimpiar,
}: {
  sugerencia: string | null;
  onLimpiar: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <motion.img
        src="./empty-search.svg"
        alt="Binoculares sobre un mapa con ruta punteada"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="w-[280px] max-w-full"
      />
      <h2 className="mt-6 text-h3 text-ink">Sin tours con esos filtros</h2>
      <p className="mt-2 max-w-md text-small text-ink-muted">
        {sugerencia ?? 'Prueba quitar algún filtro o ampliar el rango de precio.'}
      </p>
      <button
        type="button"
        onClick={onLimpiar}
        className="mt-5 h-10 rounded-r-sm border border-border bg-surface px-4 text-sm font-medium text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

/** Error de carga */
export function EstadoError({ onReintentar }: { onReintentar: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-volcan-soft">
        <AlertTriangle className="h-7 w-7 text-warn" />
      </div>
      <h2 className="mt-4 text-h3 text-ink">No pudimos cargar los tours</h2>
      <p className="mt-2 text-small text-ink-muted">Revisa la conexión y reintenta.</p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-5 h-10 rounded-r-sm bg-brand px-5 text-sm font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]"
      >
        Reintentar
      </button>
    </div>
  );
}
