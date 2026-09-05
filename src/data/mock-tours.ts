/**
 * Capa de acceso a datos de Tours Operadores (design.md §8).
 *
 * Todas las páginas consumen los fetchers async de este archivo
 * (fetchTours, fetchOperadores, fetchTourById). La implementación habla
 * directo con Supabase (PostgREST) usando supabase-js.
 */
import { supabase } from '@/lib/supabase';

export type Categoria = 'aventura' | 'naturaleza' | 'acuatico' | 'cultural' | 'termas';

export type Moneda = 'usd' | 'crc';

export interface Operador {
  id: number;
  nombre: string;
  telefono: string; // teléfono de contacto (WhatsApp/llamadas)
  email: string | null; // correo del operador
  comision: number | null; // % — visible solo en admin
  logo_url: string | null; // URL pública del logo del operador
  poliza_url: string | null; // URL pública de la póliza de seguro
  politica_cancelacion: string; // política de cancelación compartida por todos sus tours
}

export interface Tarifa {
  id: number;
  nombre: string;
  min_edad: number;
  max_edad: number | null;
  rack: number;
  neta: number | null;
  hora_desde: string | null; // HH:MM inicio del rango (legacy)
  hora_hasta: string | null; // HH:MM fin del rango (legacy)
  orden: number;
}

export interface Horario {
  id: number;
  hora_salida: string; // "07:30"
  hora_llegada: string; // "12:30"
  orden: number;
}

export interface Tour {
  id: number;
  operador: Operador;
  nombre: string;
  zona: string;
  categoria: Categoria;
  precio_adulto: number; // tarifa base representativa (rango adulto 12-64)
  precio_nino: number | null; // legacy
  precio_neto_adulto: number | null; // legacy
  precio_neto_nino: number | null; // legacy
  tarifas: Tarifa[];
  horarios: Horario[];
  duracion_horas: number;
  incluye: string[]; // transporte, guia, almuerzo, entradas, equipo, seguro
  no_incluye: string[];
  minimo_personas: number;
  apto_ninos: boolean;
  politica_cancelacion: string;
  observaciones: string;
  fuente: string; // "tarifario-sunset-2026.pdf"
  fecha_actualizacion: string; // ISO date
  moneda: Moneda; // usd | crc
}

/* ------------------------------------------------------------------ */
/* Helpers de fecha/formato                                            */
/* ------------------------------------------------------------------ */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "12 jul 2026" — día + mes abreviado + año (design.md §3) */
export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
}

