/**
 * Piezas compartidas del detalle de tour: badge de categoría, dot de
 * frescura y popover de operador (teléfono/email + comisión "uso interno").
 * Usadas por la página /tour/:id y por el drawer de escritorio.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Building2, Check, EyeOff, MessageCircle, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { freshness, formatDateEs } from '@/data/mock-tours';
import type { Operador, Tour } from '@/data/mock-tours';
import { buildResumenTour, telefonoDeContacto, urlWhatsApp } from '@/components/detalle/resumen';
import { CATEGORIA_META } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

export const DOT_FRESCURA: Record<string, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

const ICONO_ESTADO = {
  ok: Check,
  warn: AlertTriangle,
  danger: X,
};

/** Badge pill de categoría con ícono (design.md §2) */
export function BadgeCategoria({ tour, className }: { tour: Tour; className?: string }) {
  const cat = CATEGORIA_META[tour.categoria];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium',
        cat.clases,
        className,
      )}
    >
      <cat.icon className="h-3 w-3" />
      {cat.label}
    </span>
  );
}

/** Dot de frescura + caption relativo, tooltip con fecha exacta y fuente */
export function DotFrescura({ tour, conLabel = false }: { tour: Tour; conLabel?: boolean }) {
  const fresh = freshness(tour.fecha_actualizacion);
  const Icon = ICONO_ESTADO[fresh.estado];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default items-center gap-1.5 text-caption text-ink-muted">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT_FRESCURA[fresh.estado])} />
          {conLabel ? <Icon className="h-3 w-3" /> : fresh.relativo}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {fresh.label}: {formatDateEs(tour.fecha_actualizacion)} · Fuente: {tour.fuente}
      </TooltipContent>
    </Tooltip>
  );
}

interface PopoverOperadorProps {
  operador: Operador;
  children: ReactNode;
  /** Tour actual para prellenar el enlace de WhatsApp con su resumen */
  tour?: Tour;
  /** Control externo opcional (p.ej. botón "Ver contacto" del banner rojo) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Popover con datos del operador; la comisión va marcada "Uso interno" */
export function PopoverOperador({ operador, children, open, onOpenChange, tour }: PopoverOperadorProps) {
  const [interno, setInterno] = useState(false);
  const controlado = open !== undefined;
  const abierto = controlado ? open : interno;
  const setAbierto = (v: boolean) => {
    if (!controlado) setInterno(v);
    onOpenChange?.(v);
  };

  const telefono = tour ? telefonoDeContacto(operador.telefono) : null;
  const hrefWhatsApp = tour && telefono ? urlWhatsApp(telefono, buildResumenTour(tour)) : null;

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-72 rounded-r-md border-border bg-surface p-4 shadow-overlay">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink">{operador.nombre}</div>
            <div className="text-caption text-ink-faint">Operador</div>
          </div>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <div className="text-label text-ink-muted">Contacto</div>
          {operador.telefono && (
            <div className="mt-0.5 text-small text-ink">{operador.telefono}</div>
          )}
          {operador.email && (
            <div className="mt-0.5 text-small text-ink">{operador.email}</div>
          )}
          {!operador.telefono && !operador.email && (
            <div className="mt-0.5 text-small text-ink-faint">Sin datos de contacto</div>
          )}
        </div>
        {hrefWhatsApp && (
          <a
            href={hrefWhatsApp}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-r-sm bg-[#25D366] px-3 py-2 text-caption font-semibold text-white transition-opacity duration-fast hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar por WhatsApp
          </a>
        )}
        {operador.comision != null && (
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-label text-ink-muted">Comisión</span>
              <span className="text-small font-semibold text-ink tnum">{operador.comision}%</span>
            </div>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-volcan-soft px-2 py-0.5 text-caption font-medium text-volcan">
              <EyeOff className="h-3 w-3" />
              Uso interno — no mostrar al huésped
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
