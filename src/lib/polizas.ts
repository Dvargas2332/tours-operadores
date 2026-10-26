/**
 * Acceso a las pólizas de seguro, que viven en un bucket privado.
 * Se firma una URL temporal (10 min) al abrir el documento.
 */
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const MARCA = '/polizas/';

/** Extrae la ruta del objeto desde una URL pública/firmada o una ruta directa. */
export function rutaPoliza(valor: string): string {
  const limpio = valor.split('?')[0].split('#')[0];
  const i = limpio.indexOf(MARCA);
  const ruta = i >= 0 ? limpio.slice(i + MARCA.length) : limpio.replace(/^\/+/, '');
  try {
    return decodeURIComponent(ruta);
  } catch {
    return ruta;
  }
}

/** Devuelve una URL firmada para la póliza, o la misma si ya es local/externa. */
export async function firmarPoliza(valor: string, segundos = 600): Promise<string | null> {
  if (/^(blob:|data:)/.test(valor)) return valor;
  // URL externa que no pertenece al bucket de pólizas: se abre tal cual.
  if (/^https?:\/\//.test(valor) && !valor.includes(MARCA)) return valor;

  const ruta = rutaPoliza(valor);
  if (!ruta) return null;

  const { data, error } = await supabase.storage.from('polizas').createSignedUrl(ruta, segundos);
  if (error) return null;
  return data.signedUrl;
}

/** Abre la póliza en una pestaña nueva, firmando la URL si hace falta. */
export async function abrirPoliza(valor: string | null | undefined): Promise<void> {
  if (!valor) return;
  const url = await firmarPoliza(valor);
  if (!url) {
    toast.error('No se pudo abrir la póliza');
    return;
  }
  window.open(url, '_blank', 'noopener');
}
