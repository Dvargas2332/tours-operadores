/**
 * Tarjeta de tour comparable (buscador.md §5). Anatomía fija idéntica en
 * todas las tarjetas: header (categoría + frescura), título, operador,
 * precios adulto/niño, metadatos, fila "incluye", acciones.
 * Variante "lista": fila horizontal compacta para escaneo rápido.
 */
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Baby, Clock, ImageIcon, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPrecio, horarioRepresentativo } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { CATEGORIA_META, INCLUYE_META } from '@/lib/tour-meta';
import { precioActivoDesde } from '@/lib/tarifas';
import { tarifasSegunNacionalidad, useFormatos, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const DOT_FRESCURA: Record<string, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

/** Checkbox "Comparar" con check animado (path draw 180ms) */
function CheckComparar({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors duration-fast',
        checked ? 'border-brand bg-brand' : 'border-border bg-surface group-hover/comp:border-brand/50',
      )}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3">
        <motion.path
          d="M2 6.2 4.8 9 10 3.2"
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.18 }}
        />
      </svg>
    </span>
  );
}

function precioDesde(tour: Tour, esCostaRica: boolean): number {
  return precioActivoDesde(tour, esCostaRica);
}

function FilaIncluye({ tour, compact = false }: { tour: Tour; compact?: boolean }) {
  const { t } = useI18n();
  const visibles = tour.incluye.slice(0, 4);
  const extra = tour.incluye.length - visibles.length;
  return (
    <div className="flex items-center gap-1.5">
      {visibles.map((key) => {
        const meta = INCLUYE_META[key];
        if (!meta) return null;
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-ink-muted">
                <meta.icon className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t(`buscador.incluye_${key}`)}</TooltipContent>
          </Tooltip>
        );
      })}
      {extra > 0 && (
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-caption text-ink-muted tnum">+{extra}</span>
      )}
      <span className="flex-1" />
      {tour.apto_ninos ? (
        <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-caption font-medium text-brand">
          <Baby className="h-3 w-3" />
          {!compact && t('buscador.apto_ninos')}
        </span>
      ) : (
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-caption text-ink-muted line-through">
          {t('buscador.solo_adultos')}
        </span>
      )}
    </div>
  );
}

interface TourCardProps {
  tour: Tour;
  seleccionado: boolean;
  onToggleComparar: () => void;
  onVerDetalle: () => void;
  vista: 'grid' | 'lista';
  /** Índice para stagger de entrada (máx. 12 animadas) */
  index: number;
}

