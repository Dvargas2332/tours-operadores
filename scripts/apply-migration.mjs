#!/usr/bin/env node
/**
 * Aplica un archivo SQL directamente contra DATABASE_URL.
 * Útil cuando drizzle-kit push/migrate requiere TTY interactivo.
 *
 * Uso:
 *   node scripts/apply-migration.mjs db/migrations/0008_tour_horarios.sql
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/apply-migration.mjs <ruta.sql>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const sql = readFileSync(file, 'utf8');
const client = postgres(databaseUrl, { max: 1 });

try {
  await client.unsafe(sql);
  console.log(`Migración aplicada: ${file}`);
} catch (err) {
  console.error('Error aplicando migración:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
