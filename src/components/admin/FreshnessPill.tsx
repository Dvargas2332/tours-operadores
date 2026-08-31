/**
 * Pill de frescura del tarifario (semáforo ok/warn/danger) — compartida
 * entre las tablas de Administración (administracion.md §3/§4).
 * Pop scale 0.9→1 al entrar (spring).
 */
import { motion } from 'framer-motion';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { InfoFrescura } from '@/data/mock-tours';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ESTILO_PILL: Record<InfoFrescura['estado'], string> = {
  ok: 'bg-brand-soft text-ok',
  warn: 'bg-volcan-soft text-warn',
  danger: 'bg-danger/10 text-danger',
};

const ESTILO_DOT: Record<InfoFrescura['estado'], string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

const ICONO_ESTADO = {
  ok: Check,
  warn: AlertTriangle,
  danger: X,
};

export default function FreshnessPill({
  frescura,
  compact,
  className,
}: {
  frescura: InfoFrescura;
  compact?: boolean;
  className?: string;
}) {
  const Icon = ICONO_ESTADO[frescura.estado];
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full',
              ESTILO_PILL[frescura.estado],
              className,
            )}
          >
            <Icon className="h-4 w-4" />
          </motion.span>
        </TooltipTrigger>
        <TooltipContent>{frescura.label}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={cn(
            'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-caption font-medium',
            ESTILO_PILL[frescura.estado],
            className,
          )}
        >
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', ESTILO_DOT[frescura.estado])} />
          <Icon className="h-3 w-3" />
        </motion.span>
      </TooltipTrigger>
      <TooltipContent>{frescura.label}</TooltipContent>
    </Tooltip>
  );
}
