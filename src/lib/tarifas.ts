import type { Tarifa, Tour } from '@/data/mock-tours';
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
