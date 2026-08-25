/**
 * Celda "Fuente" de las tablas de admin: ícono por tipo de archivo +
 * nombre en Mono truncado + tooltip con nombre completo y método de
 * extracción (administracion.md §4).
 */
import { File, FileImage, FileSpreadsheet, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FuenteMeta {
  icon: LucideIcon;
  clases: string;
  metodo: string;
}

export function metaDeFuente(fuente: string): FuenteMeta {
  const ext = fuente.split('.').pop()?.toLowerCase() ?? '';
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return { icon: FileSpreadsheet, clases: 'text-ok', metodo: 'Tabla leída directo' };
  }
  if (ext === 'pdf') {
    return { icon: FileText, clases: 'text-danger', metodo: 'Extraído con IA' };
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) {
    return { icon: FileImage, clases: 'text-info', metodo: 'Extraído con IA' };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: File, clases: 'text-ink-muted', metodo: 'Tabla leída directo' };
  }
  return { icon: File, clases: 'text-ink-faint', metodo: 'Extraído con IA' };
}

export default function FuenteCell({ fuente, className }: { fuente: string; className?: string }) {
  const meta = metaDeFuente(fuente);
  const Icon = meta.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('flex max-w-[190px] cursor-default items-center gap-1.5', className)}>
          <Icon className={cn('h-4 w-4 shrink-0', meta.clases)} />
          <span className="truncate text-mono text-ink-muted">{fuente}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-mono text-[12px]">{fuente}</p>
        <p className="text-[12px] opacity-80">{meta.metodo}</p>
      </TooltipContent>
    </Tooltip>
  );
}
