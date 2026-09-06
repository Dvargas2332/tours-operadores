/**
 * Dashboard principal (`/`): listado de operadores.
 */
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useToursData } from '@/hooks/useToursData';
import OperadorCard from '@/components/buscador/OperadorCard';
import { useNavigate } from 'react-router';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Dashboard() {
  const navigate = useNavigate();
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
          <h1 className="text-display text-ink">Dashboard</h1>
          <p className="mt-1 text-small text-ink-muted">Resumen de Tours Operadores — Lavas Tacotal</p>
        </motion.div>

        {/* Operadores */}
        <div className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-[18px] w-[18px] text-brand" />
              <h2 className="text-h3 text-ink">Tour operadores</h2>
            </div>
            {operadores.length === 0 ? (
              <p className="text-small text-ink-muted">No hay operadores cargados.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                {operadores.map((op) => (
                  <OperadorCard
                    key={op.id}
                    operador={op}
                    tours={tours.filter((t) => t.operador.id === op.id)}
                    onVerOperador={() => navigate(`/operador/${op.id}`)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
