import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

/** Variable opcional con valor por defecto para desarrollo. */
function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  adminUser: optional("ADMIN_USER", "admin"),
  adminPassword: optional("ADMIN_PASSWORD", "tourhub"),
  // Clave para firmar la cookie de sesión. En producción APP_SECRET es
  // obligatorio (required lanza arriba); en desarrollo usamos un valor fijo
  // para poder levantar la app sin configurar nada.
  sessionSecret: process.env.APP_SECRET || "tourhub-dev-secret-cambiar-en-prod",
};
