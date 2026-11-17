import type { Tarifa, Temporada, Tour } from '@/data/mock-tours';
import { tarifasSegunNacionalidad } from '@/i18n/tarifas';

export const RANGOS_TARIFA = {
  adulto: { label: 'Adulto (12-64)', min_edad: 12, max_edad: 64 as number | null },
  nino: { label: 'Niño (0-11)', min_edad: 0, max_edad: 11 as number | null },
  adultoMayor: { label: 'Adulto mayor (65+)', min_edad: 65, max_edad: null as number | null },
} as const;

export type TipoTarifa = keyof typeof RANGOS_TARIFA;

/**
 * Tarifas del tour visibles según la nacionalidad del cliente: los no
 * costarricenses no ven tarifas con referencia nacional. El default (true)
 * mantiene el comportamiento interno/admin sin cambios.
 */
export function tarifasActivas(tour: Tour, esCostaRica = true): Tarifa[] {
  return tarifasSegunNacionalidad(tour.tarifas, esCostaRica);
}

/** Precio rack más bajo aplicable para el tour (fallback a precio_adulto). */
export function precioActivoDesde(tour: Tour, esCostaRica = true): number {
  const activas = tarifasActivas(tour, esCostaRica);
  if (activas.length === 0) return tour.precio_adulto;
  return Math.min(...activas.map((t) => t.rack));
}

/* ------------------------------------------------------------------ */
/* IVA (13%) — switch por operador                                     */
/* ------------------------------------------------------------------ */

export const TASA_IVA = 0.13;

/**
 * Aplica el IVA del operador a un precio (rack o neta): si lo tiene
 * habilitado, le suma el 13%. Si no, lo deja igual (nunca lo resta).
 */
export function precioConIva(tour: Tour, precio: number): number {
  if (!tour.operador.con_iva) return precio;
  return Math.round(precio * (1 + TASA_IVA) * 100) / 100;
}

/** Precio público final (tarifa rack) con IVA si el operador lo tiene. */
export function precioPublico(tour: Tour, precio: number): number {
  return precioConIva(tour, precio);
}

/**
 * Precio unitario de una tarifa: para el vendedor usa la neta del operador
 * (con IVA si aplica); para el cliente, el rack público. Si hay una
 * temporada que cubre la fecha, esa temporada sobrescribe el precio.
 */
export function precioUnitarioTarifa(
  tour: Tour,
  tarifa: Tarifa,
  usarNeta = false,
  fechaISO?: string | null,
): number {
  const temporada = temporadaAplicable(tour, fechaISO);
  const precioTemporada = temporada?.tarifas.find((pt) => pt.tarifa_id === tarifa.id);
  const rack = precioTemporada?.rack ?? tarifa.rack;
  const neta = precioTemporada?.neta ?? tarifa.neta;
  const netaConIva = neta != null ? precioConIva(tour, neta) : null;
  return usarNeta && netaConIva != null ? netaConIva : precioPublico(tour, rack);
}

/** Temporada de mayor prioridad que cubre la fecha indicada. */
export function temporadaAplicable(tour: Tour, fechaISO?: string | null): Temporada | null {
  if (!fechaISO) return null;
  return (
    tour.temporadas
      .filter((t) => fechaISO >= t.fecha_desde && fechaISO <= t.fecha_hasta)
      .sort((a, b) => b.prioridad - a.prioridad || b.id - a.id)[0] ?? null
  );
}

/** Precio rack para un rango de edad aplicable. */
export function tarifaActivaPorEdad(tour: Tour, edad: number, esCostaRica = true): Tarifa | undefined {
  const activas = tarifasActivas(tour, esCostaRica);
  return activas.find((t) => edad >= t.min_edad && (t.max_edad == null || edad <= t.max_edad));
}

/** Tarifa representativa para un tipo de pasajero predefinido. */
export function tarifaPorTipo(tour: Tour, tipo: TipoTarifa, esCostaRica = true): Tarifa | undefined {
  const rango = RANGOS_TARIFA[tipo];
  const edadRepresentativa = rango.max_edad != null
    ? Math.floor((rango.min_edad + rango.max_edad) / 2)
    : rango.min_edad;
  return tarifaActivaPorEdad(tour, edadRepresentativa, esCostaRica);
}
