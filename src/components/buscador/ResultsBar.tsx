/**
 * Barra de resultados (buscador.md §4): select de orden + toggle de vista
 * grid/lista (segmented con indicador deslizante layoutId). La preferencia
 * de vista se persiste en localStorage desde la página.
 */
import { LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { ORDENES } from '@/lib/filtros';
import type { Orden } from '@/lib/filtros';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export type Vista = 'grid' | 'lista';

interface ResultsBarProps {
  orden: Orden;
  onCambioOrden: (o: Orden) => void;
  vista: Vista;
  onCambioVista: (v: Vista) => void;
}

export default function ResultsBar({ orden, onCambioOrden, vista, onCambioVista }: ResultsBarProps) {
  const { t } = useI18n();
  return (
    <div className="flex h-10 items-center gap-3">
      <label className="flex items-center gap-2 text-caption text-ink-muted">
        {t('buscador.ordenar')}
        <select
          value={orden}
          onChange={(e) => onCambioOrden(e.target.value as Orden)}
          className="h-8 rounded-r-sm border border-border bg-surface px-2 text-small font-medium text-ink outline-none transition-colors duration-fast focus:border-brand"
        >
          {ORDENES.map((op) => (
            <option key={op} value={op}>
              {t(`buscador.orden_${op}`)}
            </option>
          ))}
        </select>
      </label>

      <div className="flex-1" />

      {/* Toggle de vista */}
      <div className="flex rounded-full bg-surface-2 p-0.5" role="tablist" aria-label={t('buscador.vista_resultados')}>
        {(
          [
            { key: 'grid', icon: LayoutGrid, label: t('buscador.vista_tarjetas') },
            { key: 'lista', icon: List, label: t('buscador.vista_lista') },
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
