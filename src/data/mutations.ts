/**
 * Mutaciones y subidas de archivos contra Supabase (PostgREST + Storage).
 * Los inputs conservan la forma camelCase que usaban las páginas con tRPC;
 * aquí se convierten a las columnas snake_case de la base de datos.
 */
import { supabase } from '@/lib/supabase';

export interface TarifaInput {
  nombre?: string;
  minEdad: number;
  maxEdad?: number | null;
  rack: number;
  neta?: number | null;
  horaDesde?: string | null;
  horaHasta?: string | null;
  orden?: number;
}

export interface HorarioInput {
  horaSalida: string;
  horaLlegada: string;
  orden?: number;
}

export interface TourInput {
  nombre: string;
  zona: string;
  categoria: string;
  moneda?: string;
  precioAdulto: number;
  precioNino?: number | null;
  precioNetoAdulto?: number | null;
  precioNetoNino?: number | null;
  tarifas?: TarifaInput[];
  horarios?: HorarioInput[];
  duracionHoras: number;
  incluye?: string[];
  noIncluye?: string[];
  minimoPersonas?: number;
  aptoNinos?: boolean;
  politicaCancelacion?: string;
  observaciones?: string;
}

export interface OperadorInput {
  nombre: string;
  telefono?: string;
  email?: string | null;
  comision?: number | null;
  logoUrl?: string | null;
  polizaUrl?: string | null;
  politicaCancelacion?: string;
}

/* ------------------------------------------------------------------ */
/* Conversión camelCase → snake_case (columnas reales de Postgres)     */
/* ------------------------------------------------------------------ */

function tarifaToRow(t: TarifaInput, i: number) {
  return {
    nombre: t.nombre ?? '',
    min_edad: t.minEdad,
    max_edad: t.maxEdad ?? null,
    rack: t.rack,
    neta: t.neta ?? null,
    hora_desde: t.horaDesde ?? null,
    hora_hasta: t.horaHasta ?? null,
    orden: t.orden ?? i,
  };
}

function horarioToRow(h: HorarioInput, i: number) {
  return {
    hora_salida: h.horaSalida,
    hora_llegada: h.horaLlegada,
    orden: h.orden ?? i,
  };
}

function tourFieldsToRow(t: Partial<TourInput> & { operadorId?: number }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (t.operadorId !== undefined) out.operador_id = t.operadorId;
  if (t.nombre !== undefined) out.nombre = t.nombre;
  if (t.zona !== undefined) out.zona = t.zona;
  if (t.categoria !== undefined) out.categoria = t.categoria;
  if (t.moneda !== undefined) out.moneda = t.moneda;
  if (t.precioAdulto !== undefined) out.precio_adulto = t.precioAdulto;
  if (t.precioNino !== undefined) out.precio_nino = t.precioNino;
  if (t.precioNetoAdulto !== undefined) out.precio_neto_adulto = t.precioNetoAdulto;
  if (t.precioNetoNino !== undefined) out.precio_neto_nino = t.precioNetoNino;
  if (t.duracionHoras !== undefined) out.duracion_horas = t.duracionHoras;
  if (t.incluye !== undefined) out.incluye = t.incluye;
  if (t.noIncluye !== undefined) out.no_incluye = t.noIncluye;
  if (t.minimoPersonas !== undefined) out.minimo_personas = t.minimoPersonas;
  if (t.aptoNinos !== undefined) out.apto_ninos = t.aptoNinos;
  if (t.politicaCancelacion !== undefined) out.politica_cancelacion = t.politicaCancelacion;
  if (t.observaciones !== undefined) out.observaciones = t.observaciones;
  return out;
}

function operadorToRow(o: OperadorInput) {
  return {
    nombre: o.nombre.trim(),
    telefono: o.telefono ?? '',
    email: o.email ?? null,
    comision: o.comision ?? null,
    logo_url: o.logoUrl ?? null,
    poliza_url: o.polizaUrl ?? null,
    politica_cancelacion: o.politicaCancelacion ?? '',
  };
}

/* ------------------------------------------------------------------ */
/* Operadores                                                          */
/* ------------------------------------------------------------------ */

