/**
 * Utilidades para guardar archivos subidos localmente.
 * Por ahora los logos de operadores se almacenan en public/uploads/operadores/
 * para que Vite (dev) y el serveStatic de producción los sirvan como estáticos.
 */
import fs from "node:fs";
import path from "node:path";

const UPLOAD_SUBDIR = "uploads/operadores";

/** Ruta absoluta donde se guardan los uploads (siempre public/ para que sobrevivan rebuilds). */
export function getUploadDir(): string {
  return path.resolve(process.cwd(), "public", UPLOAD_SUBDIR);
}

/** URL pública relativa a la raíz del sitio. */
export function getUploadUrl(fileName: string): string {
  return `/uploads/operadores/${fileName}`;
}

const POLIZA_SUBDIR = "uploads/operadores/polizas";

export function getPolizaDir(): string {
  return path.resolve(process.cwd(), "public", POLIZA_SUBDIR);
}

export function getPolizaUrl(fileName: string): string {
  return `/uploads/operadores/polizas/${fileName}`;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DOC_EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export interface GuardarImagenResult {
  logoUrl: string;
  fileName: string;
  filePath: string;
}

/**
 * Guarda un archivo de imagen subido y devuelve la URL pública.
 * @throws Error con mensaje descriptivo si la validación falla.
 */
export async function guardarImagen(
  file: File,
  opts: { maxBytes?: number; prefix?: string } = {}
): Promise<GuardarImagenResult> {
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;
  const prefix = opts.prefix ?? "op";

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Solo se permiten imágenes (JPEG, PNG, WebP, GIF, SVG).");
  }
  if (file.size > maxBytes) {
    throw new Error(`La imagen no debe superar los ${maxBytes / 1024 / 1024} MB.`);
  }

  const ext = (EXT_BY_TYPE[file.type] ?? path.extname(file.name).slice(1)) || "bin";
  const safeName = file.name
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const base = safeName ? safeName.replace(/\.[^.]+$/, "") : "logo";
  const unique = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${base}-${unique}.${ext}`;

  const uploadDir = getUploadDir();
  fs.mkdirSync(uploadDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  return {
    logoUrl: getUploadUrl(fileName),
    fileName,
    filePath,
  };
}

export interface GuardarDocumentoResult {
  url: string;
  fileName: string;
  filePath: string;
}

/**
 * Guarda un documento PDF o imagen (póliza de seguro) y devuelve la URL pública.
 * @throws Error con mensaje descriptivo si la validación falla.
 */
export async function guardarDocumento(
  file: File,
  opts: { maxBytes?: number; prefix?: string } = {}
): Promise<GuardarDocumentoResult> {
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024;
  const prefix = opts.prefix ?? "poliza";

  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    throw new Error("Solo se permiten PDF o imágenes (JPEG, PNG, WebP, GIF).");
  }
  if (file.size > maxBytes) {
    throw new Error(`El archivo no debe superar los ${maxBytes / 1024 / 1024} MB.`);
  }

  const ext = (DOC_EXT_BY_TYPE[file.type] ?? path.extname(file.name).slice(1)) || "bin";
  const safeName = file.name
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const base = safeName ? safeName.replace(/\.[^.]+$/, "") : "poliza";
  const unique = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${base}-${unique}.${ext}`;

  const uploadDir = getPolizaDir();
  fs.mkdirSync(uploadDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  return {
    url: getPolizaUrl(fileName),
    fileName,
    filePath,
  };
}
