/**
 * Barra de resultados (buscador.md §4): select de orden + toggle de vista
 * grid/lista. La preferencia de vista se persiste desde la página.
 */
import { ORDENES } from '@/lib/filtros';
import type { Orden } from '@/lib/filtros';
import type { Vista } from '@/lib/vista';
import { useI18n } from '@/i18n';
import VistaToggle from '@/components/buscador/VistaToggle';

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

      <VistaToggle vista={vista} onCambioVista={onCambioVista} />
    </div>
  );
}
