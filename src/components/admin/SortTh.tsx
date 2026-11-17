/**
 * Header de columna ordenable para las tablas de Administración
 * (administracion.md §3): click cicla asc → desc → neutro, flecha
 * animada 150ms. Incluye el hook `useOrdenColumna` compartido.
 */
import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type DirOrden = 'asc' | 'desc';

export interface OrdenColumna<K extends string> {
  key: K;
  dir: DirOrden;
}

/** Estado de ordenamiento con ciclo asc → desc → neutro (null = orden default). */
export function useOrdenColumna<K extends string>(defecto: OrdenColumna<K>) {
  const [orden, setOrden] = useState<OrdenColumna<K> | null>(defecto);

  const ciclar = (key: K) =>
    setOrden((actual) => {
      if (!actual || actual.key !== key) return { key, dir: 'asc' };
      if (actual.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });

  return { orden, ciclar };
}

interface SortThProps<K extends string> {
  colKey: K;
  label: string;
  orden: OrdenColumna<K> | null;
  onCiclar: (key: K) => void;
  className?: string;
  center?: boolean;
  /** Reduce el alto de la fila para tablas densas. */
  dense?: boolean;
}

export default function SortTh<K extends string>({
  colKey,
  label,
  orden,
  onCiclar,
  className,
  center,
  dense,
}: SortThProps<K>) {
  const activo = orden?.key === colKey;
  const Icon = !activo ? ArrowUpDown : orden.dir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      className={cn(
        'text-label uppercase tracking-wide text-ink-muted',
        dense ? 'px-2 py-1.5' : 'px-3 py-2.5',
        center && 'text-center',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onCiclar(colKey)}
        className={cn(
          'inline-flex items-center gap-1 rounded-sm uppercase transition-colors duration-fast hover:text-ink',
          center && 'justify-center',
          activo && 'text-brand',
        )}
      >
        {label}
        <motion.span
          key={activo ? `${colKey}-${orden?.dir ?? 'off'}` : `${colKey}-off`}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Icon className={cn('h-3 w-3', activo ? 'text-brand' : 'text-ink-faint')} />
        </motion.span>
      </button>
    </th>
  );
}
