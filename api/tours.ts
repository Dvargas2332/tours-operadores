import { z } from "zod";
import { createRouter, protectedQuery } from "./middleware";
import {
  deleteOperadorConTours,
  findFacetas,
  findOperadores,
  findStats,
  findTourById,
  findTours,
  importarCatalogo,
  insertOperadores,
  replaceToursDeOperador,
} from "./queries/tours";

const categoriaEnum = z.enum([
  "aventura",
  "naturaleza",
  "acuatico",
  "cultural",
  "termas",
]);

const filtrosInput = z.object({
  q: z.string().optional(),
  zonas: z.array(z.string()).optional(),
  categorias: z.array(categoriaEnum).optional(),
  operadorIds: z.array(z.number()).optional(),
  precioMin: z.number().optional(),
  precioMax: z.number().optional(),
  duracionMax: z.number().optional(),
  horaSalidaMax: z.string().optional(),
  incluye: z.array(z.string()).optional(),
  aptoNinos: z.boolean().optional(),
});

const tourCargaInput = z.object({
  nombre: z.string().min(1),
  zona: z.string().min(1),
  categoria: categoriaEnum,
  moneda: z.enum(["usd", "crc"]).default("usd"),
  precioAdulto: z.number().positive(), // tarifa rack (público)
  precioNino: z.number().positive().nullable().optional(), // rack niño
  precioNetoAdulto: z.number().positive(), // tarifa neta (uso interno)
  precioNetoNino: z.number().positive().nullable().optional(),
  duracionHoras: z.number().positive(),
  horaSalida: z.string().regex(/^\d{2}:\d{2}$/),
  incluye: z.array(z.string()),
  noIncluye: z.array(z.string()),
  minimoPersonas: z.number().int().min(1).default(2),
  aptoNinos: z.boolean().default(true),
  politicaCancelacion: z.string().default(""),
  observaciones: z.string().default(""),
});

export const toursRouter = createRouter({
  buscar: protectedQuery
    .input(filtrosInput.optional())
    .query(({ input }) => findTours(input ?? {})),

  detalle: protectedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findTourById(input.id)),

  operadores: protectedQuery.query(() => findOperadores()),

  stats: protectedQuery.query(() => findStats()),

  facetas: protectedQuery.query(() => findFacetas()),

  crearOperadores: protectedQuery
    .input(
      z.object({
        operadores: z
          .array(
            z.object({
              nombre: z.string().min(1),
              contacto: z.string().default(""),
              comision: z.number().min(0).max(100).nullable().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(({ input }) => insertOperadores(input.operadores)),

  eliminarOperador: protectedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteOperadorConTours(input.id)),

  cargarTarifario: protectedQuery
    .input(
      z.object({
        operadorId: z.number(),
        fuente: z.string().min(1),
        fechaActualizacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        tours: z.array(tourCargaInput),
      })
    )
    .mutation(({ input }) =>
      replaceToursDeOperador(
        input.operadorId,
        input.tours.map((t) => ({
          ...t,
          precioNino: t.precioNino ?? null,
          precioNetoNino: t.precioNetoNino ?? null,
        })),
        input.fuente,
        input.fechaActualizacion
      )
    ),

  importarCatalogo: protectedQuery
    .input(
      z.object({
        fuente: z.string().min(1),
        fechaActualizacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        operadores: z
          .array(
            z.object({
              nombre: z.string().min(1),
              contacto: z.string().default(""),
              comision: z.number().min(0).max(100).nullable().optional(),
              tours: z.array(tourCargaInput),
            })
          )
          .min(1),
      })
    )
    .mutation(({ input }) => importarCatalogo(input)),
});
