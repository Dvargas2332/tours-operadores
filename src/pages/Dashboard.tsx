/**
 * Dashboard principal (`/`): landing con KPIs y listado de operadores.
 */
import { motion } from 'framer-motion';
import { Building2, MapPinned } from 'lucide-react';
import { useToursData } from '@/hooks/useToursData';
import OperadorCard from '@/components/buscador/OperadorCard';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function KpiCard({
  icon: Icon,
  label,
  valor,
  caption,
  tone = 'brand',
}: {
  icon: React.ElementType;
  label: string;
  valor: React.ReactNode;
  caption: string;
  tone?: 'brand' | 'warn' | 'ok';
}) {
  const toneClasses = {
    brand: 'bg-brand-soft text-brand',
    warn: 'bg-volcan-soft text-warn',
    ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="rounded-r-md border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex items-center gap-2">
        <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full', toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-caption uppercase tracking-wide text-ink-faint">{label}</span>
      </div>
      <div className="mt-2 font-display text-[28px] font-bold leading-none text-ink">{valor}</div>
      <div className="mt-1.5 text-caption text-ink-muted">{caption}</div>
    </motion.div>
  );
}

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
          <p className="mt-1 text-small text-ink-muted">Resumen de Tours Operadores — La Fortuna</p>
        </motion.div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <KpiCard icon={MapPinned} label="Tours" valor={tours.length} caption="en la base de datos" tone="brand" />
          <KpiCard icon={Building2} label="Operadores" valor={operadores.length} caption="registrados" tone="brand" />
        </div>

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
