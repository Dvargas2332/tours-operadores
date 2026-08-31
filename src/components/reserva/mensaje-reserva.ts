import { formatPrecio, formatDateEs } from '@/data/mock-tours';
import type { Tour, Tarifa, Horario } from '@/data/mock-tours';
import { formatDuracion } from '@/lib/tour-meta';

export interface LineaReserva {
  edad: string;
  cantidad: number;
  rack: number;
  neta: number | null;
  totalRack: number;
}

export interface DatosReserva {
  tour: Tour;
  fecha: Date;
  horario: Horario;
  lineas: LineaReserva[];
  total: number;
  nombreCliente?: string;
  hotel?: string;
  notas?: string;
}

export type ConteoTarifas = Record<number, number>;

export function labelTarifa(t: Tarifa): string {
  if (t.nombre.trim()) return t.nombre.trim();
  if (t.max_edad == null) return `${t.min_edad}+ años`;
  return `${t.min_edad}-${t.max_edad} años`;
}

/** Calcula el desglose por tarifa a partir de un conteo por id de tarifa. */
export function calcularLineasPorTarifas(tour: Tour, conteos: ConteoTarifas): LineaReserva[] {
  const out: LineaReserva[] = [];
  for (const t of tour.tarifas) {
    const cantidad = conteos[t.id] ?? 0;
    if (cantidad <= 0) continue;
    out.push({
      edad: labelTarifa(t),
      cantidad,
      rack: t.rack,
      neta: t.neta,
      totalRack: cantidad * t.rack,
    });
  }
  return out;
}

export function calcularTotal(lineas: LineaReserva[]): number {
  return lineas.reduce((sum, l) => sum + l.totalRack, 0);
}

export function buildMensajeReserva(d: DatosReserva): string {
  const lineas = [
    `Hola, quiero reservar el siguiente tour:`,
    ``,
    `*${d.tour.nombre}*`,
    `Fecha: ${formatDateEs(d.fecha.toISOString().slice(0, 10))}`,
    `Duración: ${formatDuracion(d.tour.duracion_horas)} · Salida: ${d.horario.hora_salida} · Llegada: ${d.horario.hora_llegada}`,
    ``,
    `*Personas:*`,
  ];

  for (const l of d.lineas) {
    lineas.push(`${l.edad}: ${l.cantidad} × ${formatPrecio(l.rack, d.tour.moneda)} = ${formatPrecio(l.totalRack, d.tour.moneda)}`);
  }

  if (d.nombreCliente) lineas.push(``, `Nombre: ${d.nombreCliente}`);
  if (d.hotel) lineas.push(`Hotel: ${d.hotel}`);
  if (d.notas) lineas.push(`Notas: ${d.notas}`);

  lineas.push(
    ``,
    `*Total: ${formatPrecio(d.total, d.tour.moneda)}*`,
  );

  return lineas.join('\n');
}
