/**
 * Stepper superior persistente del wizard (cargar-tarifario.md).
 * Círculos 28px con número o Check, conectores que se llenan con
 * barrido 300ms; paso completado hace pop spring.
 */
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PASOS = ['Subir archivo', 'Extracción', 'Revisión', 'Confirmado'] as const;

export default function Stepper({ paso }: { paso: number }) {
  return (
    <ol className="flex items-start justify-center" aria-label="Progreso de la carga">
      {PASOS.map((label, i) => {
        const n = i + 1;
        const completado = paso > n;
        const activo = paso === n;
        return (
          <li key={label} className="flex items-start">
            {/* Conector (antes del círculo, excepto el primero) */}
            {i > 0 && (
              <div className="mx-1 mt-[13px] h-[2px] w-10 overflow-hidden rounded-full bg-border sm:w-16 md:w-24">
                <motion.div
                  className="h-full bg-brand"
                  initial={false}
                  animate={{ width: paso > i ? '100%' : '0%' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            )}
            <div className="flex w-[72px] flex-col items-center gap-1.5">
              <motion.div
                key={completado ? `done-${n}` : `open-${n}`}
                initial={completado ? { scale: 0.8 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-caption font-semibold',
                  completado && 'bg-brand-soft text-brand',
                  activo && 'bg-brand text-white',
                  !completado && !activo && 'border border-border bg-surface text-ink-faint',
                )}
              >
                {completado ? <Check className="h-4 w-4" /> : n}
              </motion.div>
              <span
                className={cn(
                  'text-center text-caption leading-tight',
                  activo ? 'font-semibold text-ink' : 'text-ink-muted',
                )}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
