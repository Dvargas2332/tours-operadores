import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { usuarios } from "@db/schema";

/** Busca un usuario por nombre exacto. */
export async function findUsuario(usuario: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.usuario, usuario))
    .limit(1);
  return rows[0] ?? null;
}
