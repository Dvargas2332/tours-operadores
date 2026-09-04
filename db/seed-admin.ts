/**
 * Crea el usuario administrador inicial en la tabla `usuarios`.
 * Uso: npx tsx db/seed-admin.ts
 * Credenciales por defecto: admin / tourhub (cámbialas en cuanto puedas).
 */
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { hashPassword } from "../api/lib/password";
import { usuarios } from "./schema";

async function seedAdmin() {
  const db = getDb();
  const usuario = "admin";
  const contrasena = "tourhub";

  const existente = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.usuario, usuario))
    .limit(1);

  if (existente.length) {
    console.log(`El usuario "${usuario}" ya existe.`);
  } else {
    await db.insert(usuarios).values({ usuario, passwordHash: hashPassword(contrasena) });
    console.log(`Usuario "${usuario}" creado con contraseña "${contrasena}".`);
  }
  process.exit(0);
}

seedAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
