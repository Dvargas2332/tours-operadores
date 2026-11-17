/**
 * Mutaciones y subidas de archivos contra Supabase (PostgREST + Storage).
 * Los inputs usan camelCase; aquí se convierten a las columnas snake_case de la base.
 */
import { supabase } from '@/lib/supabase';
import { serializarCategorias } from '@/data/mock-tours';
import type { Categoria } from '@/data/mock-tours';

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
  codigo?: string;
  nombre: string;
  zona: string;
  categorias?: Categoria[];
  moneda?: string;
  precioAdulto: number;
  precioNino?: number | null;
  precioNetoAdulto?: number | null;
  precioNetoNino?: number | null;
  tarifas?: TarifaInput[];
  horarios?: HorarioInput[];
  duracionHoras?: number;
  incluye?: string[];
  minimoPersonas?: number;
  aptoNinos?: boolean;
  activo?: boolean;
  politicaCancelacion?: string;
  observaciones?: string;
  /** Metadatos del importador: qué campos trajo el Excel (no va a la base). */
  camposPresentes?: Record<string, boolean>;
}

export interface OperadorInput {
  nombre: string;
  codigo?: string;
  telefono?: string;
  email?: string | null;
  comision?: number | null;
  logoUrl?: string | null;
  polizaUrl?: string | null;
  politicaCancelacion?: string;
  horario?: string;
  activo?: boolean;
  conIva?: boolean;
  pagoCompraclic?: boolean;
  pagoSinpe?: boolean;
  pagoTransferencia?: boolean;
  pagoCxc?: boolean;
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
  if (t.codigo !== undefined) out.codigo = t.codigo;
  if (t.nombre !== undefined) out.nombre = t.nombre;
  if (t.zona !== undefined) out.zona = t.zona;
  if (t.categorias !== undefined) out.categoria = serializarCategorias(t.categorias);
  if (t.moneda !== undefined) out.moneda = t.moneda;
  if (t.precioAdulto !== undefined) out.precio_adulto = t.precioAdulto;
  if (t.precioNino !== undefined) out.precio_nino = t.precioNino;
  if (t.precioNetoAdulto !== undefined) out.precio_neto_adulto = t.precioNetoAdulto;
  if (t.precioNetoNino !== undefined) out.precio_neto_nino = t.precioNetoNino;
  if (t.duracionHoras !== undefined) out.duracion_horas = t.duracionHoras;
  if (t.incluye !== undefined) out.incluye = t.incluye;
  if (t.minimoPersonas !== undefined) out.minimo_personas = t.minimoPersonas;
  if (t.aptoNinos !== undefined) out.apto_ninos = t.aptoNinos;
  if (t.activo !== undefined) out.activo = t.activo;
  if (t.politicaCancelacion !== undefined) out.politica_cancelacion = t.politicaCancelacion;
  if (t.observaciones !== undefined) out.observaciones = t.observaciones;
  return out;
}

function operadorToRow(o: OperadorInput) {
  return {
    codigo: o.codigo ? normalizarCodigo(o.codigo) : null,
    nombre: o.nombre.trim(),
    telefono: o.telefono ?? '',
    email: o.email ?? null,
    comision: o.comision ?? null,
    logo_url: o.logoUrl ?? null,
    poliza_url: o.polizaUrl ?? null,
    politica_cancelacion: o.politicaCancelacion ?? '',
    horario: o.horario ?? '',
    activo: o.activo ?? true,
    con_iva: o.conIva ?? false,
    pago_compraclic: o.pagoCompraclic ?? false,
    pago_sinpe: o.pagoSinpe ?? false,
    pago_transferencia: o.pagoTransferencia ?? false,
    pago_cxc: o.pagoCxc ?? false,
  };
}

/* ------------------------------------------------------------------ */
/* Códigos                                                             */
/* ------------------------------------------------------------------ */

function normalizarCodigo(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 15);
}

