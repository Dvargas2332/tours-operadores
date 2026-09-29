/**
 * Dashboard principal (`/`):
 * - Admin: listado de operadores con sus tours.
 * - Cliente (público): listado de tours anónimos, sin datos del operador.
 */
import { motion } from 'framer-motion';
import { Building2, Mountain } from 'lucide-react';
import { useToursData } from '@/hooks/useToursData';
import OperadorCard from '@/components/buscador/OperadorCard';
import TourCard, { TourCardSkeleton } from '@/components/buscador/TourCard';
import { useCompare } from '@/context/CompareContext';
import { useNavigate } from 'react-router';
import { useI18n } from '@/i18n';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, mostrarOperador } = useI18n();
  const { toggle, estaSeleccionado } = useCompare();
  const data = useToursData();
  const tours = data?.tours ?? [];
  const operadores = data?.operadores ?? [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <h1 className="text-display text-ink">
            {mostrarOperador ? t('shell.dash.titulo') : t('shell.dash.titulo_tours')}
          </h1>
          <p className="mt-1 text-small text-ink-muted">
            {mostrarOperador ? t('shell.dash.subtitulo') : t('shell.dash.subtitulo_tours')}
          </p>
        </motion.div>

        {mostrarOperador ? (
          /* Operadores (solo admin) */
          <div className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-[18px] w-[18px] text-brand" />
                <h2 className="text-h3 text-ink">{t('shell.dash.operadores_titulo')}</h2>
              </div>
              {operadores.length === 0 ? (
                <p className="text-small text-ink-muted">{t('shell.dash.sin_operadores')}</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {operadores.map((op) => (
                    <OperadorCard
                      key={op.id}
                      operador={op}
                      tours={tours.filter((tour) => tour.operador.id === op.id)}
                      onVerOperador={() => navigate(`/operador/${op.id}`)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          /* Tours anónimos (clientes) */
          <div className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Mountain className="h-[18px] w-[18px] text-brand" />
                <h2 className="text-h3 text-ink">{t('shell.dash.titulo_tours')}</h2>
              </div>
              {!data ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TourCardSkeleton key={i} />
                  ))}
                </div>
              ) : tours.length === 0 ? (
                <p className="text-small text-ink-muted">{t('shell.dash.sin_tours')}</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {tours.map((tour, i) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      index={i}
                      vista="grid"
                      seleccionado={estaSeleccionado(tour.id)}
                      onToggleComparar={() => toggle(tour.id)}
                      onVerDetalle={() => navigate(`/tour/${tour.id}`)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
