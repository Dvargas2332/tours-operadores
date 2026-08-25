import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedQuery, publicQuery } from "./middleware";
import { env } from "./lib/env";
import {
  firmarSesion,
  leerSesion,
  limpiarCookieSesion,
  setCookieSesion,
} from "./lib/auth";

export const authRouter = createRouter({
  /** Estado actual de la sesión (público: nunca lanza 401). */
  session: publicQuery.query(({ ctx }) => {
    const sesion = leerSesion(ctx.req);
    return { autenticado: sesion != null, usuario: sesion?.usuario ?? null };
  }),

  login: publicQuery
    .input(z.object({ usuario: z.string().min(1), contrasena: z.string().min(1) }))
    .mutation(({ input, ctx }) => {
      if (input.usuario !== env.adminUser || input.contrasena !== env.adminPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales inválidas" });
      }
      setCookieSesion(ctx.resHeaders, firmarSesion(input.usuario));
      return { usuario: input.usuario };
    }),

  logout: protectedQuery.mutation(({ ctx }) => {
    limpiarCookieSesion(ctx.resHeaders);
    return { ok: true as const };
  }),
});
