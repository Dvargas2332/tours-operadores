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
  telefono: varchar("telefono", { length: 50 }).notNull().default(""),
  email: varchar("email", { length: 255 }),
  comision: numeric("comision", { precision: 5, scale: 2, mode: "number" }),
  logoUrl: varchar("logo_url", { length: 500 }),
  polizaUrl: varchar("poliza_url", { length: 500 }),
  politicaCancelacion: text("politica_cancelacion").notNull().default(""),
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
  precioAdulto: numeric("precio_adulto", { precision: 10, scale: 2, mode: "number" }).notNull(),
  precioNino: numeric("precio_nino", { precision: 10, scale: 2, mode: "number" }),
  precioNetoAdulto: numeric("precio_neto_adulto", { precision: 10, scale: 2, mode: "number" }),
  precioNetoNino: numeric("precio_neto_nino", { precision: 10, scale: 2, mode: "number" }),
  duracionHoras: numeric("duracion_horas", { precision: 4, scale: 1, mode: "number" }).notNull(),
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

export const tourHorarios = pgTable("tour_horarios", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  horaSalida: varchar("hora_salida", { length: 5 }).notNull(), // "07:30"
  horaLlegada: varchar("hora_llegada", { length: 5 }).notNull(), // "12:30"
  orden: integer("orden").notNull().default(0),
});

export const tourTarifas = pgTable("tour_tarifas", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 120 }).notNull().default(""),
  minEdad: integer("min_edad").notNull(),
  maxEdad: integer("max_edad"),
  rack: numeric("rack", { precision: 10, scale: 2, mode: "number" }).notNull(),
  neta: numeric("neta", { precision: 10, scale: 2, mode: "number" }),
  horaDesde: varchar("hora_desde", { length: 5 }), // HH:MM inicio del rango (legacy)
  horaHasta: varchar("hora_hasta", { length: 5 }), // HH:MM fin del rango (legacy)
  orden: integer("orden").notNull().default(0),
});

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  usuario: varchar("usuario", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Operador = typeof operadores.$inferSelect;
export type Tour = typeof tours.$inferSelect;
export type TourHorario = typeof tourHorarios.$inferSelect;
export type TourTarifa = typeof tourTarifas.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
