import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convierte una URL de póliza a la ruta de preview inline (o pasa blob/data). */
export function polizaPreviewUrl(url: string): string {
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `/api/poliza-preview/${url.split('/').pop()}`;
}
