import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedQuery, publicQuery } from "./middleware";
import { firmarSesion, leerSesion, limpiarCookieSesion, setCookieSesion } from "./lib/auth";
import { verifyPassword } from "./lib/password";
import { findUsuario } from "./queries/usuarios";

export const authRouter = createRouter({
  /** Estado actual de la sesión (público: nunca lanza 401). */
  session: publicQuery.query(({ ctx }) => {
    const sesion = leerSesion(ctx.req);
    return { autenticado: sesion != null, usuario: sesion?.usuario ?? null };
  }),

  login: publicQuery
    .input(z.object({ usuario: z.string().min(1), contrasena: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const user = await findUsuario(input.usuario);
      if (!user || !verifyPassword(input.contrasena, user.passwordHash)) {
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
