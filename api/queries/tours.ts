import { and, asc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "./connection";
import { operadores, tours } from "@db/schema";

export interface FiltrosTours {
  q?: string; // texto libre (nombre, zona, observaciones)
  zonas?: string[];
  categorias?: Array<"aventura" | "naturaleza" | "acuatico" | "cultural" | "termas">;
  operadorIds?: number[];
  precioMin?: number;
  precioMax?: number;
  duracionMax?: number; // horas
  horaSalidaMax?: string; // "08:00"
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
  if (f.horaSalidaMax) conds.push(lte(tours.horaSalida, f.horaSalidaMax));
  if (f.aptoNinos) conds.push(eq(tours.aptoNinos, true));
  if (f.incluye?.length) {
    for (const item of f.incluye) {
      conds.push(sql`${tours.incluye} @> ${JSON.stringify([item])}::jsonb`);
    }
  }

  const db = getDb();
  return db
    .select({ tour: tours, operador: operadores })
    .from(tours)
    .innerJoin(operadores, eq(tours.operadorId, operadores.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(tours.precioAdulto));
}

export async function findTourById(id: number) {
  const db = getDb();
  const rows = await db
    .select({ tour: tours, operador: operadores })
    .from(tours)
    .innerJoin(operadores, eq(tours.operadorId, operadores.id))
    .where(eq(tours.id, id))
    .limit(1);
  return rows[0] ?? null;
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
  contacto: string;
  comision?: number | null;
}

/**
 * Inserta operadores en lote con upsert por nombre exacto:
 * si el nombre ya existe, actualiza contacto/comisión en vez de duplicar.
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
        .set({ contacto: n.contacto, comision })
        .where(eq(operadores.id, existente.id));
      actualizados++;
    } else {
      await db.insert(operadores).values({ nombre, contacto: n.contacto, comision });
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

export async function replaceToursDeOperador(
  operadorId: number,
  nuevos: Array<
    Omit<typeof tours.$inferInsert, "operadorId" | "fuente" | "fechaActualizacion">
  >,
  fuente: string,
  fechaActualizacion: string
) {
  const db = getDb();
  await db.delete(tours).where(eq(tours.operadorId, operadorId));
  if (nuevos.length) {
    await db.insert(tours).values(
      nuevos.map((t) => ({ ...t, operadorId, fuente, fechaActualizacion }))
    );
  }
  return { insertados: nuevos.length };
}

export interface OperadorCatalogoInput {
  nombre: string;
  contacto: string;
  comision?: number | null;
  tours: Array<
    Omit<typeof tours.$inferInsert, "operadorId" | "fuente" | "fechaActualizacion">
  >;
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
    if (existentes.length) {
      operadorId = existentes[0].id;
      await db
        .update(operadores)
        .set({ contacto: op.contacto, comision: op.comision ?? null })
        .where(eq(operadores.id, operadorId));
      operadoresActualizados++;
    } else {
      const [res] = await db
        .insert(operadores)
        .values({ nombre, contacto: op.contacto, comision: op.comision ?? null })
        .returning({ id: operadores.id });
      operadorId = res.id;
      operadoresCreados++;
    }

    await db.delete(tours).where(eq(tours.operadorId, operadorId));
    if (op.tours.length) {
      await db.insert(tours).values(
        op.tours.map((t) => ({
          ...t,
          operadorId,
          fuente: catalogo.fuente,
          fechaActualizacion: catalogo.fechaActualizacion,
        }))
      );
      toursInsertados += op.tours.length;
    }
  }

  return { operadoresCreados, operadoresActualizados, toursInsertados };
}
