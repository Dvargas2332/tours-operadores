/**
 * Tarjeta de operador en el buscador principal.
 * Muestra únicamente el logo del operador y, en la parte inferior, su nombre.
 */
import { motion } from 'framer-motion';
import type { Operador, Tour } from '@/data/mock-tours';
import { cn } from '@/lib/utils';

interface OperadorCardProps {
  operador: Operador;
  tours: Tour[];
  onVerOperador: () => void;
}

export default function OperadorCard({ operador, onVerOperador }: OperadorCardProps) {
  const iniciales = operador.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onVerOperador();
      }}
      className={cn(
        'flex h-44 cursor-pointer flex-col overflow-hidden rounded-r-md border bg-surface-2 shadow-card outline-none transition-[box-shadow,border-color] duration-fast',
        'hover:border-brand/30 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
      )}
      onClick={onVerOperador}
    >
      {/* Logo a pantalla completa */}
      <div className="relative min-h-0 flex-1">
        {operador.logo_url ? (
          <img
            src={operador.logo_url}
            alt={operador.nombre}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-brand-soft text-4xl font-bold text-brand">
            {iniciales || 'OP'}
          </span>
        )}
      </div>

      {/* Nombre en la parte inferior */}
      <div className="shrink-0 border-t border-border bg-surface px-3 py-2.5">
        <h3 className="truncate text-h3 text-ink">{operador.nombre}</h3>
      </div>
    </motion.div>
  );
}
