/**
 * Regla de tarifas por nacionalidad: los clientes costarricenses ven las
 * tarifas con referencia nacional ("nacional", "nacionales", "nacio", "nac…");
 * los demás países NO las ven. Aplica solo a la presentación de precios.
 */
export const TARIFA_NACIONAL_RE = /nac/i;

export function tarifasSegunNacionalidad<T extends { nombre?: string | null }>(
  tarifas: T[],
  esCostaRica: boolean,
): T[] {
  if (esCostaRica) return tarifas;
  return tarifas.filter((t) => !TARIFA_NACIONAL_RE.test(t.nombre ?? ''));
}
