import { z } from "zod";
import { createRouter, protectedQuery } from "./middleware";
import {
  deleteOperadorConTours,
  deleteTour,
  findFacetas,
  findOperadores,
  findStats,
  findTourById,
  findTours,
  importarCatalogo,
  insertOperadores,
  insertTour,
  replaceToursDeOperador,
  updateOperador,
  updateTour,
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
  incluye: z.array(z.string()).optional(),
  aptoNinos: z.boolean().optional(),
});

const tarifaInput = z.object({
  nombre: z.string().max(120).default(""),
  minEdad: z.number().int().min(0),
  maxEdad: z.number().int().min(0).nullable().optional(),
  rack: z.number().positive(),
  neta: z.number().positive().nullable().optional(),
  horaDesde: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  horaHasta: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  orden: z.number().int().min(0).default(0),
});

const horarioInput = z.object({
  horaSalida: z.string().regex(/^\d{2}:\d{2}$/),
  horaLlegada: z.string().regex(/^\d{2}:\d{2}$/),
  orden: z.number().int().min(0).default(0),
});

const tourCargaInput = z.object({
  nombre: z.string().min(1),
  zona: z.string().min(1),
  categoria: categoriaEnum,
  moneda: z.enum(["usd", "crc"]).default("usd"),
  precioAdulto: z.number().positive(), // tarifa base representativa (rango adulto 12-64)
  precioNino: z.number().positive().nullable().optional(), // legacy, se migra a tarifas
  precioNetoAdulto: z.number().positive().nullable().optional(), // legacy
  precioNetoNino: z.number().positive().nullable().optional(), // legacy
  tarifas: z.array(tarifaInput).default([]),
  horarios: z.array(horarioInput).default([]),
  duracionHoras: z.number().positive(),
  incluye: z.array(z.string()),
  noIncluye: z.array(z.string()),
  minimoPersonas: z.number().int().min(1).default(2),
  aptoNinos: z.boolean().default(true),
  politicaCancelacion: z.string().default(""),
  observaciones: z.string().default(""),
});

const tourActualizarInput = z.object({
  id: z.number(),
  operadorId: z.number().optional(),
  nombre: z.string().min(1).optional(),
  zona: z.string().min(1).optional(),
  categoria: categoriaEnum.optional(),
  moneda: z.enum(["usd", "crc"]).optional(),
  precioAdulto: z.number().positive().optional(),
  precioNino: z.number().positive().nullable().optional(),
  precioNetoAdulto: z.number().positive().nullable().optional(),
  precioNetoNino: z.number().positive().nullable().optional(),
  tarifas: z.array(tarifaInput).optional(),
  horarios: z.array(horarioInput).optional(),
  duracionHoras: z.number().positive().optional(),
  incluye: z.array(z.string()).optional(),
  noIncluye: z.array(z.string()).optional(),
  minimoPersonas: z.number().int().min(1).optional(),
  aptoNinos: z.boolean().optional(),
  politicaCancelacion: z.string().optional(),
  observaciones: z.string().optional(),
});

const operadorActualizarInput = z.object({
  id: z.number(),
  nombre: z.string().min(1).optional(),
  telefono: z.string().max(50).optional(),
  email: z.string().email().max(255).nullable().optional(),
  comision: z.number().min(0).max(100).nullable().optional(),
  logoUrl: z
    .string()
    .regex(/^(\/|https?:\/\/)/, "Debe ser una URL válida")
    .max(500)
    .nullable()
    .optional(),
  polizaUrl: z
    .string()
    .regex(/^(\/|https?:\/\/)/, "Debe ser una URL válida")
    .max(500)
    .nullable()
    .optional(),
  politicaCancelacion: z.string().max(5000).optional(),
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
              telefono: z.string().max(50).default(""),
              email: z.string().email().max(255).nullable().optional(),
              comision: z.number().min(0).max(100).nullable().optional(),
              logoUrl: z
    .string()
    .regex(/^(\/|https?:\/\/)/, "Debe ser una URL válida")
    .max(500)
    .nullable()
    .optional(),
              polizaUrl: z
    .string()
    .regex(/^(\/|https?:\/\/)/, "Debe ser una URL válida")
    .max(500)
    .nullable()
    .optional(),
              politicaCancelacion: z.string().max(5000).default(""),
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
          horarios: t.horarios.length ? t.horarios : [{ horaSalida: '08:00', horaLlegada: '12:00' }],
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
              telefono: z.string().max(50).default(""),
              email: z.string().email().max(255).nullable().optional(),
              comision: z.number().min(0).max(100).nullable().optional(),
              logoUrl: z
    .string()
    .regex(/^(\/|https?:\/\/)/, "Debe ser una URL válida")
    .max(500)
    .nullable()
    .optional(),
              polizaUrl: z
    .string()
    .regex(/^(\/|https?:\/\/)/, "Debe ser una URL válida")
    .max(500)
    .nullable()
    .optional(),
              politicaCancelacion: z.string().max(5000).default(""),
              tours: z.array(tourCargaInput),
            })
          )
          .min(1),
      })
    )
    .mutation(({ input }) => importarCatalogo(input)),

  crearTour: protectedQuery
    .input(
      tourCargaInput.extend({
        operadorId: z.number(),
        fuente: z.string().min(1).default("manual"),
        fechaActualizacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().slice(0, 10)),
      })
    )
    .mutation(({ input }) => {
      const { operadorId, fuente, fechaActualizacion, tarifas, horarios, ...resto } = input;
      return insertTour({
        operadorId,
        fuente,
        fechaActualizacion,
        ...resto,
        tarifas: tarifas.map((t, i) => ({ ...t, orden: t.orden ?? i })),
        horarios: horarios.length ? horarios.map((h, i) => ({ ...h, orden: h.orden ?? i })) : [{ horaSalida: '08:00', horaLlegada: '12:00', orden: 0 }],
      });
    }),

  actualizarTour: protectedQuery
    .input(tourActualizarInput)
    .mutation(({ input }) => updateTour(input.id, input)),

  eliminarTour: protectedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTour(input.id)),

  actualizarOperador: protectedQuery
    .input(operadorActualizarInput)
    .mutation(({ input }) => updateOperador(input.id, input)),
});
