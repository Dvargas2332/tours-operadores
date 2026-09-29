/**
 * Generadores de texto plano para copiar al portapapeles (tour-detalle.md §7,
 * comparador.md §6). Texto limpio para el huésped: sin comisión ni fuente.
 *
 * Las funciones aceptan un `t` opcional (useI18n) como último parámetro;
 * sin él devuelven los textos en español original (comportamiento previo).
 */
import { formatPrecio, horariosLabel, horarioTieneLlegada } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { INCLUYE_META } from '@/lib/tour-meta';
import { tarifasSegunNacionalidad } from '@/i18n/tarifas';

type TFn = (clave: string, vars?: Record<string, string | number>) => string;

/** "guía" → "Guía"; claves de INCLUYE_META usan su label oficial */
export function labelIncluye(key: string, t?: TFn): string {
  if (t) return t(`buscador.incluye_${key}`);
  const meta = INCLUYE_META[key];
  if (meta) return meta.label;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Lista corta de "incluye" para textos copiados: "transporte, guía, equipo" */
function incluyeCorto(tour: Tour, t?: TFn): string {
  return tour.incluye
    .map((k) => {
      if (t) return t(`buscador.incluye_${k}`).toLowerCase();
      return INCLUYE_META[k] ? INCLUYE_META[k].label.toLowerCase() : k;
    })
    .join(', ');
}

function labelRango(t: { min_edad: number; max_edad: number | null }): string {
  return t.max_edad != null ? `${t.min_edad}-${t.max_edad}` : `+${t.min_edad}`;
}

/** Lista legible de horarios, localizada: "Inicia 08:00 · 13:00 - 17:00" */
function horariosTexto(tour: Tour, t?: TFn): string {
  if (!t) return horariosLabel(tour);
  return tour.horarios
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((h) =>
      horarioTieneLlegada(h)
        ? `${h.hora_salida} - ${h.hora_llegada}`
        : t('fecha.horario_inicia', { hora: h.hora_salida }),
    )
    .join(' · ');
}

function preciosLinea(tour: Tour, esCostaRica = true, t?: TFn): string {
  const visibles = tarifasSegunNacionalidad(tour.tarifas, esCostaRica);
  if (visibles.length === 0) {
    const precio = formatPrecio(tour.precio_adulto, tour.moneda);
    return t ? `${precio} ${t('detalle.resumen_nino_no_aplica')}` : `${precio} adulto · niño no aplica`;
  }
  const rangos = visibles
    .slice()
    .sort((a, b) => a.min_edad - b.min_edad)
    .map((tar) => `${formatPrecio(tar.rack, tour.moneda)} ${labelRango(tar)}`);
  return rangos.join(' · ');
}

/** Resumen de un tour para el huésped (tour-detalle.md §7) */
export function buildResumenTour(tour: Tour, esCostaRica = true, t?: TFn, mostrarOperador = true): string {
  const horarioValor = tour.horarios.length > 0 ? horariosTexto(tour, t) : tour.operador.horario || '—';
  const horarioTexto = t ? t('detalle.resumen_horarios', { h: horarioValor }) : `Horarios de tours: ${horarioValor}`;
  const lineas = [
    mostrarOperador ? `${tour.nombre} — ${tour.operador.nombre}` : tour.nombre,
    preciosLinea(tour, esCostaRica, t),
    horarioTexto,
  ];
  if (tour.incluye.length > 0) {
    lineas.push(t ? t('detalle.resumen_incluye', { items: incluyeCorto(tour, t) }) : `Incluye: ${incluyeCorto(tour)}`);
  }
  const apto = tour.apto_ninos ? (t ? t('detalle.apto_ninos') : 'Apto para niños') : t ? t('detalle.solo_adultos') : 'Solo adultos';
  lineas.push(
    t
      ? t('detalle.resumen_minimo', { n: tour.minimo_personas, apto })
      : `Mínimo ${tour.minimo_personas} personas · ${apto}`,
  );
  if (tour.politica_cancelacion) {
    lineas.push(
      t ? t('detalle.resumen_cancelacion', { politica: tour.politica_cancelacion }) : `Cancelación: ${tour.politica_cancelacion}`,
    );
  }
  return lineas.join('\n');
}

/** Comparación de 2–3 tours para WhatsApp/email (comparador.md §6) */
export function buildResumenComparacion(tours: Tour[], esCostaRica = true, t?: TFn, mostrarOperador = true): string {
  const monedas = [...new Set(tours.map((tour) => (tour.moneda === 'crc' ? 'CRC' : 'USD')))];
  const bloques = tours.map((tour, i) => {
    const horarioValor = tour.horarios.length > 0 ? horariosTexto(tour, t) : tour.operador.horario || '—';
    const horarioTexto = t ? t('detalle.resumen_horarios', { h: horarioValor }) : `Horarios de tours: ${horarioValor}`;
    const zonaTexto = t ? t('detalle.resumen_zona', { zona: tour.zona }) : `Zona: ${tour.zona}`;
    return [
      `${i + 1}) ${mostrarOperador ? `${tour.nombre} — ${tour.operador.nombre}` : tour.nombre}`,
      `   ${preciosLinea(tour, esCostaRica, t)}`,
      `   ${horarioTexto} · ${zonaTexto}`,
      tour.incluye.length > 0
        ? `   ${t ? t('detalle.resumen_incluye', { items: incluyeCorto(tour, t) }) : `Incluye: ${incluyeCorto(tour)}`}`
        : null,
      tour.politica_cancelacion
        ? `   ${t ? t('detalle.resumen_cancelacion', { politica: tour.politica_cancelacion }) : `Cancelación: ${tour.politica_cancelacion}`}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');
  });
  const cabecera = t
    ? t('detalle.resumen_comparacion', { monedas: monedas.join('/') })
    : `Comparación de tours (precios en ${monedas.join('/')}):`;
  return [cabecera, ...bloques].join('\n\n');
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
