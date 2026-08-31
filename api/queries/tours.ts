import { and, asc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "./connection";
import { operadores, tourHorarios, tourTarifas, tours } from "@db/schema";

export interface FiltrosTours {
  q?: string; // texto libre (nombre, zona, observaciones)
  zonas?: string[];
  categorias?: Array<"aventura" | "naturaleza" | "acuatico" | "cultural" | "termas">;
  operadorIds?: number[];
  precioMin?: number;
  precioMax?: number;
  duracionMax?: number; // horas
  incluye?: string[]; // todos deben estar presentes
  aptoNinos?: boolean;
}

export async function findTours(f: FiltrosTours = {}) {
  const conds: SQL[] = [];

  if (f.q && f.q.trim()) {
    const q = `%${f.q.trim()}%`;
    conds.push(
      sql`(${tours.nombre} LIKE ${q} OR ${tours.zona} LIKE ${q} OR ${tours.observaciones} LIKE ${q} OR ${operadores.nombre} LIKE ${q})`
    );
  }
  if (f.zonas?.length) {
    conds.push(
      sql`${tours.zona} IN (${sql.join(
        f.zonas.map((z) => sql`${z}`),
        sql`, `
      )})`
    );
  }
  if (f.categorias?.length) {
    conds.push(
      sql`${tours.categoria} IN (${sql.join(
        f.categorias.map((c) => sql`${c}`),
        sql`, `
      )})`
    );
  }
  if (f.operadorIds?.length) {
    conds.push(
      sql`${tours.operadorId} IN (${sql.join(
        f.operadorIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );
  }
  if (f.precioMin != null) conds.push(gte(tours.precioAdulto, f.precioMin));
  if (f.precioMax != null) conds.push(lte(tours.precioAdulto, f.precioMax));
  if (f.duracionMax != null) conds.push(lte(tours.duracionHoras, f.duracionMax));
  if (f.aptoNinos) conds.push(eq(tours.aptoNinos, true));
  if (f.incluye?.length) {
    for (const item of f.incluye) {
      conds.push(sql`${tours.incluye} @> ${JSON.stringify([item])}::jsonb`);
    }
  }

  const db = getDb();
  const rows = await db
    .select({ tour: tours, operador: operadores })
    .from(tours)
    .innerJoin(operadores, eq(tours.operadorId, operadores.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(tours.precioAdulto));

  const tourIds = rows.map((r) => r.tour.id);
  const tarifas = tourIds.length
    ? await db.select().from(tourTarifas).where(sql`${tourTarifas.tourId} IN (${sql.join(tourIds.map((id) => sql`${id}`), sql`, `)})`)
    : [];
  const tarifasPorTour = new Map<number, typeof tarifas>();
  for (const t of tarifas) {
    const lista = tarifasPorTour.get(t.tourId) ?? [];
    lista.push(t);
    tarifasPorTour.set(t.tourId, lista);
  }

  const horarios = tourIds.length
    ? await db.select().from(tourHorarios).where(sql`${tourHorarios.tourId} IN (${sql.join(tourIds.map((id) => sql`${id}`), sql`, `)})`)
    : [];
  const horariosPorTour = new Map<number, typeof horarios>();
  for (const h of horarios) {
    const lista = horariosPorTour.get(h.tourId) ?? [];
    lista.push(h);
    horariosPorTour.set(h.tourId, lista);
  }

  return rows.map((r) => ({
    ...r,
    horarios: (horariosPorTour.get(r.tour.id) ?? []).sort((a, b) => a.orden - b.orden),
    tarifas: (tarifasPorTour.get(r.tour.id) ?? []).sort((a, b) => a.orden - b.orden),
  }));
}

export async function findTourById(id: number) {
  const db = getDb();
  const rows = await db
    .select({ tour: tours, operador: operadores })
    .from(tours)
    .innerJoin(operadores, eq(tours.operadorId, operadores.id))
    .where(eq(tours.id, id))
    .limit(1);
  if (!rows.length) return null;
  const tarifas = await db
    .select()
    .from(tourTarifas)
    .where(eq(tourTarifas.tourId, id))
    .orderBy(asc(tourTarifas.orden));
  const horarios = await db
    .select()
    .from(tourHorarios)
    .where(eq(tourHorarios.tourId, id))
    .orderBy(asc(tourHorarios.orden));
  return { ...rows[0], horarios, tarifas };
}

export async function findOperadores() {
  const db = getDb();
  return db
    .select({
      operador: operadores,
      totalTours: sql<number>`COUNT(${tours.id})`.as("total_tours"),
      ultimaActualizacion: sql<string | null>`MAX(${tours.fechaActualizacion})`.as(
        "ultima_actualizacion"
      ),
    })
    .from(operadores)
    .leftJoin(tours, eq(tours.operadorId, operadores.id))
    .groupBy(operadores.id)
    .orderBy(asc(operadores.nombre));
}

export async function findStats() {
  const db = getDb();
  const [t] = await db
    .select({
      totalTours: sql<number>`COUNT(*)`.as("total_tours"),
      ultimaCarga: sql<string | null>`MAX(${tours.fechaActualizacion})`.as(
        "ultima_carga"
      ),
    })
    .from(tours);
  const [o] = await db
    .select({ totalOperadores: sql<number>`COUNT(*)`.as("total_operadores") })
    .from(operadores);
  return {
    totalTours: Number(t?.totalTours ?? 0),
    totalOperadores: Number(o?.totalOperadores ?? 0),
    ultimaCarga: t?.ultimaCarga ?? null,
  };
}

export async function findFacetas() {
  const db = getDb();
  const zonas = await db
    .selectDistinct({ zona: tours.zona })
    .from(tours)
    .orderBy(asc(tours.zona));
  return { zonas: zonas.map((z) => z.zona) };
}

export interface OperadorNuevo {
  nombre: string;
  telefono: string;
  email?: string | null;
  comision?: number | null;
  logoUrl?: string | null;
  polizaUrl?: string | null;
  politicaCancelacion?: string;
}

/**
 * Inserta operadores en lote con upsert por nombre exacto:
 * si el nombre ya existe, actualiza teléfono/email/comisión en vez de duplicar.
 */
export async function insertOperadores(nuevos: OperadorNuevo[]) {
  const db = getDb();
  const existentes = await db.select().from(operadores);
  const porNombre = new Map(existentes.map((o) => [o.nombre, o]));
  let creados = 0;
  let actualizados = 0;
  const vistos = new Set<string>(); // dedupe dentro del mismo lote
  for (const n of nuevos) {
    const nombre = n.nombre.trim();
    if (!nombre || vistos.has(nombre)) continue;
    vistos.add(nombre);
    const comision = n.comision ?? null;
    const existente = porNombre.get(nombre);
    if (existente) {
      await db
        .update(operadores)
        .set({
          telefono: n.telefono,
          email: n.email ?? existente.email,
          comision,
          logoUrl: n.logoUrl ?? existente.logoUrl,
          polizaUrl: n.polizaUrl ?? existente.polizaUrl,
          politicaCancelacion: n.politicaCancelacion ?? existente.politicaCancelacion,
        })
        .where(eq(operadores.id, existente.id));
      actualizados++;
    } else {
      await db.insert(operadores).values({ nombre, telefono: n.telefono, email: n.email ?? null, comision, logoUrl: n.logoUrl, polizaUrl: n.polizaUrl, politicaCancelacion: n.politicaCancelacion });
      creados++;
    }
  }
  return { creados, actualizados };
}

/** Borra un operador y todos sus tours asociados. */
export async function deleteOperadorConTours(id: number) {
  const db = getDb();
  await db.delete(tours).where(eq(tours.operadorId, id));
  await db.delete(operadores).where(eq(operadores.id, id));
  return { ok: true as const };
}

export interface TarifaInput {
  nombre?: string;
  minEdad: number;
  maxEdad?: number | null;
  rack: number;
  neta?: number | null;
  orden?: number;
}

export interface HorarioInput {
  horaSalida: string;
  horaLlegada: string;
  orden?: number;
}

export type TourConTarifasInput = Omit<
  typeof tours.$inferInsert,
  "operadorId" | "fuente" | "fechaActualizacion"
> & {
  tarifas?: TarifaInput[];
  horarios?: HorarioInput[];
};

export async function replaceToursDeOperador(
  operadorId: number,
  nuevos: TourConTarifasInput[],
  fuente: string,
  fechaActualizacion: string
) {
  const db = getDb();
  const [op] = await db
    .select({ politicaCancelacion: operadores.politicaCancelacion })
    .from(operadores)
    .where(eq(operadores.id, operadorId))
    .limit(1);
  const politicaOperador = op?.politicaCancelacion ?? '';
  await db.delete(tours).where(eq(tours.operadorId, operadorId));
  if (nuevos.length) {
    const insertados = await db
      .insert(tours)
      .values(nuevos.map((t) => ({
        ...t,
        politicaCancelacion: t.politicaCancelacion || politicaOperador,
        operadorId,
        fuente,
        fechaActualizacion,
      })))
      .returning({ id: tours.id });
    for (let i = 0; i < insertados.length; i++) {
      const tourId = insertados[i].id;
      const tarifas = nuevos[i]?.tarifas ?? [];
      if (tarifas.length) {
        await db.insert(tourTarifas).values(
          tarifas.map((ta) => ({ ...ta, tourId }))
        );
      }
      const horarios = nuevos[i]?.horarios ?? [];
      if (horarios.length) {
        await db.insert(tourHorarios).values(
          horarios.map((h, idx) => ({ ...h, orden: h.orden ?? idx, tourId }))
        );
      }
    }
  }
  return { insertados: nuevos.length };
}

export interface OperadorCatalogoInput {
  nombre: string;
  telefono: string;
  email?: string | null;
  comision?: number | null;
  logoUrl?: string | null;
  polizaUrl?: string | null;
  politicaCancelacion?: string;
  tours: TourConTarifasInput[];
}

/**
 * Importa un catálogo completo: por cada operador hace upsert por nombre
 * exacto y reemplaza sus tours. Sin transacción (mismo patrón que el resto).
 */
export async function importarCatalogo(catalogo: {
  fuente: string;
  fechaActualizacion: string;
  operadores: OperadorCatalogoInput[];
}) {
  const db = getDb();
  let operadoresCreados = 0;
  let operadoresActualizados = 0;
  let toursInsertados = 0;

  for (const op of catalogo.operadores) {
    const nombre = op.nombre.trim();
    if (!nombre) continue;

    const existentes = await db
      .select({ id: operadores.id })
      .from(operadores)
      .where(eq(operadores.nombre, nombre))
      .limit(1);

    let operadorId: number;
    let politicaOperador = op.politicaCancelacion ?? '';
    if (existentes.length) {
      operadorId = existentes[0].id;
      const [existente] = await db
        .select({ logoUrl: operadores.logoUrl, polizaUrl: operadores.polizaUrl, politicaCancelacion: operadores.politicaCancelacion, email: operadores.email })
        .from(operadores)
        .where(eq(operadores.id, operadorId))
        .limit(1);
      politicaOperador = op.politicaCancelacion ?? existente?.politicaCancelacion ?? '';
      await db
        .update(operadores)
        .set({
          telefono: op.telefono,
          email: op.email ?? existente?.email,
          comision: op.comision ?? null,
          logoUrl: op.logoUrl ?? existente?.logoUrl,
          polizaUrl: op.polizaUrl ?? existente?.polizaUrl,
          politicaCancelacion: politicaOperador,
        })
        .where(eq(operadores.id, operadorId));
      operadoresActualizados++;
    } else {
      const [res] = await db
        .insert(operadores)
        .values({ nombre, telefono: op.telefono, email: op.email ?? null, comision: op.comision ?? null, logoUrl: op.logoUrl, polizaUrl: op.polizaUrl, politicaCancelacion: politicaOperador })
        .returning({ id: operadores.id });
      operadorId = res.id;
      operadoresCreados++;
    }
    await db.delete(tours).where(eq(tours.operadorId, operadorId));
    if (op.tours.length) {
      const insertados = await db
        .insert(tours)
        .values(
          op.tours.map((t) => ({
            ...t,
            politicaCancelacion: t.politicaCancelacion || politicaOperador,
            operadorId,
            fuente: catalogo.fuente,
            fechaActualizacion: catalogo.fechaActualizacion,
          }))
        )
        .returning({ id: tours.id });
      for (let i = 0; i < insertados.length; i++) {
        const tourId = insertados[i].id;
        const tarifas = op.tours[i]?.tarifas ?? [];
        if (tarifas.length) {
          await db.insert(tourTarifas).values(
            tarifas.map((ta) => ({ ...ta, tourId }))
          );
        }
        const horarios = op.tours[i]?.horarios ?? [];
        if (horarios.length) {
          await db.insert(tourHorarios).values(
            horarios.map((h, idx) => ({ ...h, orden: h.orden ?? idx, tourId }))
          );
        }
      }
      toursInsertados += op.tours.length;
    }
  }

  return { operadoresCreados, operadoresActualizados, toursInsertados };
}

/* ------------------------------------------------------------------ */
/* Edición individual de tours y operadores                          */
/* ------------------------------------------------------------------ */

export type TourActualizarInput = Partial<
  Omit<typeof tours.$inferInsert, "id" | "operadorId">
> & {
  tarifas?: TarifaInput[];
  horarios?: HorarioInput[];
};

export type TourCrearInput = Omit<typeof tours.$inferInsert, "id" | "createdAt"> & {
  tarifas?: TarifaInput[];
  horarios?: HorarioInput[];
};

export async function insertTour(input: TourCrearInput) {
  const db = getDb();
  const { tarifas, horarios, ...resto } = input;

  if (!resto.politicaCancelacion) {
    const [op] = await db
      .select({ politicaCancelacion: operadores.politicaCancelacion })
      .from(operadores)
      .where(eq(operadores.id, resto.operadorId))
      .limit(1);
    if (op) resto.politicaCancelacion = op.politicaCancelacion;
  }

  const [creado] = await db.insert(tours).values(resto).returning({ id: tours.id });
  const tourId = creado.id;

  if (tarifas?.length) {
    await db
      .insert(tourTarifas)
      .values(tarifas.map((t, i) => ({ ...t, orden: t.orden ?? i, tourId })));
  }

  if (horarios?.length) {
    await db
      .insert(tourHorarios)
      .values(horarios.map((h, i) => ({ ...h, orden: h.orden ?? i, tourId })));
  }

  return findTourById(tourId);
}

export async function updateTour(id: number, input: TourActualizarInput) {
  const db = getDb();
  const { tarifas, horarios, ...resto } = input;

  await db.update(tours).set(resto).where(eq(tours.id, id));

  if (tarifas) {
    await db.delete(tourTarifas).where(eq(tourTarifas.tourId, id));
    if (tarifas.length) {
      await db
        .insert(tourTarifas)
        .values(tarifas.map((t, i) => ({ ...t, orden: t.orden ?? i, tourId: id })));
    }
  }

  if (horarios) {
    await db.delete(tourHorarios).where(eq(tourHorarios.tourId, id));
    if (horarios.length) {
      await db
        .insert(tourHorarios)
        .values(horarios.map((h, i) => ({ ...h, orden: h.orden ?? i, tourId: id })));
    }
  }

  return findTourById(id);
}

export async function deleteTour(id: number) {
  const db = getDb();
  await db.delete(tours).where(eq(tours.id, id));
  return { ok: true as const };
}

export type OperadorActualizarInput = Partial<
  Omit<typeof operadores.$inferInsert, "id">
> & { polizaUrl?: string | null };

export async function updateOperador(id: number, input: OperadorActualizarInput) {
  const db = getDb();
  await db.update(operadores).set(input).where(eq(operadores.id, id));
  if (input.politicaCancelacion !== undefined) {
    await db.update(tours).set({ politicaCancelacion: input.politicaCancelacion }).where(eq(tours.operadorId, id));
  }
  const row = await db.select().from(operadores).where(eq(operadores.id, id)).limit(1);
  return row[0] ?? null;
}
