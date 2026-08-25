/**
 * Capa de acceso a datos de Tours Operadores La Fortuna (design.md §8).
 *
 * Todas las páginas consumen los fetchers async de este archivo
 * (fetchTours, fetchOperadores, fetchTourById). La implementación habla
 * con el backend real vía cliente tRPC vanilla; si el backend no responde
 * (p. ej. sin base de datos conectada), devuelve listas vacías para que la
 * UI muestre estados "sin datos" en lugar de datos falsos.
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../api/router';
import type { Operador as DbOperador, Tour as DbTour } from '../../db/schema';

export type Categoria = 'aventura' | 'naturaleza' | 'acuatico' | 'cultural' | 'termas';

export type Moneda = 'usd' | 'crc';

export interface Operador {
  id: number;
  nombre: string;
  contacto: string;
  comision: number | null; // % — visible solo en admin (uso interno)
}

export interface Tour {
  id: number;
  operador: Operador;
  nombre: string;
  zona: string;
  categoria: Categoria;
  precio_adulto: number; // USD — tarifa RACK (público al huésped)
  precio_nino: number | null; // rack niño
  precio_neto_adulto: number; // USD — tarifa NETA (costo operador, uso interno)
  precio_neto_nino: number | null;
  duracion_horas: number;
  hora_salida: string; // "07:30"
  incluye: string[]; // transporte, guia, almuerzo, entradas, equipo, seguro
  no_incluye: string[];
  minimo_personas: number;
  apto_ninos: boolean;
  politica_cancelacion: string;
  observaciones: string;
  fuente: string; // "tarifario-sunset-2026.pdf"
  fecha_actualizacion: string; // ISO date
  moneda: Moneda; // usd | crc
}

/* ------------------------------------------------------------------ */
/* Helpers de fecha/formato                                            */
/* ------------------------------------------------------------------ */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "12 jul 2026" — día + mes abreviado + año (design.md §3) */
export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
}

/** "$85" / "$85.50" / "₡17,500" según moneda. */
export function formatPrecio(n: number, moneda: Moneda = 'usd'): string {
  if (moneda === 'crc') return `₡${Math.round(n).toLocaleString('en-US')}`;
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Alias USD para filtros y textos que asumen dólares. */
export function formatUSD(n: number): string {
  return formatPrecio(n, 'usd');
}

export type Frescura = 'ok' | 'warn' | 'danger';

export interface InfoFrescura {
  estado: Frescura;
  dias: number;
  label: string; // "Actualizado" | "Revisar" | "Desactualizado"
  relativo: string; // "hace 12 días"
}

/** Semáforo de frescura del tarifario (design.md §8) */
export function freshness(fechaISO: string): InfoFrescura {
  const ms = Date.now() - new Date(fechaISO + 'T12:00:00').getTime();
  const dias = Math.max(0, Math.floor(ms / 86_400_000));
  const estado: Frescura = dias < 90 ? 'ok' : dias <= 180 ? 'warn' : 'danger';
  const label = estado === 'ok' ? 'Actualizado' : estado === 'warn' ? 'Revisar' : 'Desactualizado';
  const relativo = dias === 0 ? 'hoy' : dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
  return { estado, dias, label, relativo };
}

/* ------------------------------------------------------------------ */
/* Cliente tRPC vanilla (mismo patrón que src/providers/trpc.tsx)      */
/* ------------------------------------------------------------------ */

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: 'include',
        });
      },
    }),
  ],
});

/* ------------------------------------------------------------------ */
/* Mapeo backend (Drizzle, camelCase) → frontend (design.md §8, snake) */
/* ------------------------------------------------------------------ */

type RowTour = { tour: DbTour; operador: DbOperador };

function mapOperador(o: DbOperador): Operador {
  return {
    id: o.id,
    nombre: o.nombre,
    contacto: o.contacto,
    comision: o.comision == null ? null : Number(o.comision),
  };
}

/** Normaliza a "YYYY-MM-DD" (Drizzle date mode:"string" ya viene así) */
function toISODate(fecha: string | Date): string {
  return fecha instanceof Date ? fecha.toISOString().slice(0, 10) : fecha.slice(0, 10);
}

function mapTour({ tour: t, operador }: RowTour): Tour {
  return {
    id: t.id,
    operador: mapOperador(operador),
    nombre: t.nombre,
    zona: t.zona,
    categoria: t.categoria,
    precio_adulto: Number(t.precioAdulto), // tarifa rack (público)
    precio_nino: t.precioNino == null ? null : Number(t.precioNino), // rack niño
    precio_neto_adulto: Number(t.precioNetoAdulto), // tarifa neta (uso interno)
    precio_neto_nino: t.precioNetoNino == null ? null : Number(t.precioNetoNino),
    duracion_horas: Number(t.duracionHoras),
    hora_salida: t.horaSalida,
    incluye: t.incluye,
    no_incluye: t.noIncluye,
    minimo_personas: t.minimoPersonas,
    apto_ninos: t.aptoNinos,
    politica_cancelacion: t.politicaCancelacion,
    observaciones: t.observaciones,
    fuente: t.fuente,
    fecha_actualizacion: toISODate(t.fechaActualizacion),
    moneda: t.moneda ?? 'usd',
  };
}

/* ------------------------------------------------------------------ */
/* Fetchers async — punto único de acceso a datos.                     */
/* Backend real vía tRPC; sin backend devuelve listas vacías.          */
/* ------------------------------------------------------------------ */

/** Distingue un 401 (sesión requerida) de una caída del backend. */
function esNoAutorizado(err: unknown): boolean {
  const e = err as { data?: { code?: string; httpStatus?: number } } | null;
  return e?.data?.code === 'UNAUTHORIZED' || e?.data?.httpStatus === 401;
}

export async function fetchTours(): Promise<Tour[]> {
  try {
    const rows = await trpcClient.tours.buscar.query();
    return rows.map(mapTour);
  } catch (err) {
    if (esNoAutorizado(err)) throw err; // sin sesión no caemos a vacío
    console.warn('[data] fetchTours: backend no disponible', err);
    return [];
  }
}

export async function fetchOperadores(): Promise<Operador[]> {
  try {
    const rows = await trpcClient.tours.operadores.query();
    return rows.map((r) => mapOperador(r.operador));
  } catch (err) {
    if (esNoAutorizado(err)) throw err;
    console.warn('[data] fetchOperadores: backend no disponible', err);
    return [];
  }
}

export async function fetchTourById(id: number): Promise<Tour | undefined> {
  try {
    const row = await trpcClient.tours.detalle.query({ id });
    return row ? mapTour(row) : undefined;
  } catch (err) {
    if (esNoAutorizado(err)) throw err;
    console.warn('[data] fetchTourById: backend no disponible', err);
    return undefined;
  }
}
