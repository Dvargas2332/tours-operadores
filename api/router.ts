import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./auth";
import { toursRouter } from "./tours";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  tours: toursRouter,
});

export type AppRouter = typeof appRouter;
