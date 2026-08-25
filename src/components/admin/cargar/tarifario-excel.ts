/**
 * Parser del catálogo de operadores (CATALOGO TOURS.xlsx).
 *
 * Una hoja por operador. Encabezados irregulares (español/inglés), varias
 * secciones por hoja, tours multi-fila y tablas laterales (restaurante/SPA).
 * Estrategia best-effort: extrae todo lo que tenga nombre + precio y deja
 * categoría/zona por defecto para corregir en la revisión.
 */
import * as XLSX from 'xlsx';
import type { Moneda } from '@/data/mock-tours';
import type { FilaRevision } from './tipos';
import { nuevaKey } from './tipos';

export interface OperadorCatalogo {
  nombre: string;
  contacto: string;
  comision: number | null;
  moneda: Moneda;
  tours: FilaRevision[];
}

export interface ResultadoCatalogo {
  operadores: OperadorCatalogo[];
  error?: string;
}

function normalizar(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Colapsa saltos de línea y espacios para nombres en una sola línea. */
function limpiarTexto(raw: string): string {
  return raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function limpiarNumero(raw: string): string {
  const s = raw.replace(/[$₡,\s]/g, '');
  const m = s.match(/\d+(?:\.\d+)?/);
  return m ? m[0] : '';
}

function primeraHora(raw: string): string {
  const s = raw.trim();
  let m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  m = s.match(/\b(\d{3,4})\b/);
  if (m) {
    const d = m[1].padStart(4, '0');
    return `${d.slice(0, 2)}:${d.slice(2)}`;
  }
  return '08:00';
}

function extraerDuracion(texto: string): string {
  const m = texto.match(/dur[aá]ci[oó]n\s*:?\s*(\d+(?:[.,]\d+)?)/i);
  return m ? m[1].replace(',', '.') : '';
}

const ALIASES_INCLUYE: Record<string, string> = {
  transporte: 'transporte',
  transport: 'transporte',
  shuttle: 'transporte',
  guia: 'guia',
  guide: 'guia',
  almuerzo: 'almuerzo',
  comida: 'almuerzo',
  cena: 'almuerzo',
  lunch: 'almuerzo',
  alimentacion: 'almuerzo',
  entradas: 'entradas',
  entrada: 'entradas',
  parque: 'entradas',
  ticket: 'entradas',
  tickets: 'entradas',
  equipo: 'equipo',
  equipment: 'equipo',
  equipamiento: 'equipo',
  seguro: 'seguro',
  insurance: 'seguro',
};

function parsearIncluye(raw: string): string[] {
  const out: string[] = [];
  for (const token of raw.split(/[;,|\n/]+/)) {
    const t = normalizar(token);
    if (!t) continue;
    const clave = ALIASES_INCLUYE[t];
    if (clave && !out.includes(clave)) out.push(clave);
  }
  return out;
}

type Campo =
  | 'nombre'
  | 'rackAdulto'
  | 'netaAdulto'
  | 'rackNino'
  | 'netaNino'
  | 'horario'
  | 'incluye'
  | 'detalles'
  | 'comision';

function campoDe(h: string): Campo | null {
  const n = normalizar(h);
  if (!n) return null;

  // Ignorar rangos de edad que el modelo no maneja (+65, 11-18)
  if (n.includes('65') || n.includes('11-18') || n.includes('11 18')) return null;

  if (n === 'tour' || n === 'detalle' || n === 'actividad' || n === 'zonas') return 'nombre';

  const esRack = n.includes('rack');
  const esNeta = n.includes('net');
  const esNino = n.includes('nin') || n.includes('nino');
  if (esRack && esNino) return 'rackNino';
  if (esRack) return 'rackAdulto';
  if (esNeta && esNino) return 'netaNino';
  if (esNeta) return 'netaAdulto';

  if (n === 'pick up' || n === 'manana' || n === 'diurno' || n === 'horarios' || n === 'horario' || n === 'hora') return 'horario';
  if (n === 'incluye' || n.includes('incluye')) return 'incluye';
  if (n === 'detalles' || n === 'recomendaciones' || n.includes('recomendacion') || n.includes('restriccion')) return 'detalles';
  if (n === 'comision' || n.includes('comision')) return 'comision';
  return null;
}

const NOMBRES_HEADER = ['TOUR', 'DETALLE', 'ACTIVIDAD', 'ZONAS'];

function esFilaHeader(celdas: string[]): boolean {
  const tieneNombre = celdas.some((c) => NOMBRES_HEADER.includes(c.toUpperCase()));
  const tienePrecio = celdas.some((c) => {
    const n = normalizar(c);
    return n.includes('rack') || n.includes('net');
  });
  return tieneNombre && tienePrecio;
}

interface MapaColumnas {
  nombre: number | null;
  rackAdulto: number | null;
  netaAdulto: number | null;
  rackNino: number | null;
  netaNino: number | null;
  horario: number | null;
  incluye: number | null;
  detalles: number | null;
  comision: number | null;
}

function construirMapa(celdas: string[]): MapaColumnas {
  const mapa: MapaColumnas = {
    nombre: null,
    rackAdulto: null,
    netaAdulto: null,
    rackNino: null,
    netaNino: null,
    horario: null,
    incluye: null,
    detalles: null,
    comision: null,
  };
  celdas.forEach((c, ci) => {
    const campo = campoDe(c);
    if (!campo) return;
    if (campo === 'nombre' && mapa.nombre == null) mapa.nombre = ci;
    else if (campo === 'rackAdulto' && mapa.rackAdulto == null) mapa.rackAdulto = ci;
    else if (campo === 'netaAdulto' && mapa.netaAdulto == null) mapa.netaAdulto = ci;
    else if (campo === 'rackNino' && mapa.rackNino == null) mapa.rackNino = ci;
    else if (campo === 'netaNino' && mapa.netaNino == null) mapa.netaNino = ci;
    else if (campo === 'horario' && mapa.horario == null) mapa.horario = ci;
    else if (campo === 'incluye' && mapa.incluye == null) mapa.incluye = ci;
    else if (campo === 'detalles' && mapa.detalles == null) mapa.detalles = ci;
    else if (campo === 'comision' && mapa.comision == null) mapa.comision = ci;
  });
  return mapa;
}

function nuevaFila(
  operador: string,
  moneda: Moneda,
  nombre: string,
  extras: Partial<FilaRevision> = {},
): FilaRevision {
  return {
    key: nuevaKey(),
    operador,
    moneda,
    nombre,
    zona: 'Arenal',
    categoria: 'aventura',
    precioAdulto: '',
    precioNino: '',
    precioNetoAdulto: '',
    precioNetoNino: '',
    duracionHoras: '1',
    horaSalida: '08:00',
    incluye: [],
    noIncluye: [],
    minimoPersonas: '2',
    aptoNinos: true,
    politicaCancelacion: '',
    observaciones: '',
    excluida: false,
    advertencias: [],
    ...extras,
  };
}

/** Parsea una hoja (un operador). Devuelve null si no tiene productos con precio. */
function parsearHoja(hojaNombre: string, rows: string[][]): OperadorCatalogo | null {
  const nombre = hojaNombre.trim();
  if (!nombre) return null;

  // Moneda: si hay algún ₡, toda la hoja es colones
  let moneda: Moneda = 'usd';
  for (const row of rows) {
    if (row.some((c) => c.includes('₡'))) {
      moneda = 'crc';
      break;
    }
  }

  let mapa: MapaColumnas = construirMapa([]);
  let actual: FilaRevision | null = null;
  const tours: FilaRevision[] = [];
  const comisiones: number[] = [];

  // Tabla lateral (LOS LAGOS): columnas con su propio "#" + "DETALLE" + precios
  let lado: { num: number; nombre: number; rack: number; neta: number } | null = null;

  for (const row of rows) {
    const celdas = row.map((c) => c.trim());

    // Detectar tabla lateral (# / DETALLE / RACK / NETA en columnas >= 7)
    const ladoHeader = celdas.some((c, ci) => ci >= 7 && c.toUpperCase() === 'DETALLE') &&
      celdas.some((c, ci) => ci >= 7 && (normalizar(c).includes('rack') || normalizar(c).includes('net')));
    if (ladoHeader) {
      const num = celdas.findIndex((c) => c === '#');
      const nombreCol = celdas.findIndex((c, ci) => ci >= 7 && c.toUpperCase() === 'DETALLE');
      let rack = -1;
      let neta = -1;
      celdas.forEach((c, ci) => {
        if (ci < 7) return;
        const n = normalizar(c);
        if (n.includes('rack') && rack === -1) rack = ci;
        if (n.includes('net') && neta === -1) neta = ci;
      });
      if (nombreCol >= 7 && (rack >= 7 || neta >= 7)) {
        lado = { num: num >= 0 ? num : 7, nombre: nombreCol, rack, neta };
      }
    }

    if (esFilaHeader(celdas)) {
      mapa = construirMapa(celdas);
      actual = null;
      continue;
    }

    if (celdas.every((c) => c === '')) continue;

    // Comisión (columna COMISIÓN con "%")
    if (mapa.comision != null && celdas[mapa.comision]) {
      const m = celdas[mapa.comision].match(/(\d+(?:\.\d+)?)\s*%/);
      if (m) comisiones.push(Number(m[1]));
    }

    const primerNumero = /^\d+$/.test(celdas[0]);

    if (primerNumero && mapa.nombre != null && celdas[mapa.nombre]) {
      const detalle = mapa.detalles != null ? celdas[mapa.detalles] : '';
      const rackAdulto = mapa.rackAdulto != null ? limpiarNumero(celdas[mapa.rackAdulto]) : '';
      const netaAdulto = mapa.netaAdulto != null ? limpiarNumero(celdas[mapa.netaAdulto]) : '';
      const rackNino = mapa.rackNino != null ? limpiarNumero(celdas[mapa.rackNino]) : '';
      const netaNino = mapa.netaNino != null ? limpiarNumero(celdas[mapa.netaNino]) : '';
      const horario = mapa.horario != null ? celdas[mapa.horario] : '';
      const duracion = extraerDuracion(detalle);

      const advertencias: string[] = [];
      if (rackNino === '' ) advertencias.push('Sin precio de niño');
      if (netaAdulto === '' && rackAdulto !== '') advertencias.push('Sin tarifa neta');
      if (moneda === 'crc') advertencias.push('Precio en colones');

      actual = nuevaFila(nombre, moneda, limpiarTexto(celdas[mapa.nombre]), {
        precioAdulto: rackAdulto,
        precioNino: rackNino,
        precioNetoAdulto: netaAdulto,
        precioNetoNino: netaNino,
        duracionHoras: duracion || '1',
        horaSalida: horario ? primeraHora(horario) : '08:00',
        incluye: mapa.incluye != null ? parsearIncluye(celdas[mapa.incluye]) : [],
        observaciones: detalle,
        advertencias,
      });
      tours.push(actual);
    } else if (actual) {
      // Continuación: horarios o detalles extra de la misma fila
      if (mapa.horario != null && celdas[mapa.horario]) {
        const extra = `Horario adicional: ${celdas[mapa.horario]}`;
        actual.observaciones = actual.observaciones ? `${actual.observaciones}\n${extra}` : extra;
      }
      if (mapa.detalles != null && celdas[mapa.detalles]) {
        const d = celdas[mapa.detalles];
        if (actual.observaciones && !actual.observaciones.includes(d)) {
          actual.observaciones = `${actual.observaciones}\n${d}`;
        } else if (!actual.observaciones) {
          actual.observaciones = d;
        }
      }
      if (mapa.rackAdulto != null && !actual.precioAdulto) {
        const r = limpiarNumero(celdas[mapa.rackAdulto]);
        if (r) actual.precioAdulto = r;
      }
      if (mapa.netaAdulto != null && !actual.precioNetoAdulto) {
        const n = limpiarNumero(celdas[mapa.netaAdulto]);
        if (n) actual.precioNetoAdulto = n;
      }
    }

    // Tabla lateral: extraer productos con precio
    if (lado && /^\d+$/.test(celdas[lado.num] ?? '') && celdas[lado.nombre]) {
      const rack = lado.rack >= 0 ? limpiarNumero(celdas[lado.rack]) : '';
      const neta = lado.neta >= 0 ? limpiarNumero(celdas[lado.neta]) : '';
      if (rack || neta) {
        tours.push(
          nuevaFila(nombre, moneda, limpiarTexto(celdas[lado.nombre]), {
            precioAdulto: rack,
            precioNetoAdulto: neta,
            advertencias: moneda === 'crc' ? ['Precio en colones'] : [],
          }),
        );
      }
    }
  }

  const conPrecio = tours.filter((t) => t.precioAdulto !== '' || t.precioNetoAdulto !== '');
  if (conPrecio.length === 0) return null;

  return {
    nombre,
    contacto: '',
    comision: comisiones.length ? comisiones[0] : null,
    moneda,
    tours: conPrecio,
  };
}

export function parsearCatalogo(data: ArrayBuffer | string): ResultadoCatalogo {
  const wb = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array' });
  const operadores: OperadorCatalogo[] = [];

  for (const hoja of wb.SheetNames) {
    const ws = wb.Sheets[hoja];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1, raw: false }) as string[][];
    if (rows.length === 0) continue;
    const op = parsearHoja(hoja, rows);
    if (op) operadores.push(op);
  }

  if (operadores.length === 0) {
    return { operadores: [], error: 'No encontramos operadores con precios en el archivo.' };
  }
  return { operadores };
}
