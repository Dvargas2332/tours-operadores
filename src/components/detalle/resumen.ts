/**
 * Generadores de texto plano para copiar al portapapeles (tour-detalle.md §7,
 * comparador.md §6). Texto limpio para el huésped: sin comisión ni fuente.
 */
import { formatPrecio } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { INCLUYE_META, formatDuracion } from '@/lib/tour-meta';

/** "guía" → "Guía"; claves de INCLUYE_META usan su label oficial */
export function labelIncluye(key: string): string {
  const meta = INCLUYE_META[key];
  if (meta) return meta.label;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Lista corta de "incluye" para textos copiados: "transporte, guía, equipo" */
function incluyeCorto(tour: Tour): string {
  return tour.incluye.map((k) => (INCLUYE_META[k] ? INCLUYE_META[k].label.toLowerCase() : k)).join(', ');
}

function preciosLinea(tour: Tour): string {
  return tour.precio_nino != null
    ? `${formatPrecio(tour.precio_adulto, tour.moneda)} adulto · ${formatPrecio(tour.precio_nino, tour.moneda)} niño`
    : `${formatPrecio(tour.precio_adulto, tour.moneda)} adulto · niño no aplica`;
}

/** Resumen de un tour para el huésped (tour-detalle.md §7) */
export function buildResumenTour(tour: Tour): string {
  const lineas = [
    `${tour.nombre} — ${tour.operador.nombre}`,
    preciosLinea(tour),
    `Duración: ${formatDuracion(tour.duracion_horas)} · Salida: ${tour.hora_salida}`,
  ];
  if (tour.incluye.length > 0) lineas.push(`Incluye: ${incluyeCorto(tour)}`);
  lineas.push(`Mínimo ${tour.minimo_personas} personas · ${tour.apto_ninos ? 'Apto para niños' : 'Solo adultos'}`);
  if (tour.politica_cancelacion) lineas.push(`Cancelación: ${tour.politica_cancelacion}`);
  return lineas.join('\n');
}

/** Comparación de 2–3 tours para WhatsApp/email (comparador.md §6) */
export function buildResumenComparacion(tours: Tour[]): string {
  const bloques = tours.map((tour, i) =>
    [
      `${i + 1}) ${tour.nombre} — ${tour.operador.nombre}`,
      `   ${preciosLinea(tour)}`,
      `   Duración: ${formatDuracion(tour.duracion_horas)} · Salida: ${tour.hora_salida} · Zona: ${tour.zona}`,
      tour.incluye.length > 0 ? `   Incluye: ${incluyeCorto(tour)}` : null,
      tour.politica_cancelacion ? `   Cancelación: ${tour.politica_cancelacion}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  return [`Comparación de tours (precios en USD):`, ...bloques].join('\n\n');
}

/** Copia al portapapeles con fallback para contextos sin navigator.clipboard */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Extrae un teléfono internacional del campo contacto ("+506 2479-9800 · email"). */
export function telefonoDeContacto(contacto: string): string | null {
  const digitos = (contacto.split('·')[0] ?? contacto).replace(/\D/g, '');
  if (!digitos) return null;
  // Costa Rica: si no trae código de país (506), lo anteponemos.
  return digitos.length >= 11 ? digitos : `506${digitos}`;
}

/** URL de WhatsApp con mensaje prellenado. */
export function urlWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