function codigoOperadorUnico(nombre: string, usados: Set<string>): string {
  const primera = nombre.trim().split(/\s+/)[0] ?? '';
  const base = normalizarCodigo(primera) || 'OPERADOR';
  let codigo = base;
  let n = 2;
  while (usados.has(codigo)) {
    codigo = `${base.slice(0, 12)}${n}`;
    n++;
  }
  usados.add(codigo);
  return codigo;
}

function siguienteSubcodigo(codigos: (string | null | undefined)[]): string {
  let max = 0;
  for (const c of codigos) {
    const n = Number.parseInt(c ?? '', 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return String(max + 1).padStart(2, '0');
}

/* ------------------------------------------------------------------ */
/* Operadores                                                          */
/* ------------------------------------------------------------------ */

export async function crearOperadores(nuevos: OperadorInput[]) {
  const { data: existentes } = await supabase
    .from('operadores')
    .select('id, codigo, nombre, logo_url, poliza_url, politica_cancelacion');
  const porNombre = new Map((existentes ?? []).map((o) => [o.nombre, o]));
  const usados = new Set(
    (existentes ?? []).map((o) => o.codigo).filter((c): c is string => Boolean(c)),
  );

  let creados = 0;
  let actualizados = 0;
  const vistos = new Set<string>();

  for (const n of nuevos) {
    const nombre = n.nombre.trim();
    if (!nombre || vistos.has(nombre)) continue;
    vistos.add(nombre);

    const existente = porNombre.get(nombre);
    if (existente) {
      const update: Record<string, unknown> = {
        comision: n.comision ?? null,
        logo_url: n.logoUrl ?? existente.logo_url,
        poliza_url: n.polizaUrl ?? existente.poliza_url,
        politica_cancelacion: n.politicaCancelacion ?? existente.politica_cancelacion,
      };
      if (n.codigo?.trim()) update.codigo = normalizarCodigo(n.codigo);
      if (n.telefono?.trim()) update.telefono = n.telefono;
      if (n.email != null) update.email = n.email;
      await supabase.from('operadores').update(update).eq('id', existente.id);
      actualizados++;
    } else {
      const codigo = n.codigo?.trim()
        ? normalizarCodigo(n.codigo)
        : codigoOperadorUnico(nombre, usados);
      await supabase.from('operadores').insert(operadorToRow({ ...n, codigo }));
      creados++;
    }
  }

  return { creados, actualizados };
}

export async function actualizarOperador(input: { id: number } & Partial<OperadorInput>) {
  const { id, ...resto } = input;
  const update: Record<string, unknown> = {};

  if (resto.codigo !== undefined && resto.codigo.trim()) {
    update.codigo = normalizarCodigo(resto.codigo);
  }
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
  if (resto.horario !== undefined) update.horario = resto.horario;
  if (resto.activo !== undefined) update.activo = resto.activo;
  if (resto.conIva !== undefined) update.con_iva = resto.conIva;
  if (resto.pagoCompraclic !== undefined) update.pago_compraclic = resto.pagoCompraclic;
  if (resto.pagoSinpe !== undefined) update.pago_sinpe = resto.pagoSinpe;
  if (resto.pagoTransferencia !== undefined) update.pago_transferencia = resto.pagoTransferencia;
  if (resto.pagoCxc !== undefined) update.pago_cxc = resto.pagoCxc;

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
  input: TourInput & { operadorId: number; fechaActualizacion?: string },
) {
  const { operadorId, fechaActualizacion = new Date().toISOString().slice(0, 10), tarifas, horarios, ...resto } = input;

  let politica = resto.politicaCancelacion ?? '';
  if (!politica) {
    const { data: op } = await supabase
      .from('operadores')
      .select('politica_cancelacion')
      .eq('id', operadorId)
      .maybeSingle();
    politica = op?.politica_cancelacion ?? '';
  }

  const codigoIngresado = resto.codigo?.trim();
  let codigo = codigoIngresado ? normalizarCodigo(codigoIngresado) : '';
  if (!codigo) {
    const { data: codigos } = await supabase
      .from('tours')
      .select('codigo')
      .eq('operador_id', operadorId);
    codigo = siguienteSubcodigo((codigos ?? []).map((t) => t.codigo));
  }

  const row = {
    ...tourFieldsToRow(resto),
    codigo,
    operador_id: operadorId,
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

  if (resto.codigo !== undefined) {
    const codigo = resto.codigo.trim() ? normalizarCodigo(resto.codigo) : '';
    if (codigo) update.codigo = codigo;
    else delete update.codigo;
  }

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
  fechaActualizacion: string;
  operadores: OperadorCatalogoInput[];
}) {
  let operadoresCreados = 0;
  let operadoresActualizados = 0;
  let toursCreados = 0;
  let toursActualizados = 0;

  const { data: todosOperadores } = await supabase.from('operadores').select('codigo');
  const codigosOperador = new Set(
    (todosOperadores ?? []).map((o) => o.codigo).filter((c): c is string => Boolean(c)),
  );

  for (const op of input.operadores) {
    const nombre = op.nombre.trim();
    if (!nombre) continue;

    const codigoArchivo = op.codigo?.trim() ? normalizarCodigo(op.codigo) : '';
    let existentes: { id: number; codigo: string | null; comision: number | null; logo_url: string | null; poliza_url: string | null; politica_cancelacion: string | null }[] | null = null;

    if (codigoArchivo) {
      const { data } = await supabase
        .from('operadores')
        .select('id, codigo, comision, logo_url, poliza_url, politica_cancelacion')
        .eq('codigo', codigoArchivo)
        .limit(1);
      existentes = data;
    }
    if (!existentes || existentes.length === 0) {
      const { data } = await supabase
        .from('operadores')
        .select('id, codigo, comision, logo_url, poliza_url, politica_cancelacion')
        .eq('nombre', nombre)
        .limit(1);
      existentes = data;
    }

    let operadorId: number;
    let politicaOperador = op.politicaCancelacion ?? '';

    if (existentes && existentes.length) {
      operadorId = existentes[0].id;
      politicaOperador = op.politicaCancelacion ?? existentes[0].politica_cancelacion ?? '';
      const update: Record<string, unknown> = {
        comision: op.comision ?? existentes[0].comision ?? null,
        logo_url: op.logoUrl ?? existentes[0].logo_url,
        poliza_url: op.polizaUrl ?? existentes[0].poliza_url,
        politica_cancelacion: politicaOperador,
      };
      if (codigoArchivo) update.codigo = codigoArchivo;
      if (op.telefono?.trim()) update.telefono = op.telefono;
      if (op.email != null) update.email = op.email;
      await supabase.from('operadores').update(update).eq('id', operadorId);
      operadoresActualizados++;
    } else {
      const codigo = codigoArchivo || codigoOperadorUnico(nombre, codigosOperador);
      const { data: creado, error } = await supabase
        .from('operadores')
        .insert({ ...operadorToRow({ ...op, codigo }), politica_cancelacion: politicaOperador })
        .select('id')
        .single();
      if (error) throw error;
      operadorId = creado.id;
      operadoresCreados++;
    }

    // Actualización por subcódigo: los tours que no vienen en el archivo se
    // conservan (no se borra nada). Las filas sin código se crean nuevas.
    const { data: toursExistentes, error: errExistentes } = await supabase
      .from('tours')
      .select('id, codigo, codigo_legacy, activo')
      .eq('operador_id', operadorId);
    if (errExistentes) throw errExistentes;
    const porCodigo = new Map((toursExistentes ?? []).map((t) => [t.codigo, t]));
    const porLegacy = new Map(
      (toursExistentes ?? [])
        .filter((t) => t.codigo_legacy)
        .map((t) => [t.codigo_legacy as string, t]),
    );
    const codigosTours = new Set((toursExistentes ?? []).map((t) => t.codigo));

    for (const t of op.tours) {
      const codigoArchivo = (t.codigo ?? '').trim();
      const existente = codigoArchivo
        ? porCodigo.get(codigoArchivo) ?? porLegacy.get(codigoArchivo)
        : undefined;

      if (existente) {
        const update = tourFieldsToRow(t);
        // El código del tour no se cambia desde el archivo.
        delete update.codigo;
        const campos = t.camposPresentes ?? {};
        const opcionales: [string, string][] = [
          ['zona', 'zona'],
          ['categorias', 'categoria'],
          ['duracion', 'duracion_horas'],
          ['minimo', 'minimo_personas'],
          ['aptoNinos', 'apto_ninos'],
          ['politica', 'politica_cancelacion'],
          ['observaciones', 'observaciones'],
          ['incluye', 'incluye'],
          ['moneda', 'moneda'],
        ];
        for (const [flag, columna] of opcionales) {
          if (!campos[flag]) delete update[columna];
        }
        if (!campos.tarifas) {
          delete update.precio_adulto;
          delete update.precio_nino;
          delete update.precio_neto_adulto;
          delete update.precio_neto_nino;
        }
        delete update.activo;
        update.operador_id = operadorId;
        update.fecha_actualizacion = input.fechaActualizacion;

        const { error } = await supabase.from('tours').update(update).eq('id', existente.id);
        if (error) throw error;

        if (campos.tarifas && t.tarifas) {
          await supabase.from('tour_tarifas').delete().eq('tour_id', existente.id);
          if (t.tarifas.length) {
            await supabase
              .from('tour_tarifas')
              .insert(t.tarifas.map((x, i) => ({ ...tarifaToRow(x, i), tour_id: existente.id })));
          }
        }
        if (campos.horarios && t.horarios) {
          await supabase.from('tour_horarios').delete().eq('tour_id', existente.id);
          if (t.horarios.length) {
            await supabase
              .from('tour_horarios')
              .insert(t.horarios.map((h, i) => ({ ...horarioToRow(h, i), tour_id: existente.id })));
          }
        }
        toursActualizados++;
        continue;
      }

      let codigo = codigoArchivo ? normalizarCodigo(codigoArchivo) : '';
      if (!codigo) codigo = siguienteSubcodigo([...codigosTours]);
      codigosTours.add(codigo);

      const row = {
        ...tourFieldsToRow(t),
        codigo,
        operador_id: operadorId,
        fecha_actualizacion: input.fechaActualizacion,
        politica_cancelacion: t.politicaCancelacion || politicaOperador,
        activo: true,
      };
      const { data: creado, error } = await supabase.from('tours').insert(row).select('id').single();
      if (error) throw error;

      await insertarTarifasYHorarios(creado.id, t.tarifas, t.horarios);
      toursCreados++;
    }
  }

  return {
    operadoresCreados,
    operadoresActualizados,
    toursCreados,
    toursActualizados,
    toursInsertados: toursCreados,
  };
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
  // El bucket es privado: guardamos la ruta del objeto, no una URL pública.
  return path;
}

export async function subirFondo(file: File): Promise<string> {
  const path = nombreSeguro(file);
  const { error } = await supabase.storage.from('fondos').upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from('fondos').getPublicUrl(path).data.publicUrl;
}

/* ------------------------------------------------------------------ */
/* Configuración del hotel                                             */
/* ------------------------------------------------------------------ */

export async function actualizarHotel(input: {
  nombre: string;
  whatsapp: string;
  email: string | null;
  fondo_url: string | null;
}) {
  const { error } = await supabase.from('hotel').upsert({ id: 1, ...input });
  if (error) throw error;
  return { ok: true as const };
}
