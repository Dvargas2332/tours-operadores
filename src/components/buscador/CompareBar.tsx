/**
 * Barra flotante de comparación (buscador.md §6): pill centrada abajo con
 * miniaturas de tours seleccionados, contador "n de 3" y CTA "Comparar ahora".
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Columns3, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { MAX_COMPARAR, useCompare } from '@/context/CompareContext';
import type { Tour } from '@/data/mock-tours';
import { useI18n } from '@/i18n';

const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const;

export default function CompareBar({ tours }: { tours: Tour[] }) {
  const { seleccionados, quitar } = useCompare();
  const navigate = useNavigate();
  const { t } = useI18n();

  const seleccionadosTours = seleccionados
    .map((id) => tours.find((tour) => tour.id === id))
    .filter((tour): tour is Tour => tour != null);

  return (
    <AnimatePresence>
      {seleccionados.length > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.95 }}
          transition={SPRING}
          className="pointer-events-none absolute bottom-6 left-0 right-0 z-40 flex justify-center px-4"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-surface shadow-overlay">
            {/* Miniaturas */}
            <div className="flex items-center gap-1.5">
              <AnimatePresence initial={false}>
                {seleccionadosTours.map((tour) => (
                  <motion.span
                    key={tour.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={SPRING}
                    className="flex items-center gap-1 rounded-full bg-surface/15 px-2.5 py-1 text-caption"
                  >
                    <span className="max-w-[110px] truncate">{tour.nombre}</span>
                    <button
                      type="button"
                      aria-label={t('buscador.quitar_nombre', { nombre: tour.nombre })}
                      onClick={() => quitar(tour.id)}
                      className="rounded-full text-surface/70 transition-colors duration-fast hover:text-surface"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            <motion.span
              key={seleccionados.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={SPRING}
              className="whitespace-nowrap text-caption text-surface/70 tnum"
            >
              {t('buscador.seleccionados_n', { n: seleccionados.length, max: MAX_COMPARAR })}
            </motion.span>

            <button
              type="button"
              disabled={seleccionados.length < 2}
              onClick={() => navigate('/comparar', { state: { ids: seleccionados } })}
              className="flex h-9 items-center gap-1.5 rounded-full bg-volcan px-4 text-sm font-semibold text-white transition-all duration-fast enabled:hover:brightness-105 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Columns3 className="h-4 w-4" />
              {t('buscador.comparar_ahora')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