export async function crearOperadores(nuevos: OperadorInput[]) {
  const { data: existentes } = await supabase
    .from('operadores')
    .select('id, nombre, email, logo_url, poliza_url, politica_cancelacion');
  const porNombre = new Map((existentes ?? []).map((o) => [o.nombre, o]));

  let creados = 0;
  let actualizados = 0;
  const vistos = new Set<string>();

  for (const n of nuevos) {
    const nombre = n.nombre.trim();
    if (!nombre || vistos.has(nombre)) continue;
    vistos.add(nombre);

    const existente = porNombre.get(nombre);
    if (existente) {
      await supabase
        .from('operadores')
        .update({
          telefono: n.telefono ?? '',
          email: n.email ?? existente.email,
          comision: n.comision ?? null,
          logo_url: n.logoUrl ?? existente.logo_url,
          poliza_url: n.polizaUrl ?? existente.poliza_url,
          politica_cancelacion: n.politicaCancelacion ?? existente.politica_cancelacion,
        })
        .eq('id', existente.id);
      actualizados++;
    } else {
      await supabase.from('operadores').insert(operadorToRow(n));
      creados++;
    }
  }

  return { creados, actualizados };
}

export async function actualizarOperador(input: { id: number } & Partial<OperadorInput>) {
  const { id, ...resto } = input;
  const update: Record<string, unknown> = {};

  if (resto.nombre !== undefined) update.nombre = resto.nombre;
  if (resto.telefono !== undefined) update.telefono = resto.telefono;
  if (resto.email !== undefined) update.email = resto.email;
  if (resto.comision !== undefined) update.comision = resto.comision;
  if (resto.logoUrl !== undefined) update.logo_url = resto.logoUrl;
  if (resto.polizaUrl !== undefined) update.poliza_url = resto.polizaUrl;

  if (resto.politicaCancelacion !== undefined) {
    update.politica_cancelacion = resto.politicaCancelacion;
    await supabase
      .from('tours')
      .update({ politica_cancelacion: resto.politicaCancelacion })
      .eq('operador_id', id);
  }

  if (Object.keys(update).length) {
    await supabase.from('operadores').update(update).eq('id', id);
  }

  return { id };
}

export async function eliminarOperador(id: number) {
  await supabase.from('tours').delete().eq('operador_id', id);
  await supabase.from('operadores').delete().eq('id', id);
  return { ok: true as const };
}

/* ------------------------------------------------------------------ */
/* Tours                                                               */
/* ------------------------------------------------------------------ */

async function insertarTarifasYHorarios(
  tourId: number,
  tarifas?: TarifaInput[],
  horarios?: HorarioInput[],
) {
  if (tarifas?.length) {
    await supabase
      .from('tour_tarifas')
      .insert(tarifas.map((t, i) => ({ ...tarifaToRow(t, i), tour_id: tourId })));
  }
  if (horarios?.length) {
    await supabase
      .from('tour_horarios')
      .insert(horarios.map((h, i) => ({ ...horarioToRow(h, i), tour_id: tourId })));
  }
}

export async function crearTour(
  input: TourInput & { operadorId: number; fuente?: string; fechaActualizacion?: string },
) {
  const { operadorId, fuente = 'manual', fechaActualizacion = new Date().toISOString().slice(0, 10), tarifas, horarios, ...resto } = input;

  let politica = resto.politicaCancelacion ?? '';
  if (!politica) {
    const { data: op } = await supabase
      .from('operadores')
      .select('politica_cancelacion')
      .eq('id', operadorId)
      .maybeSingle();
    politica = op?.politica_cancelacion ?? '';
  }

  const row = {
    ...tourFieldsToRow(resto),
    operador_id: operadorId,
    fuente,
    fecha_actualizacion: fechaActualizacion,
    politica_cancelacion: politica,
  };

  const { data: creado, error } = await supabase.from('tours').insert(row).select('id').single();
  if (error) throw error;

  await insertarTarifasYHorarios(creado.id, tarifas, horarios);
  return { id: creado.id };
}

