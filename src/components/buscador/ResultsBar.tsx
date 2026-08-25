/**
 * Barra de resultados (buscador.md §4): select de orden + toggle de vista
 * grid/lista (segmented con indicador deslizante layoutId). La preferencia
 * de vista se persiste en localStorage desde la página.
 */
import { LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { ORDEN_OPCIONES } from '@/lib/filtros';
import type { Orden } from '@/lib/filtros';
import { cn } from '@/lib/utils';

export type Vista = 'grid' | 'lista';

interface ResultsBarProps {
  orden: Orden;
  onCambioOrden: (o: Orden) => void;
  vista: Vista;
  onCambioVista: (v: Vista) => void;
}

export default function ResultsBar({ orden, onCambioOrden, vista, onCambioVista }: ResultsBarProps) {
  return (
    <div className="flex h-10 items-center gap-3">
      <label className="flex items-center gap-2 text-caption text-ink-muted">
        Ordenar:
        <select
          value={orden}
          onChange={(e) => onCambioOrden(e.target.value as Orden)}
          className="h-8 rounded-r-sm border border-border bg-surface px-2 text-small font-medium text-ink outline-none transition-colors duration-fast focus:border-brand"
        >
          {ORDEN_OPCIONES.map((op) => (
            <option key={op.key} value={op.key}>
              {op.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex-1" />

      {/* Toggle de vista */}
      <div className="flex rounded-full bg-surface-2 p-0.5" role="tablist" aria-label="Vista de resultados">
        {(
          [
            { key: 'grid', icon: LayoutGrid, label: 'Tarjetas' },
            { key: 'lista', icon: List, label: 'Lista' },
          ] as const
        ).map((op) => (
          <button
            key={op.key}
            type="button"
            role="tab"
            aria-selected={vista === op.key}
            title={op.label}
            onClick={() => onCambioVista(op.key)}
            className={cn(
              'relative flex h-7 w-9 items-center justify-center rounded-full transition-colors duration-fast',
              vista === op.key ? 'text-brand' : 'text-ink-faint hover:text-ink-muted',
            )}
          >
            {vista === op.key && (
              <motion.span
                layoutId="vista-indicador"
                transition={{ duration: 0.2 }}
                className="absolute inset-0 rounded-full bg-surface shadow-card"
              />
            )}
            <op.icon className="relative h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
