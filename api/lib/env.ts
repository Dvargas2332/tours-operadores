import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  // Clave para firmar la cookie de sesión. En producción APP_SECRET es
  // obligatorio (required lanza); en desarrollo usamos un valor fijo.
  sessionSecret: required("APP_SECRET") || "tourhub-dev-secret-cambiar-en-prod",
};
