/**
 * Sesión por cookie JWT (HS256) sin dependencias externas.
 * Firma y verificación con `node:crypto`; el secreto sale de env.sessionSecret
 * (APP_SECRET en producción).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

const COOKIE_NAME = "tourhub_session";
const TTL_SECONDS = 8 * 60 * 60; // 8 h

export interface Sesion {
  usuario: string;
  exp: number;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

/** Crea un JWT HS256 de sesión con expiración. */
export function firmarSesion(usuario: string): string {
  const payload: Sesion = {
    usuario,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const header = { alg: "HS256", typ: "JWT" };
  const datos = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const firma = createHmac("sha256", env.sessionSecret).update(datos).digest("base64url");
  return `${datos}.${firma}`;
}

/** Verifica firma y expiración; devuelve la sesión o null si es inválida. */
export function verificarSesion(token: string): Sesion | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [cabecera, cuerpo, firma] = partes;
  const datos = `${cabecera}.${cuerpo}`;
  const esperada = createHmac("sha256", env.sessionSecret).update(datos).digest("base64url");

  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(cuerpo)) as Sesion;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const parte of header.split(";")) {
    const idx = parte.indexOf("=");
    if (idx === -1) continue;
    const k = parte.slice(0, idx).trim();
    const v = parte.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

/** Lee y verifica la cookie de sesión de una Request. */
export function leerSesion(req: Request): Sesion | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  const token = parseCookies(cookie)[COOKIE_NAME];
  if (!token) return null;
  return verificarSesion(token);
}

export function setCookieSesion(resHeaders: Headers, token: string): void {
  resHeaders.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${TTL_SECONDS}`,
  );
}

export function limpiarCookieSesion(resHeaders: Headers): void {
  resHeaders.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  );
}
