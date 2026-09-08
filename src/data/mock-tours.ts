/**
 * Capa de acceso a datos de Tours Operadores.
 *
 * Todas las páginas consumen los fetchers async de este archivo
 * (fetchTours, fetchOperadores, fetchTourById). La implementación habla
 * directo con Supabase (PostgREST) usando supabase-js.
 */
import { supabase } from '@/lib/supabase';

export type Categoria = 'aventura' | 'naturaleza' | 'acuatico' | 'cultural' | 'termas';

const CATEGORIAS_VALIDAS: readonly Categoria[] = ['aventura', 'naturaleza', 'acuatico', 'cultural', 'termas'];

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
  horario: string; // horario del operador (para tours que heredan su horario)
  activo: boolean; // si está desactivado, sus tours no se muestran en la vista pública
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
  categorias: Categoria[];
  precio_adulto: number; // tarifa base representativa (rango adulto 12-64)
  precio_nino: number | null; // legacy
  precio_neto_adulto: number | null; // legacy
  precio_neto_nino: number | null; // legacy
  tarifas: Tarifa[];
  horarios: Horario[];
  duracion_horas: number;
  incluye: string[]; // transporte, guia, almuerzo, entradas, equipo, seguro
  minimo_personas: number;
  apto_ninos: boolean;
  politica_cancelacion: string;
  observaciones: string;
  fecha_actualizacion: string; // ISO date
  moneda: Moneda; // usd | crc
}

export interface Hotel {
  id: number;
  nombre: string;
  whatsapp: string;
  email: string | null;
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

/** Indica si el horario tiene una llegada real (distinta de la salida). */
export function horarioTieneLlegada(h: Horario): boolean {
  const salida = (h.hora_salida ?? '').trim();
  const llegada = (h.hora_llegada ?? '').trim();
  return !!llegada && llegada !== salida;
}

/**
 * Etiqueta compacta de un horario:
 * - con llegada real: "08:00 - 12:00"
 * - sin llegada:      "Inicia 08:00"
 */
export function horarioLabel(h: Horario): string {
  return horarioTieneLlegada(h) ? `${h.hora_salida} - ${h.hora_llegada}` : `Inicia ${h.hora_salida}`;
}

/** Lista legible de horarios de un tour, p. ej. "Inicia 08:00 · 13:00 - 17:00". */
export function horariosLabel(tour: Tour): string {
  return tour.horarios
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map(horarioLabel)
    .join(' · ');
}

/** Convierte el valor crudo de la columna `categoria` (separado por comas) a lista. */
export function parseCategorias(raw: string | null | undefined): Categoria[] {
  const validas = new Set<string>(CATEGORIAS_VALIDAS);
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Categoria => validas.has(s));
}

/** Serializa la lista de categorías a una cadena separada por comas. */
export function serializarCategorias(categorias: Categoria[]): string {
  return categorias.join(',');
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
  horario: string | null;
  activo: boolean | null;
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
  categoria: string | null;
  precio_adulto: number | string;
  precio_nino: number | string | null;
  precio_neto_adulto: number | string | null;
  precio_neto_nino: number | string | null;
  duracion_horas: number | string;
  incluye: string[];
  minimo_personas: number;
  apto_ninos: boolean;
  politica_cancelacion: string | null;
  observaciones: string | null;
  fecha_actualizacion: string;
  moneda: Moneda | null;
  operadores: RowOperador | null;
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
    horario: o.horario ?? '',
    activo: o.activo ?? true,
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
  if (!t.operadores) {
    throw new Error(`Tour ${t.id} no tiene operador asociado`);
  }
  return {
    id: t.id,
    operador: mapOperador(t.operadores),
    nombre: t.nombre,
    zona: t.zona,
    categorias: parseCategorias(t.categoria),
    precio_adulto: Number(t.precio_adulto),
    precio_nino: t.precio_nino == null ? null : Number(t.precio_nino),
    precio_neto_adulto: t.precio_neto_adulto == null ? null : Number(t.precio_neto_adulto),
    precio_neto_nino: t.precio_neto_nino == null ? null : Number(t.precio_neto_nino),
    tarifas: (t.tour_tarifas ?? []).map(mapTarifa).sort((a, b) => a.orden - b.orden),
    horarios: (t.tour_horarios ?? []).map(mapHorario).sort((a, b) => a.orden - b.orden),
    duracion_horas: Number(t.duracion_horas),
    incluye: t.incluye ?? [],
    minimo_personas: t.minimo_personas,
    apto_ninos: t.apto_ninos,
    politica_cancelacion: t.politica_cancelacion ?? '',
    observaciones: t.observaciones ?? '',
    fecha_actualizacion: (t.fecha_actualizacion ?? '').slice(0, 10),
    moneda: t.moneda ?? 'usd',
  };
}

/* ------------------------------------------------------------------ */
/* Fetchers async — punto único de acceso a datos (Supabase)           */
/* ------------------------------------------------------------------ */

async function esAutenticado(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session != null;
}

const TOURS_SELECT = '*, operadores(*), tour_tarifas(*), tour_horarios(*)';
const TOURS_SELECT_PUBLICO =
  'id, operador_id, nombre, zona, categoria, precio_adulto, precio_nino, duracion_horas, incluye, minimo_personas, apto_ninos, politica_cancelacion, observaciones, fecha_actualizacion, moneda, operadores(id, nombre, telefono, email, logo_url, poliza_url, politica_cancelacion, horario, activo), tour_tarifas(id, tour_id, nombre, min_edad, max_edad, rack, orden), tour_horarios(*)';
const OPERADORES_SELECT = '*';
const OPERADORES_SELECT_PUBLICO = 'id, nombre, telefono, email, logo_url, poliza_url, politica_cancelacion, horario, activo';

export async function fetchTours(): Promise<Tour[]> {
  const autenticado = await esAutenticado();
  const select = autenticado ? TOURS_SELECT : TOURS_SELECT_PUBLICO;
  let query = supabase.from('tours').select(select);
  if (!autenticado) query = query.eq('operadores.activo', true);
  const { data, error } = await query.order('precio_adulto');
  if (error) throw error;
  return ((data as unknown as RowTour[]) ?? []).filter((t) => t.operadores != null).map(mapTour);
}

export async function fetchOperadores(): Promise<Operador[]> {
  const autenticado = await esAutenticado();
  const select = autenticado ? OPERADORES_SELECT : OPERADORES_SELECT_PUBLICO;
  let query = supabase.from('operadores').select(select);
  if (!autenticado) query = query.eq('activo', true);
  const { data, error } = await query.order('nombre');
  if (error) throw error;
  return ((data as unknown as RowOperador[]) ?? []).map(mapOperador);
}

export async function fetchTourById(id: number): Promise<Tour | undefined> {
  const autenticado = await esAutenticado();
  const select = autenticado ? TOURS_SELECT : TOURS_SELECT_PUBLICO;
  let query = supabase.from('tours').select(select);
  if (!autenticado) query = query.eq('operadores.activo', true);
  const { data, error } = await query.eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data || (data as unknown as RowTour).operadores == null) return undefined;
  return mapTour(data as unknown as RowTour);
}

export async function fetchHotel(): Promise<Hotel | null> {
  const { data, error } = await supabase.from('hotel').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data ? (data as unknown as Hotel) : null;
}
