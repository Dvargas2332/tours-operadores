/**
 * Metadatos visuales de dominio: categorías, "qué incluye", horarios.
 * Mapea design.md §2 (colores de categoría) y buscador.md §5 (íconos Lucide).
 */
import {
  Backpack,
  Bus,
  Compass,
  Flower2,
  Landmark,
  Leaf,
  ShieldCheck,
  Ticket,
  UtensilsCrossed,
  Waves,
  Zap,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Categoria } from '@/data/mock-tours';

export interface CategoriaMeta {
  label: string;
  icon: LucideIcon;
  /** Clases Tailwind literales (texto + fondo) */
  clases: string;
}

export const CATEGORIA_META: Record<Categoria, CategoriaMeta> = {
  aventura: { label: 'Aventura', icon: Zap, clases: 'text-cat-aventura bg-cat-aventura-bg' },
  naturaleza: { label: 'Naturaleza', icon: Leaf, clases: 'text-cat-naturaleza bg-cat-naturaleza-bg' },
  acuatico: { label: 'Acuático', icon: Waves, clases: 'text-cat-acuatico bg-cat-acuatico-bg' },
  cultural: { label: 'Cultural', icon: Landmark, clases: 'text-cat-cultural bg-cat-cultural-bg' },
  termas: { label: 'Termas & Relax', icon: Flower2, clases: 'text-cat-termas bg-cat-termas-bg' },
};

export const CATEGORIAS = Object.keys(CATEGORIA_META) as Categoria[];

export interface IncluyeMeta {
  label: string;
  icon: LucideIcon;
}

/** Íconos de la fila "incluye" (buscador.md §5) */
export const INCLUYE_META: Record<string, IncluyeMeta> = {
  transporte: { label: 'Transporte', icon: Bus },
  guia: { label: 'Guía', icon: Compass },
  almuerzo: { label: 'Almuerzo o comida', icon: UtensilsCrossed },
  entradas: { label: 'Entradas/parques', icon: Ticket },
  equipo: { label: 'Equipo', icon: Backpack },
  seguro: { label: 'Seguro', icon: ShieldCheck },
};

export const INCLUYE_KEYS = Object.keys(INCLUYE_META);

export type HorarioKey = 'antes7' | 'manana' | 'mediodia' | 'tarde' | 'noche';

export interface HorarioMeta {
  label: string;
  icon: LucideIcon;
  /** [desde, hasta) en horas decimales */
  rango: [number, number];
}

/** Buckets de horario de salida (buscador.md §2.5) */
export const HORARIO_META: Record<HorarioKey, HorarioMeta> = {
  antes7: { label: 'Antes de 7:00', icon: Sunrise, rango: [0, 7] },
  manana: { label: 'Mañana 7–10', icon: Sun, rango: [7, 10] },
  mediodia: { label: 'Mediodía 10–14', icon: CloudSun, rango: [10, 14] },
  tarde: { label: 'Tarde 14–17', icon: Sunset, rango: [14, 17] },
  noche: { label: 'Noche 17+', icon: Moon, rango: [17, 24] },
};

export const HORARIO_KEYS = Object.keys(HORARIO_META) as HorarioKey[];

export function horarioBucket(horaSalida: string): HorarioKey {
  const h = Number(horaSalida.split(':')[0]) + Number(horaSalida.split(':')[1] ?? 0) / 60;
  for (const key of HORARIO_KEYS) {
    const [desde, hasta] = HORARIO_META[key].rango;
    if (h >= desde && h < hasta) return key;
  }
  return 'noche';
}

/** "3 h" / "6.5 h" */
export function formatDuracion(horas: number): string {
  return `${Number.isInteger(horas) ? horas : horas.toFixed(1)} h`;
}
