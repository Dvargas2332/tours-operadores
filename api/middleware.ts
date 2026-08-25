import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { leerSesion } from "./lib/auth";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requiereSesion = t.middleware(({ ctx, next }) => {
  if (!leerSesion(ctx.req)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión requerida" });
  }
  return next();
});

/** Procedimiento protegido: exige una cookie de sesión válida. */
export const protectedQuery = t.procedure.use(requiereSesion);
