/**
 * Toggle segmentado grilla/lista con indicador deslizante (layoutId).
 */
import { LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import type { Vista } from '@/lib/vista';

interface VistaToggleProps {
  vista: Vista;
  onCambioVista: (v: Vista) => void;
}

export default function VistaToggle({ vista, onCambioVista }: VistaToggleProps) {
  const { t } = useI18n();
  return (
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
  );
}