/** "$85" / "$85.50" / "₡17,500" según moneda. */
export function formatPrecio(n: number, moneda: Moneda = 'usd'): string {
  if (moneda === 'crc') return `₡${Math.round(n).toLocaleString('en-US')}`;
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Alias USD para filtros y textos que asumen dólares. */
export function formatUSD(n: number): string {
  return formatPrecio(n, 'usd');
}

export type Frescura = 'ok' | 'warn' | 'danger';

export interface InfoFrescura {
  estado: Frescura;
  dias: number;
  label: string; // "Actualizado" | "Revisar" | "Desactualizado"
  relativo: string; // "hace 12 días"
}

/** Semáforo de frescura del tarifario (design.md §8) */
export function freshness(fechaISO: string): InfoFrescura {
  const ms = Date.now() - new Date(fechaISO + 'T12:00:00').getTime();
  const dias = Math.max(0, Math.floor(ms / 86_400_000));
  const estado: Frescura = dias < 90 ? 'ok' : dias <= 180 ? 'warn' : 'danger';
  const label = estado === 'ok' ? 'Actualizado' : estado === 'warn' ? 'Revisar' : 'Desactualizado';
  const relativo = dias === 0 ? 'hoy' : dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
  return { estado, dias, label, relativo };
}

/** Devuelve el horario principal de un tour (el de orden 0). */
export function horarioRepresentativo(tour: Tour): Horario | undefined {
  return tour.horarios.slice().sort((a, b) => a.orden - b.orden)[0];
}

/** Lista legible de salidas de un tour, p. ej. "07:00, 09:00". */
export function salidasTour(tour: Tour): string {
  const salidas = tour.horarios.slice().sort((a, b) => a.orden - b.orden).map((h) => h.hora_salida);
  return salidas.join(', ');
}

/* ------------------------------------------------------------------ */
/* Mapeo Supabase (PostgREST, snake_case) → frontend (design.md §8)    */
/* ------------------------------------------------------------------ */

type RowOperador = {
  id: number;
  nombre: string;
  telefono: string;
  email: string | null;
  comision: number | string | null;
  logo_url: string | null;
  poliza_url: string | null;
  politica_cancelacion: string | null;
};

type RowTarifa = {
  id: number;
  nombre: string | null;
  min_edad: number;
  max_edad: number | null;
  rack: number | string;
  neta: number | string | null;
  hora_desde: string | null;
  hora_hasta: string | null;
  orden: number;
};

type RowHorario = {
  id: number;
  hora_salida: string;
  hora_llegada: string;
  orden: number;
};

type RowTour = {
  id: number;
  nombre: string;
  zona: string;
  categoria: Categoria;
  precio_adulto: number | string;
  precio_nino: number | string | null;
  precio_neto_adulto: number | string | null;
  precio_neto_nino: number | string | null;
  duracion_horas: number | string;
  incluye: string[];
  no_incluye: string[];
  minimo_personas: number;
  apto_ninos: boolean;
  politica_cancelacion: string | null;
  observaciones: string | null;
  fuente: string | null;
  fecha_actualizacion: string;
  moneda: Moneda | null;
  operadores: RowOperador;
  tour_tarifas: RowTarifa[];
  tour_horarios: RowHorario[];
};

function mapOperador(o: RowOperador): Operador {
  return {
    id: o.id,
    nombre: o.nombre,
    telefono: o.telefono,
    email: o.email ?? null,
    comision: o.comision == null ? null : Number(o.comision),
    logo_url: o.logo_url ?? null,
    poliza_url: o.poliza_url ?? null,
    politica_cancelacion: o.politica_cancelacion ?? '',
  };
}

function mapTarifa(t: RowTarifa): Tarifa {
  return {
    id: t.id,
    nombre: t.nombre ?? '',
    min_edad: t.min_edad,
    max_edad: t.max_edad ?? null,
    rack: Number(t.rack),
    neta: t.neta == null ? null : Number(t.neta),
    hora_desde: t.hora_desde ?? null,
    hora_hasta: t.hora_hasta ?? null,
    orden: t.orden,
  };
}

function mapHorario(h: RowHorario): Horario {
  return {
    id: h.id,
    hora_salida: h.hora_salida,
    hora_llegada: h.hora_llegada,
    orden: h.orden,
  };
}

function mapTour(t: RowTour): Tour {
  return {
    id: t.id,
    operador: mapOperador(t.operadores),
    nombre: t.nombre,
    zona: t.zona,
    categoria: t.categoria,
    precio_adulto: Number(t.precio_adulto),
    precio_nino: t.precio_nino == null ? null : Number(t.precio_nino),
    precio_neto_adulto: t.precio_neto_adulto == null ? null : Number(t.precio_neto_adulto),
    precio_neto_nino: t.precio_neto_nino == null ? null : Number(t.precio_neto_nino),
    tarifas: (t.tour_tarifas ?? []).map(mapTarifa).sort((a, b) => a.orden - b.orden),
    horarios: (t.tour_horarios ?? []).map(mapHorario).sort((a, b) => a.orden - b.orden),
    duracion_horas: Number(t.duracion_horas),
    incluye: t.incluye ?? [],
    no_incluye: t.no_incluye ?? [],
    minimo_personas: t.minimo_personas,
    apto_ninos: t.apto_ninos,
    politica_cancelacion: t.politica_cancelacion ?? '',
    observaciones: t.observaciones ?? '',
    fuente: t.fuente ?? '',
    fecha_actualizacion: (t.fecha_actualizacion ?? '').slice(0, 10),
    moneda: t.moneda ?? 'usd',
  };
}

/* ------------------------------------------------------------------ */
/* Fetchers async — punto único de acceso a datos (Supabase)           */
/* ------------------------------------------------------------------ */

export async function fetchTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('*, operadores(*), tour_tarifas(*), tour_horarios(*)')
    .order('precio_adulto');
  if (error) throw error;
  return (data as RowTour[] | null ?? []).map(mapTour);
}

export async function fetchOperadores(): Promise<Operador[]> {
  const { data, error } = await supabase.from('operadores').select('*').order('nombre');
  if (error) throw error;
  return (data as RowOperador[] | null ?? []).map(mapOperador);
}

export async function fetchTourById(id: number): Promise<Tour | undefined> {
  const { data, error } = await supabase
    .from('tours')
    .select('*, operadores(*), tour_tarifas(*), tour_horarios(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTour(data as RowTour) : undefined;
}
