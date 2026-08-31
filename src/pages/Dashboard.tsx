/**
 * Dashboard principal (`/`): landing con KPIs,
 * tours recientes y gráfico simple por categoría.
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Building2, Calendar, MapPinned, TrendingUp } from 'lucide-react';
import { useToursData } from '@/hooks/useToursData';
import { formatDateEs } from '@/data/mock-tours';
import type { Categoria } from '@/data/mock-tours';
import { CATEGORIA_META, CATEGORIAS } from '@/lib/tour-meta';
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

  // Últimos 5 tours actualizados
  const recientes = [...tours]
    .sort((a, b) => b.fecha_actualizacion.localeCompare(a.fecha_actualizacion))
    .slice(0, 5);

  // Tours por categoría para el gráfico simple
  const conteoCategorias = tours.reduce<Record<Categoria, number>>((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] ?? 0) + 1;
    return acc;
  }, {} as Record<Categoria, number>);

  const porCategoria = CATEGORIAS.map((key) => ({ key, count: conteoCategorias[key] ?? 0, meta: CATEGORIA_META[key] }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...porCategoria.map((c) => c.count));

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

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Columna 1: Operadores */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
            className="lg:col-span-1"
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

          {/* Columna 2: Actualizaciones recientes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2, ease: EASE }}
            className="rounded-r-md border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-[18px] w-[18px] text-brand" />
              <h2 className="text-h3 text-ink">Actualizaciones recientes</h2>
            </div>
            {recientes.length === 0 ? (
              <p className="mt-4 text-small text-ink-muted">No hay tours cargados.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {recientes.map((tour) => (
                  <li key={tour.id}>
                    <Link
                      to={`/tour/${tour.id}`}
                      className="flex items-center justify-between rounded-r-sm border border-border px-3 py-2 transition-colors duration-fast hover:bg-surface-2"
                    >
                      <span className="min-w-0 truncate text-small font-medium text-ink">{tour.nombre}</span>
                      <span className="shrink-0 text-caption text-ink-muted tnum">{formatDateEs(tour.fecha_actualizacion)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          {/* Columna 3: Tours por categoría */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.3, ease: EASE }}
            className="rounded-r-md border border-border bg-surface p-5 shadow-card lg:col-span-1"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-[18px] w-[18px] text-brand" />
              <h2 className="text-h3 text-ink">Tours por categoría</h2>
            </div>
            {porCategoria.length === 0 ? (
              <p className="mt-4 text-small text-ink-muted">No hay tours cargados.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {porCategoria.map(({ key, count, meta }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-small">
                      <span className="flex items-center gap-1.5">
                        <meta.icon className={cn('h-3.5 w-3.5', meta.clases.split(' ').find((c) => c.startsWith('text-')) ?? 'text-brand')} />
                        {meta.label}
                      </span>
                      <span className="tnum font-medium text-ink">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxCount) * 100}%` }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className={cn('h-full rounded-full', meta.clases.split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-brand')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