const TourCard = forwardRef<HTMLDivElement, TourCardProps>(function TourCard(
  { tour, seleccionado, onToggleComparar, onVerDetalle, vista, index },
  ref,
) {
  const { autenticado } = useAuth();
  const { t, esCostaRica, mostrarOperador } = useI18n();
  const { formatFecha, frescura, horarioLabel } = useFormatos();
  const tarifasVisibles = tarifasSegunNacionalidad(tour.tarifas, esCostaRica);
  const fresh = frescura(tour.fecha_actualizacion);
  const tooltipFrescura = `${fresh.label}: ${formatFecha(tour.fecha_actualizacion)}`;
  const horario = horarioRepresentativo(tour);
  const masHorarios = tour.horarios.length > 1;
  const delay = Math.min(index, 11) * 0.04;

  const animEntrada = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
  };

  const cintaDesactualizada = fresh.estado === 'danger' && (
    <div className="mb-3 flex items-center gap-1.5 rounded-r-sm bg-volcan-soft px-2.5 py-1.5 text-caption font-medium text-warn">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {t('buscador.tarifario_desactualizado')}
    </div>
  );

  const badgeCategoria = tour.categorias.map((c) => {
    const meta = CATEGORIA_META[c];
    const nombre = t(`buscador.categoria_${c}`);
    return (
      <Tooltip key={c}>
        <TooltipTrigger asChild>
          <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium', meta.clases)}>
            <meta.icon className="h-3 w-3" />
            {nombre}
          </span>
        </TooltipTrigger>
        <TooltipContent>{t('buscador.categoria_tooltip', { categoria: nombre })}</TooltipContent>
      </Tooltip>
    );
  });

  const dotFrescura = (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex cursor-default items-center gap-1.5 text-caption text-ink-muted">
          <span className={cn('h-2 w-2 rounded-full', DOT_FRESCURA[fresh.estado])} />
          {fresh.relativo}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipFrescura}</TooltipContent>
    </Tooltip>
  );

  if (vista === 'lista') {
    return (
      <motion.div
        ref={ref}
        layout="position"
        {...animEntrada}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onVerDetalle();
          if (e.key.toLowerCase() === 'c') onToggleComparar();
        }}
        className={cn(
          'group flex items-center gap-4 rounded-r-md border bg-surface px-4 py-3 shadow-card outline-none transition-[box-shadow,border-color,background-color] duration-fast',
          'hover:border-brand/30 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          seleccionado ? 'border-brand border-[1.5px] bg-brand-soft/40' : 'border-border',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {badgeCategoria}
            {dotFrescura}
          </div>
          <div className="mt-1 truncate text-h3 text-ink">{tour.nombre}</div>
          {mostrarOperador && (
            <div className="flex items-center gap-1.5 truncate text-small text-ink-muted">
              {tour.operador.logo_url ? (
                <img
                  src={tour.operador.logo_url}
                  alt=""
                  className="h-5 w-5 object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-[9px] font-bold text-brand">
                  {tour.operador.nombre[0]?.toUpperCase() || <ImageIcon className="h-3 w-3" />}
                </span>
              )}
              {tour.operador.nombre}
            </div>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-4 text-small text-ink-muted tnum md:flex">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {horario ? horarioLabel(horario) : '—'}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-precio text-ink">{formatPrecio(precioDesde(tour, esCostaRica), tour.moneda)}</div>
          <div className="text-caption text-ink-faint">
            {tarifasVisibles.length > 1 ? t('buscador.n_tarifas', { n: String(tarifasVisibles.length) }) : t('buscador.rack_adulto')}
          </div>
          <div className="text-caption text-ink-muted tnum">
            {tarifasVisibles.length > 1 ? t('buscador.desde') : t('buscador.una_tarifa')}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onVerDetalle}
            className="h-9 rounded-r-sm border border-border bg-surface px-3 text-sm font-medium text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
          >
            {t('acciones.ver_detalle')}
          </button>
          <button
            type="button"
            role="checkbox"
            aria-checked={seleccionado}
            onClick={onToggleComparar}
            className="group/comp flex items-center gap-1.5 text-caption text-ink-muted"
          >
            <CheckComparar checked={seleccionado} />
            <span className="hidden xl:inline">{t('acciones.comparar')}</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      layout="position"
      {...animEntrada}
      whileHover={{ y: -2 }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onVerDetalle();
        if (e.key.toLowerCase() === 'c') onToggleComparar();
      }}
      className={cn(
        'flex flex-col rounded-r-md border bg-surface p-4 shadow-card outline-none transition-[box-shadow,border-color,background-color] duration-fast',
        'hover:border-brand/30 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        seleccionado ? 'border-brand border-[1.5px] bg-brand-soft/40' : 'border-border',
      )}
    >
      {cintaDesactualizada}

      {/* Header: categoría + frescura */}
      <div className="flex items-center justify-between gap-2">
        {badgeCategoria}
        {dotFrescura}
      </div>

      {/* Título + operador */}
      <h3 className="mt-2.5 line-clamp-2 min-h-[2.6em] text-h3 text-ink">{tour.nombre}</h3>
      {mostrarOperador && (
        <div className="flex items-center gap-1.5 truncate text-small text-ink-muted">
          {tour.operador.logo_url ? (
            <img
              src={tour.operador.logo_url}
              alt=""
              className="h-4 w-4 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-soft text-[8px] font-bold text-brand">
              {tour.operador.nombre[0]?.toUpperCase() || <ImageIcon className="h-3 w-3" />}
            </span>
          )}
          {tour.operador.nombre}
        </div>
      )}

      {/* Precios */}
      <div className="mt-3 flex gap-6 border-t border-border pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-default">
              <div className="text-precio text-ink">{formatPrecio(precioDesde(tour, esCostaRica), tour.moneda)}</div>
              <div className="text-caption text-ink-faint">
                {tarifasVisibles.length > 1 ? t('buscador.n_tarifas', { n: String(tarifasVisibles.length) }) : t('buscador.rack_adulto')}
              </div>
              <div className="text-caption text-ink-muted tnum">
                {tarifasVisibles.length > 1 ? t('buscador.desde') : t('buscador.una_tarifa')}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {tarifasVisibles.length > 1
              ? t('buscador.tooltip_precio_varios', { n: String(tarifasVisibles.length) })
              : autenticado
                ? t('buscador.tooltip_rack_interno')
                : t('buscador.tooltip_tarifa_adulto')}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Metadatos */}
      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-small text-ink-muted tnum">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {horario ? horarioLabel(horario) : '—'}
          {masHorarios && <span className="text-caption text-ink-faint">+{tour.horarios.length - 1}</span>}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {t('buscador.min_personas', { n: String(tour.minimo_personas) })}
        </span>
      </div>

      {/* Incluye */}
      <div className="mt-3 border-t border-border pt-3">
        <FilaIncluye tour={tour} />
      </div>

      {/* Acciones */}
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={onVerDetalle}
          className="h-9 flex-1 rounded-r-sm border border-border bg-surface text-sm font-medium text-ink transition-colors duration-fast hover:border-brand hover:bg-brand hover:text-white"
        >
          {t('acciones.ver_detalle')}
        </button>
        <button
          type="button"
          role="checkbox"
          aria-checked={seleccionado}
          onClick={onToggleComparar}
          className="group/comp flex shrink-0 items-center gap-1.5 text-caption font-medium text-ink-muted transition-colors duration-fast hover:text-ink"
        >
          <CheckComparar checked={seleccionado} />
          {t('acciones.comparar')}
        </button>
      </div>
    </motion.div>
  );
});

export default TourCard;

/** Skeleton con la misma anatomía (shimmer 1.2s) */
export function TourCardSkeleton() {
  return (
    <div className="flex flex-col rounded-r-md border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="shimmer h-5 w-20 rounded-full" />
        <div className="shimmer h-4 w-16 rounded-full" />
      </div>
      <div className="shimmer mt-3 h-5 w-4/5 rounded-md" />
      <div className="shimmer mt-2 h-4 w-2/5 rounded-md" />
      <div className="mt-3 border-t border-border pt-3">
        <div className="shimmer h-7 w-24 rounded-md" />
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <div className="shimmer h-4 w-full rounded-md" />
      </div>
      <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
        <div className="shimmer h-7 w-7 rounded-full" />
        <div className="shimmer h-7 w-7 rounded-full" />
        <div className="shimmer h-7 w-7 rounded-full" />
        <div className="shimmer h-7 w-7 rounded-full" />
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <div className="shimmer h-9 w-full rounded-r-sm" />
      </div>
    </div>
  );
}
