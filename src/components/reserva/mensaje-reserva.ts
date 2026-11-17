import { formatPrecio, formatDateEs, horarioLabel } from '@/data/mock-tours';
import type { Tour, Tarifa, Horario } from '@/data/mock-tours';
import { INCLUYE_META } from '@/lib/tour-meta';
import { precioUnitarioTarifa } from '@/lib/tarifas';

export interface LineaReserva {
  edad: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface DatosReserva {
  tour: Tour;
  fecha: Date;
  horario?: Horario;
  lineas: LineaReserva[];
  total: number;
  nombreCliente?: string;
  hotel?: string;
  notas?: string;
  metodosPago?: string[];
}

export type ConteoTarifas = Record<number, number>;

export function labelTarifa(t: Tarifa): string {
  if (t.nombre.trim()) return t.nombre.trim();
  if (t.max_edad == null) return `${t.min_edad}+ años`;
  return `${t.min_edad}-${t.max_edad} años`;
}

/**
 * Calcula el desglose por tarifa a partir de un conteo por id de tarifa.
 * Con `usarNeta` toma la tarifa neta del operador (vista vendedor); si esa
 * tarifa no tiene neta, cae al precio rack.
 */
export function calcularLineasPorTarifas(
  tour: Tour,
  conteos: ConteoTarifas,
  usarNeta = false,
  fechaISO?: string | null,
): LineaReserva[] {
  const out: LineaReserva[] = [];
  for (const t of tour.tarifas) {
    const cantidad = conteos[t.id] ?? 0;
    if (cantidad <= 0) continue;
    const precioUnitario = precioUnitarioTarifa(tour, t, usarNeta, fechaISO);
    out.push({
      edad: labelTarifa(t),
      cantidad,
      precioUnitario,
      total: cantidad * precioUnitario,
    });
  }
  return out;
}

export function calcularTotal(lineas: LineaReserva[]): number {
  return lineas.reduce((sum, l) => sum + l.total, 0);
}

function saludoPorHora(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Hola, buenos días';
  if (h >= 12 && h < 19) return 'Hola, buenas tardes';
  return 'Hola, muy buenas noches';
}

export function buildMensajeReserva(d: DatosReserva): string {
  const horarioLinea = d.horario
    ? `Horarios de tours: ${horarioLabel(d.horario)}`
    : `Horarios de tours: ${d.tour.operador.horario || 'consultar en recepción'}`;

  const lineas = [
    `${saludoPorHora()}. Me gustaría formalizar la siguiente reservación:`,
    ``,
    `*${d.tour.nombre}*`,
    `Fecha: ${formatDateEs(d.fecha.toISOString().slice(0, 10))}`,
    horarioLinea,
    ``,
    `*Personas:*`,
  ];

  for (const l of d.lineas) {
    lineas.push(`${l.edad}: ${l.cantidad} × ${formatPrecio(l.precioUnitario, d.tour.moneda)} = ${formatPrecio(l.total, d.tour.moneda)}`);
  }

  if (d.nombreCliente) lineas.push(``, `Nombre: ${d.nombreCliente}`);
  if (d.hotel) lineas.push(`Hotel: ${d.hotel}`);
  if (d.notas) lineas.push(`Notas: ${d.notas}`);
  if (d.metodosPago && d.metodosPago.length > 0) {
    lineas.push(`Método de pago: ${d.metodosPago.join(', ')}`);
  }

  lineas.push(
    ``,
    `*Total: ${formatPrecio(d.total, d.tour.moneda)}*`,
  );

  return lineas.join('\n');
}

export interface DatosMensajeCliente {
  tour: Tour;
  fecha?: Date;
  horario?: Horario;
  lineas: LineaReserva[];
  total: number;
  nombreCliente?: string;
}

/** Resumen para el huésped con precios rack; nunca incluye neta ni operador. */
export function buildMensajeCliente(d: DatosMensajeCliente): string {
  const saludo = d.nombreCliente ? `Hola ${d.nombreCliente}` : 'Hola';
  const lineas = [
    `${saludo}, te comparto la información del tour:`,
    ``,
    `*${d.tour.nombre}*`,
  ];

  if (d.fecha) {
    lineas.push(`Fecha: ${formatDateEs(d.fecha.toISOString().slice(0, 10))}`);
  }
  const horario = d.horario ? horarioLabel(d.horario) : d.tour.operador.horario;
  if (horario) lineas.push(`Horario: ${horario}`);

  lineas.push(``, `*Personas:*`);
  for (const l of d.lineas) {
    lineas.push(
      `${l.edad}: ${l.cantidad} × ${formatPrecio(l.precioUnitario, d.tour.moneda)} = ${formatPrecio(l.total, d.tour.moneda)}`,
    );
  }

  lineas.push(``, `*Total: ${formatPrecio(d.total, d.tour.moneda)}*`);

  if (d.tour.incluye.length > 0) {
    const incluye = d.tour.incluye
      .map((k) => INCLUYE_META[k]?.label ?? k)
      .join(', ');
    lineas.push(``, `Incluye: ${incluye}`);
  }

  return lineas.join('\n');
}