export async function actualizarTour(
  input: { id: number; operadorId?: number; tarifas?: TarifaInput[]; horarios?: HorarioInput[] } & Partial<TourInput>,
) {
  const { id, operadorId, tarifas, horarios, ...resto } = input;

  const update = tourFieldsToRow({ ...resto, operadorId });

  if (Object.keys(update).length) {
    const { error } = await supabase.from('tours').update(update).eq('id', id);
    if (error) throw error;
  }

  if (tarifas) {
    await supabase.from('tour_tarifas').delete().eq('tour_id', id);
    if (tarifas.length) {
      await supabase
        .from('tour_tarifas')
        .insert(tarifas.map((t, i) => ({ ...tarifaToRow(t, i), tour_id: id })));
    }
  }

  if (horarios) {
    await supabase.from('tour_horarios').delete().eq('tour_id', id);
    if (horarios.length) {
      await supabase
        .from('tour_horarios')
        .insert(horarios.map((h, i) => ({ ...horarioToRow(h, i), tour_id: id })));
    }
  }

  return { id };
}

export async function eliminarTour(id: number) {
  await supabase.from('tours').delete().eq('id', id);
  return { ok: true as const };
}

/* ------------------------------------------------------------------ */
/* Importación de catálogo completo                                    */
/* ------------------------------------------------------------------ */

export interface OperadorCatalogoInput extends OperadorInput {
  tours: TourInput[];
}

export async function importarCatalogo(input: {
  fuente: string;
  fechaActualizacion: string;
  operadores: OperadorCatalogoInput[];
}) {
  let operadoresCreados = 0;
  let operadoresActualizados = 0;
  let toursInsertados = 0;

  for (const op of input.operadores) {
    const nombre = op.nombre.trim();
    if (!nombre) continue;

    const { data: existentes } = await supabase
      .from('operadores')
      .select('id, email, logo_url, poliza_url, politica_cancelacion')
      .eq('nombre', nombre)
      .limit(1);

    let operadorId: number;
    let politicaOperador = op.politicaCancelacion ?? '';

    if (existentes && existentes.length) {
      operadorId = existentes[0].id;
      politicaOperador = op.politicaCancelacion ?? existentes[0].politica_cancelacion ?? '';
      await supabase
        .from('operadores')
        .update({
          telefono: op.telefono ?? '',
          email: op.email ?? existentes[0].email,
          comision: op.comision ?? null,
          logo_url: op.logoUrl ?? existentes[0].logo_url,
          poliza_url: op.polizaUrl ?? existentes[0].poliza_url,
          politica_cancelacion: politicaOperador,
        })
        .eq('id', operadorId);
      operadoresActualizados++;
    } else {
      const { data: creado, error } = await supabase
        .from('operadores')
        .insert({ ...operadorToRow(op), politica_cancelacion: politicaOperador })
        .select('id')
        .single();
      if (error) throw error;
      operadorId = creado.id;
      operadoresCreados++;
    }

    await supabase.from('tours').delete().eq('operador_id', operadorId);

    if (op.tours.length) {
      const { data: insertados, error } = await supabase
        .from('tours')
        .insert(
          op.tours.map((t) => ({
            ...tourFieldsToRow(t),
            operador_id: operadorId,
            fuente: input.fuente,
            fecha_actualizacion: input.fechaActualizacion,
            politica_cancelacion: t.politicaCancelacion || politicaOperador,
          })),
        )
        .select('id');
      if (error) throw error;

      for (let i = 0; i < (insertados ?? []).length; i++) {
        const tourId = insertados[i].id;
        await insertarTarifasYHorarios(tourId, op.tours[i]?.tarifas, op.tours[i]?.horarios);
      }
      toursInsertados += op.tours.length;
    }
  }

  return { operadoresCreados, operadoresActualizados, toursInsertados };
}

/* ------------------------------------------------------------------ */
/* Storage: logos y pólizas                                            */
/* ------------------------------------------------------------------ */

function nombreSeguro(file: File): string {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 10);
  return `${crypto.randomUUID()}.${ext}`;
}

export async function subirLogo(file: File): Promise<string> {
  const path = nombreSeguro(file);
  const { error } = await supabase.storage.from('logos').upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
}

export async function subirPoliza(file: File): Promise<string> {
  const path = nombreSeguro(file);
  const { error } = await supabase.storage.from('polizas').upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from('polizas').getPublicUrl(path).data.publicUrl;
}
