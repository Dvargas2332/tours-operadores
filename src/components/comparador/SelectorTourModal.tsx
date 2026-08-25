/**
 * Modal selector de tour para el comparador (comparador.md §2).
 * Buscador en vivo sobre nombre/operador/zona; sugiere primero los tours
 * de la misma categoría o zona de los ya seleccionados.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { formatPrecio } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { CATEGORIA_META } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const DOT_CAT: Record<string, string> = {
  aventura: 'bg-cat-aventura',
  naturaleza: 'bg-cat-naturaleza',
  acuatico: 'bg-cat-acuatico',
  cultural: 'bg-cat-cultural',
  termas: 'bg-cat-termas',
};

interface SelectorTourModalProps {
  open: boolean;
  onClose: () => void;
  tours: Tour[];
  seleccionados: number[];
  onElegir: (id: number) => void;
}

export default function SelectorTourModal({ open, onClose, tours, seleccionados, onElegir }: SelectorTourModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const disponibles = useMemo(() => tours.filter((t) => !seleccionados.includes(t.id)), [tours, seleccionados]);

  const lista = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtrados = q
      ? disponibles.filter(
          (t) =>
            t.nombre.toLowerCase().includes(q) ||
            t.operador.nombre.toLowerCase().includes(q) ||
            t.zona.toLowerCase().includes(q),
        )
      : disponibles;
    // Sugerencia inteligente: primero misma categoría o zona de los seleccionados
    const elegidos = tours.filter((t) => seleccionados.includes(t.id));
    const puntaje = (t: Tour) =>
      elegidos.reduce(
        (acc, e) => acc + (e.categoria === t.categoria ? 2 : 0) + (e.zona === t.zona ? 1 : 0),
        0,
      );
    return [...filtrados].sort((a, b) => puntaje(b) - puntaje(a));
  }, [disponibles, query, tours, seleccionados]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[rgba(27,36,30,0.35)]"
            aria-hidden
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Agregar tour al comparador"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="pointer-events-auto flex max-h-[70vh] w-full max-w-[520px] flex-col overflow-hidden rounded-r-lg border border-border bg-surface shadow-overlay"
            >
              {/* Buscador interno */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-ink-faint" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, operador o zona…"
                  className="h-9 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Lista de tours */}
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {lista.length === 0 ? (
                  <p className="px-3 py-8 text-center text-small text-ink-muted">
                    {disponibles.length === 0
                      ? 'Ya agregaste todos los tours disponibles.'
                      : 'Sin tours que coincidan con la búsqueda.'}
                  </p>
                ) : (
                  <ul>
                    {lista.map((tour, i) => {
                      const cat = CATEGORIA_META[tour.categoria];
                      return (
                        <motion.li
                          key={tour.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, ease: EASE, delay: Math.min(i, 10) * 0.025 }}
                        >
                          <button
                            type="button"
                            onClick={() => onElegir(tour.id)}
                            className="flex h-11 w-full items-center gap-3 rounded-r-sm px-3 text-left transition-colors duration-fast hover:bg-surface-2"
                          >
                            <span
                              className={cn('h-2.5 w-2.5 shrink-0 rounded-full', DOT_CAT[tour.categoria])}
                              title={cat.label}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">{tour.nombre}</span>
                              <span className="block truncate text-caption text-ink-faint">
                                {tour.operador.nombre} · {tour.zona}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-ink tnum">
                              {formatPrecio(tour.precio_adulto, tour.moneda)}
                            </span>
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
