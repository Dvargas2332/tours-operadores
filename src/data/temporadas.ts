/**
 * Temporadas de precio por fecha (solo admin). No modifican las tarifas base:
 * agregan rangos que sobrescriben rack/neta para las fechas que cubren.
 */
import { supabase } from '@/lib/supabase';
import type { Temporada, TemporadaTarifa } from '@/data/mock-tours';

interface RowTemporadaTarifa {
  id: number;
  temporada_id: number;
  tarifa_id: number;
  rack: number | string;
  neta: number | string | null;
}

interface RowTemporada {
  id: number;
  tour_id: number;
  nombre: string;
  fecha_desde: string;
  fecha_hasta: string;
  prioridad: number;
  tour_temporada_tarifas: RowTemporadaTarifa[] | null;
}

export interface TemporadaInput {
  nombre: string;
  desde: string;
  hasta: string;
  prioridad?: number;
  tarifas: { tarifa_id: number; rack: number; neta: number | null }[];
}

function mapTemporada(row: RowTemporada): Temporada {
  return {
    id: row.id,
    tour_id: row.tour_id,
    nombre: row.nombre,
    fecha_desde: row.fecha_desde,
    fecha_hasta: row.fecha_hasta,
    prioridad: row.prioridad,
    tarifas: (row.tour_temporada_tarifas ?? []).map(
      (t): TemporadaTarifa => ({
        id: t.id,
        temporada_id: t.temporada_id,
        tarifa_id: t.tarifa_id,
        rack: Number(t.rack),
        neta: t.neta == null ? null : Number(t.neta),
      }),
    ),
  };
}

export async function fetchTemporadas(tourId: number): Promise<Temporada[]> {
  const { data, error } = await supabase
    .from('tour_temporadas')
    .select('*, tour_temporada_tarifas(*)')
    .eq('tour_id', tourId)
    .order('fecha_desde');
  if (error) throw error;
  return ((data ?? []) as RowTemporada[]).map(mapTemporada);
}

export async function crearTemporada(tourId: number, input: TemporadaInput): Promise<Temporada> {
  const { data: temporada, error } = await supabase
    .from('tour_temporadas')
    .insert({
      tour_id: tourId,
      nombre: input.nombre,
      fecha_desde: input.desde,
      fecha_hasta: input.hasta,
      prioridad: input.prioridad ?? 0,
    })
    .select('id, tour_id, nombre, fecha_desde, fecha_hasta, prioridad')
    .single();
  if (error) throw error;

  const { data: tarifas, error: errorTarifas } = await supabase
    .from('tour_temporada_tarifas')
    .insert(
      input.tarifas.map((t) => ({
        temporada_id: temporada.id,
        tarifa_id: t.tarifa_id,
        rack: t.rack,
        neta: t.neta,
      })),
    )
    .select('*');
  if (errorTarifas) {
    await supabase.from('tour_temporadas').delete().eq('id', temporada.id);
    throw errorTarifas;
  }

  return mapTemporada({
    ...temporada,
    tour_temporada_tarifas: (tarifas ?? []) as RowTemporadaTarifa[],
  });
}

export async function eliminarTemporada(id: number): Promise<void> {
  const { error } = await supabase.from('tour_temporadas').delete().eq('id', id);
  if (error) throw error;
}
