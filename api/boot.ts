import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { serveStatic } from "@hono/node-server/serve-static";
import type { HttpBindings } from "@hono/node-server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { leerSesion } from "./lib/auth";
import { guardarImagen, guardarDocumento } from "./lib/upload";

const app = new Hono<{ Bindings: HttpBindings }>();

app.post("/api/upload/operador-logo", async (c) => {
  const sesion = leerSesion(c.req.raw);
  if (!sesion) {
    return c.json({ error: "Sesión requerida" }, 401);
  }

  try {
    const body = await c.req.parseBody();
    const logo = body.logo;
    if (!(logo instanceof File)) {
      return c.json({ error: "No se recibió ninguna imagen." }, 400);
    }
    const { logoUrl } = await guardarImagen(logo);
    return c.json({ logoUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar la imagen";
    return c.json({ error: message }, 400);
  }
});

app.post("/api/upload/operador-poliza", async (c) => {
  const sesion = leerSesion(c.req.raw);
  if (!sesion) {
    return c.json({ error: "Sesión requerida" }, 401);
  }

  try {
    const body = await c.req.parseBody();
    const poliza = body.poliza;
    if (!(poliza instanceof File)) {
      return c.json({ error: "No se recibió ningún archivo." }, 400);
    }
    const { url } = await guardarDocumento(poliza);
    return c.json({ polizaUrl: url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar la póliza";
    return c.json({ error: message }, 400);
  }
});

// Vista previa de la póliza (PDF/imagen servido inline para el navegador)
app.get("/api/poliza-preview/:name", async (c) => {
  const sesion = leerSesion(c.req.raw);
  if (!sesion) {
    return c.json({ error: "Sesión requerida" }, 401);
  }
  const name = c.req.param("name");
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return c.json({ error: "Nombre inválido" }, 400);
  }
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", "operadores", "polizas", name);
    const data = await readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    const contentType =
      ext === ".pdf" ? "application/pdf"
      : ext === ".png" ? "image/png"
      : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
      : ext === ".webp" ? "image/webp"
      : ext === ".gif" ? "image/gif"
      : "application/octet-stream";
    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return c.json({ error: "Archivo no encontrado" }, 404);
  }
});

app.use("/api/trpc/*", bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");

  // Sirve los uploads primero; el catch-all de dist/public queda después.
  app.use("/uploads/*", serveStatic({ root: "./public" }));
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
