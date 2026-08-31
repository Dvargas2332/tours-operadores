import { relations } from "drizzle-orm";
import { operadores, tourHorarios, tourTarifas, tours } from "./schema";

export const operadoresRelations = relations(operadores, ({ many }) => ({
  tours: many(tours),
}));

export const toursRelations = relations(tours, ({ one, many }) => ({
  operador: one(operadores, {
    fields: [tours.operadorId],
    references: [operadores.id],
  }),
  horarios: many(tourHorarios),
  tarifas: many(tourTarifas),
}));

export const tourTarifasRelations = relations(tourTarifas, ({ one }) => ({
  tour: one(tours, {
    fields: [tourTarifas.tourId],
    references: [tours.id],
  }),
}));
