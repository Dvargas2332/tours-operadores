/**
 * Tarjeta de operador en el buscador principal.
 * Muestra el logo a la izquierda ocupando la mitad de la tarjeta.
 */
import { motion } from 'framer-motion';
import { MapPin, Package } from 'lucide-react';
import type { Operador, Tour } from '@/data/mock-tours';
import { CATEGORIA_META } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';
import { formatPrecio } from '@/data/mock-tours';

interface OperadorCardProps {
  operador: Operador;
  tours: Tour[];
  onVerOperador: () => void;
}

export default function OperadorCard({ operador, tours, onVerOperador }: OperadorCardProps) {
  const zonas = [...new Set(tours.map((t) => t.zona))].sort((a, b) => a.localeCompare(b, 'es'));
  const categorias = [...new Set(tours.map((t) => t.categoria))];
  const precios = tours.flatMap((t) => (t.tarifas.length ? t.tarifas.map((tar) => tar.rack) : [t.precio_adulto]));
  const precioMin = Math.min(...precios);
  const precioMax = Math.max(...precios);
  const moneda = tours[0]?.moneda ?? 'usd';

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
        'flex cursor-pointer flex-row overflow-hidden rounded-r-md border bg-surface shadow-card outline-none transition-[box-shadow,border-color,background-color] duration-fast',
        'hover:border-brand/30 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
      )}
      onClick={onVerOperador}
    >
      {/* Mitad izquierda: logo */}
      <div className="flex w-1/2 items-center justify-center border-r border-border bg-surface-2 p-4">
        {operador.logo_url ? (
          <img
            src={operador.logo_url}
            alt={`Logo de ${operador.nombre}`}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-soft text-3xl font-bold text-brand ring-1 ring-border">
            {iniciales || 'OP'}
          </span>
        )}
      </div>

      {/* Mitad derecha: datos */}
      <div className="flex w-1/2 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-h3 text-ink leading-tight">{operador.nombre}</h3>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-caption font-medium text-brand">
              <Package className="h-3 w-3" />
              {tours.length}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {categorias.slice(0, 2).map((c) => {
              const meta = CATEGORIA_META[c];
              return (
                <span
                  key={c}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium',
                    meta.clases,
                  )}
                >
                  <meta.icon className="h-3 w-3" />
                  {meta.label}
                </span>
              );
            })}
            {categorias.length > 2 && (
              <span className="text-caption text-ink-faint">+{categorias.length - 2}</span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1 text-small text-ink-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <span className="line-clamp-1">{zonas.join(', ') || 'Sin zona definida'}</span>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-2">
          <p className="text-caption text-ink-faint">Desde</p>
          <p className="text-precio text-ink">
            {formatPrecio(precioMin, moneda)}
            {precios.length > 1 && (
              <span className="text-small font-normal text-ink-muted">
                {' '}
                - {formatPrecio(precioMax, moneda)}
              </span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
