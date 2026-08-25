import { relations } from "drizzle-orm";
import { operadores, tours } from "./schema";

export const operadoresRelations = relations(operadores, ({ many }) => ({
  tours: many(tours),
}));

export const toursRelations = relations(tours, ({ one }) => ({
  operador: one(operadores, {
    fields: [tours.operadorId],
    references: [operadores.id],
  }),
}));
