import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

export const categoriaEnum = pgEnum("categoria", [
  "aventura",
  "naturaleza",
  "acuatico",
  "cultural",
  "termas",
]);

export const monedaEnum = pgEnum("moneda", ["usd", "crc"]);

export const operadores = pgTable("operadores", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  contacto: varchar("contacto", { length: 255 }).notNull().default(""),
  comision: numeric("comision", { precision: 5, scale: 2, mode: "number" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  operadorId: integer("operador_id")
    .notNull()
    .references(() => operadores.id),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  zona: varchar("zona", { length: 120 }).notNull(),
  categoria: categoriaEnum("categoria").notNull(),
  // Tarifa neta = costo del operador para el hotel (uso interno).
  // precio_adulto / precio_nino = tarifa RACK (precio público al huésped).
  precioAdulto: numeric("precio_adulto", { precision: 7, scale: 2, mode: "number" }).notNull(),
  precioNino: numeric("precio_nino", { precision: 7, scale: 2, mode: "number" }),
  precioNetoAdulto: numeric("precio_neto_adulto", { precision: 7, scale: 2, mode: "number" }).notNull(),
  precioNetoNino: numeric("precio_neto_nino", { precision: 7, scale: 2, mode: "number" }),
  duracionHoras: numeric("duracion_horas", { precision: 4, scale: 1, mode: "number" }).notNull(),
  horaSalida: varchar("hora_salida", { length: 5 }).notNull(), // "07:30"
  incluye: jsonb("incluye").$type<string[]>().notNull(),
  noIncluye: jsonb("no_incluye").$type<string[]>().notNull(),
  minimoPersonas: integer("minimo_personas").notNull().default(2),
  aptoNinos: boolean("apto_ninos").notNull().default(true),
  politicaCancelacion: text("politica_cancelacion").notNull(),
  observaciones: text("observaciones").notNull(),
  fuente: varchar("fuente", { length: 255 }).notNull().default(""),
  fechaActualizacion: date("fecha_actualizacion", { mode: "string" }).notNull(),
  moneda: monedaEnum("moneda").notNull().default("usd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Operador = typeof operadores.$inferSelect;
export type Tour = typeof tours.$inferSelect;
