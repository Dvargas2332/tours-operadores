/**
 * Generadores de texto plano para copiar al portapapeles (tour-detalle.md §7,
 * comparador.md §6). Texto limpio para el huésped: sin comisión ni fuente.
 */
import { formatPrecio, horarioRepresentativo } from '@/data/mock-tours';
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

function labelRango(t: { min_edad: number; max_edad: number | null }): string {
  return t.max_edad != null ? `${t.min_edad}-${t.max_edad}` : `+${t.min_edad}`;
}

function preciosLinea(tour: Tour): string {
  if (tour.tarifas.length === 0) {
    return `${formatPrecio(tour.precio_adulto, tour.moneda)} adulto · niño no aplica`;
  }
  const rangos = tour.tarifas
    .sort((a, b) => a.min_edad - b.min_edad)
    .map((t) => `${formatPrecio(t.rack, tour.moneda)} ${labelRango(t)}`);
  return rangos.join(' · ');
}

/** Resumen de un tour para el huésped (tour-detalle.md §7) */
export function buildResumenTour(tour: Tour): string {
  const horario = horarioRepresentativo(tour);
  const salidas = tour.horarios.map((h) => h.hora_salida).join(', ');
  const llegadas = tour.horarios.map((h) => h.hora_llegada).join(', ');
  const horarioTexto = tour.horarios.length > 1
    ? `Salidas: ${salidas} · Llegadas: ${llegadas}`
    : `Salida: ${horario?.hora_salida ?? '—'} · Llegada: ${horario?.hora_llegada ?? '—'}`;
  const lineas = [
    `${tour.nombre} — ${tour.operador.nombre}`,
    preciosLinea(tour),
    `Duración: ${formatDuracion(tour.duracion_horas)} · ${horarioTexto}`,
  ];
  if (tour.incluye.length > 0) lineas.push(`Incluye: ${incluyeCorto(tour)}`);
  lineas.push(`Mínimo ${tour.minimo_personas} personas · ${tour.apto_ninos ? 'Apto para niños' : 'Solo adultos'}`);
  if (tour.politica_cancelacion) lineas.push(`Cancelación: ${tour.politica_cancelacion}`);
  return lineas.join('\n');
}

/** Comparación de 2–3 tours para WhatsApp/email (comparador.md §6) */
export function buildResumenComparacion(tours: Tour[]): string {
  const monedas = [...new Set(tours.map((t) => (t.moneda === 'crc' ? 'CRC' : 'USD')))];
  const bloques = tours.map((tour, i) => {
    const horario = horarioRepresentativo(tour);
    const horarioTexto = tour.horarios.length > 1
      ? `Salidas: ${tour.horarios.map((h) => h.hora_salida).join(', ')}`
      : `Salida: ${horario?.hora_salida ?? '—'}`;
    return [
      `${i + 1}) ${tour.nombre} — ${tour.operador.nombre}`,
      `   ${preciosLinea(tour)}`,
      `   Duración: ${formatDuracion(tour.duracion_horas)} · ${horarioTexto} · Zona: ${tour.zona}`,
      tour.incluye.length > 0 ? `   Incluye: ${incluyeCorto(tour)}` : null,
      tour.politica_cancelacion ? `   Cancelación: ${tour.politica_cancelacion}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  });
  return [`Comparación de tours (precios en ${monedas.join('/')}):`, ...bloques].join('\n\n');
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

/** Normaliza un teléfono para WhatsApp. Si no trae código de país (506), lo anteponemos. */
export function telefonoDeContacto(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, '');
  if (!digitos) return null;
  // Costa Rica: si no trae código de país (506), lo anteponemos.
  return digitos.length >= 11 ? digitos : `506${digitos}`;
}

/** URL de WhatsApp con mensaje prellenado. */
export function urlWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
