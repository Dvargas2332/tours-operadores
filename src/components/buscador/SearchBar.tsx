/**
 * Barra de búsqueda libre con IA (buscador.md §1): placeholder rotativo,
 * botón acento "Buscar" con Sparkles, atajo `/`, chips de sugerencias
 * rápidas y estado "Interpretando…".
 */
import { forwardRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Leaf, Search, Sparkles, Sunset, Waves, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const PLACEHOLDERS = [
  'Ej.: canopy en Arenal para 2 adultos y 1 niño, menos de $250…',
  'Ej.: rafting con almuerzo que salga temprano…',
  'Ej.: algo tranquilo con aguas termales para hoy en la tarde…',
];

export interface Sugerencia {
  label: string;
  texto: string;
  icon: LucideIcon;
}

export const SUGERENCIAS: Sugerencia[] = [
  { label: 'Aventura bajo $80', texto: 'aventura bajo $80', icon: Zap },
  { label: 'Rafting con almuerzo', texto: 'rafting con almuerzo', icon: Waves },
  { label: 'Apto niños pequeños', texto: 'apto para niños pequeños', icon: Baby },
  { label: 'Salidas en la tarde', texto: 'salidas en la tarde', icon: Sunset },
  { label: 'Naturaleza día completo', texto: 'naturaleza día completo', icon: Leaf },
];

interface SearchBarProps {
  valor: string;
  onCambio: (v: string) => void;
  onBuscar: () => void;
  interpretando: boolean;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { valor, onCambio, onBuscar, interpretando },
  ref,
) {
  const [idxPlaceholder, setIdxPlaceholder] = useState(0);

  // Placeholder rotativo cada 6s (crossfade 250ms)
  useEffect(() => {
    const id = setInterval(() => setIdxPlaceholder((i) => (i + 1) % PLACEHOLDERS.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-[860px]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />

      {/* Placeholder animado (overlay cuando el input está vacío) */}
      {valor === '' && (
        <div className="pointer-events-none absolute left-11 right-32 top-1/2 -translate-y-1/2 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={idxPlaceholder}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="block truncate text-[15px] text-ink-faint"
            >
              {PLACEHOLDERS[idxPlaceholder]}
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      <input
        ref={ref}
        type="text"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onBuscar();
          if (e.key === 'Escape') {
            onCambio('');
            e.currentTarget.blur();
          }
        }}
        aria-label="Búsqueda libre de tours"
        className="h-[52px] w-full rounded-r-md border-[1.5px] border-border bg-surface pl-11 pr-[130px] text-[15px] text-ink outline-none transition-[border-color,box-shadow] duration-fast focus:border-brand focus:ring-[3px] focus:ring-brand/15"
      />

      {/* Shimmer mientras interpreta */}
      {interpretando && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-r-md">
          <div className="shimmer absolute inset-0 opacity-25" />
        </div>
      )}

      {/* Hint de atajo */}
      <kbd className="pointer-events-none absolute right-[124px] top-1/2 hidden -translate-y-1/2 rounded-md bg-surface-2 px-1.5 py-0.5 text-caption text-ink-muted md:block">
        /
      </kbd>

      {/* Botón Buscar (acento IA) */}
      <button
        type="button"
        onClick={onBuscar}
        disabled={interpretando}
        className="absolute right-1.5 top-1/2 flex h-10 w-[112px] -translate-y-1/2 items-center justify-center gap-1.5 rounded-r-sm bg-volcan text-sm font-semibold text-white transition-all duration-fast hover:brightness-105 active:scale-[0.98] disabled:opacity-80"
      >
        <Sparkles className={interpretando ? 'h-4 w-4 animate-spin-soft' : 'h-4 w-4'} />
        {interpretando ? 'Interpretando…' : 'Buscar'}
      </button>
    </div>
  );
});

export default SearchBar;

/** Fila de chips de sugerencias rápidas */
export function ChipsSugerencias({
  onElegir,
  grandes = false,
}: {
  onElegir: (s: Sugerencia) => void;
  grandes?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SUGERENCIAS.map((s, i) => (
        <motion.button
          key={s.label}
          type="button"
          onClick={() => onElegir(s)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.12 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -1 }}
          className={`flex items-center gap-1.5 rounded-full border border-border bg-surface text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink ${
            grandes ? 'px-3.5 py-2 text-small' : 'px-2.5 py-1 text-caption'
          }`}
        >
          <s.icon className="h-3 w-3" />
          {s.label}
        </motion.button>
      ))}
    </div>
  );
}
