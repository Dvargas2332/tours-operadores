import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";

export const trpc = createTRPCReact<AppRouter>();

function esNoAutorizado(error: unknown): boolean {
  const e = error as { data?: { code?: string; httpStatus?: number } } | null;
  return e?.data?.code === "UNAUTHORIZED" || e?.data?.httpStatus === 401;
}

/** Si una query/mutación devuelve 401 (sesión expirada), redirige a /login. */
function redirigirSiNoAutorizado(error: unknown) {
  if (esNoAutorizado(error) && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: redirigirSiNoAutorizado }),
  mutationCache: new MutationCache({ onError: redirigirSiNoAutorizado }),
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
