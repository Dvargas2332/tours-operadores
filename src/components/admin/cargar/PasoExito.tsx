/**
 * Paso 4 del wizard: confirmación de éxito de la importación del catálogo.
 */
import { useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, Search, Upload } from 'lucide-react';
import { formatDateEs } from '@/data/mock-tours';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Particula {
  x: number;
  delay: number;
  duracion: number;
  tamano: number;
  color: string;
  rotacion: number;
}

interface PasoExitoProps {
  operadores: number;
  tours: number;
  fecha: string; // ISO
  fuente: string;
  onCargarOtro: () => void;
}

export default function PasoExito({ operadores, tours, fecha, fuente, onCargarOtro }: PasoExitoProps) {
  const particulas = useMemo<Particula[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        x: 5 + (i * 4.5) % 90,
        delay: (i % 8) * 0.06,
        duracion: 1.3 + (i % 5) * 0.1,
        tamano: 5 + (i % 3) * 2,
        color: i % 2 === 0 ? 'var(--brand)' : 'var(--accent)',
        rotacion: (i * 47) % 360,
      })),
    [],
  );

  return (
    <div className="relative mx-auto flex max-w-[520px] flex-col items-center pt-10 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] overflow-hidden" aria-hidden>
        {particulas.map((p, i) => (
          <motion.span
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: 280, opacity: 0, rotate: p.rotacion }}
            transition={{ duration: p.duracion, delay: p.delay, ease: 'easeIn' }}
            className="absolute rounded-full"
            style={{ left: `${p.x}%`, width: p.tamano, height: p.tamano, backgroundColor: p.color }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      >
        <CheckCircle2 className="h-14 w-14 text-ok" strokeWidth={1.75} />
      </motion.div>

      <h2 className="mt-4 text-h2 text-ink">Catálogo importado</h2>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: EASE }}
        className="mt-5 w-full rounded-r-md border border-border bg-surface p-5 text-left shadow-card"
      >
        <ul className="space-y-1.5 text-small text-ink-muted">
          <li className="tnum">
            {operadores} operadores · {tours} tours guardados
          </li>
          <li>
            Fecha de actualización: <span className="font-medium text-ink tnum">{formatDateEs(fecha)}</span>
          </li>
          <li className="flex items-baseline gap-1.5">
            Fuente: <span className="truncate text-mono text-ink">{fuente}</span>
          </li>
        </ul>
      </motion.div>

      <p className="mt-3 text-caption text-ink-muted">El buscador ya está usando estos datos.</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {[
          <Link
            key="buscador"
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-brand px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover"
          >
            <Search className="h-4 w-4" />
            Ir al buscador
          </Link>,
          <Link
            key="admin"
            to="/admin"
            className="inline-flex h-10 items-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
          >
            <Building2 className="h-4 w-4" />
            Ver en administración
          </Link>,
          <button
            key="otro"
            type="button"
            onClick={onCargarOtro}
            className="inline-flex h-10 items-center gap-2 rounded-r-sm px-3 text-[14px] font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
          >
            <Upload className="h-4 w-4" />
            Cargar otro catálogo
          </button>,
        ].map((cta, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.35 + i * 0.06, ease: EASE }}
          >
            {cta}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
