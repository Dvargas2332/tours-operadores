import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Devuelve la URL de la póliza tal cual (Storage, blob o data). */
export function polizaPreviewUrl(url: string): string {
  return url;
}
