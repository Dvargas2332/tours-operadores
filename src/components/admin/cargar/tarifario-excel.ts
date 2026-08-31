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
import type { FilaRevision, TarifaRevision } from './tipos';
import { nuevaKey } from './tipos';

export interface OperadorCatalogo {
  nombre: string;
  telefono: string;
  email: string | null;
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
  toallas: 'toallas',
  towel: 'toallas',
  towels: 'toallas',
  hidratacion: 'hidratacion',
  hidratación: 'hidratacion',
  agua: 'hidratacion',
  water: 'hidratacion',
  bebidas: 'hidratacion',
  frutas: 'frutas',
  fruit: 'frutas',
  snacks: 'snacks',
  snack: 'snacks',
  botana: 'snacks',
  bocadillos: 'snacks',
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

interface TarifaColumna {
  minEdad: number;
  maxEdad: number | null;
  tipo: 'rack' | 'neta';
}

interface ColumnaDetectada {
  tipo: 'nombre' | 'tarifa' | 'horario' | 'horarioLlegada' | 'incluye' | 'detalles' | 'comision';
  tarifa?: TarifaColumna;
}

/** Extrae un rango de edad de un header de columna. Ej: "niños 6-11", "+65", "adulto mayor". */
function extraerRango(header: string): { minEdad: number; maxEdad: number | null } | null {
  const n = normalizar(header);

  // Rangos explícitos: 0-5, 6-11, 12-64, 11-18
  const rango = n.match(/(\d+)\s*[-a]\s*(\d+)/);
  if (rango) {
    const min = Number(rango[1]);
    const max = Number(rango[2]);
    if (min >= 0 && max >= min) return { minEdad: min, maxEdad: max };
  }

  // "+65", "65+", "mayor 65", "adulto mayor"
  const mayor = n.match(/(?:\+|mayor\s*|adulto\s*mayor\s*|tercera\s*edad\s*)(\d+)/);
  if (mayor) {
    const min = Number(mayor[1]);
    if (min > 0) return { minEdad: min, maxEdad: null };
  }

  // Palabras clave sin número
  if (n.includes('nino') || n.includes('nin') || n.includes('child') || n.includes('kid')) {
    return { minEdad: 0, maxEdad: 11 };
  }
  if (n.includes('adulto mayor') || n.includes('tercera edad') || n.includes('senior') || n.includes('jubilado')) {
    return { minEdad: 65, maxEdad: null };
  }
  if (n.includes('adulto') || n.includes('adult')) {
    return { minEdad: 12, maxEdad: 64 };
  }

  return null;
}

function campoDe(h: string): ColumnaDetectada | null {
  const n = normalizar(h);
  if (!n) return null;

  if (n === 'tour' || n === 'detalle' || n === 'actividad' || n === 'zonas') return { tipo: 'nombre' };

  const rango = extraerRango(h);
  if (rango) {
    const esRack = n.includes('rack') || n.includes('publico') || n.includes('público');
    const esNeta = n.includes('net') || n.includes('neta') || n.includes('operador') || n.includes('costo') || n.includes('mayorista');
    // Si no dice rack ni neta, asumimos rack por defecto (es lo más común en tarifarios)
    const tipo: 'rack' | 'neta' = esNeta && !esRack ? 'neta' : 'rack';
    return { tipo: 'tarifa', tarifa: { ...rango, tipo } };
  }

  // Headers genéricos de precio sin rango explícito
  const esRack = n.includes('rack') || n.includes('publico') || n.includes('público');
  const esNeta = n.includes('net') || n.includes('neta') || n.includes('operador') || n.includes('costo');
  if (esRack || esNeta) {
    return {
      tipo: 'tarifa',
      tarifa: { minEdad: 12, maxEdad: 64, tipo: esNeta && !esRack ? 'neta' : 'rack' },
    };
  }

  if (n === 'pick up' || n === 'manana' || n === 'diurno' || n === 'horarios' || n === 'horario' || n === 'hora') return { tipo: 'horario' };
  if (n === 'drop off' || n === 'regreso' || n === 'retorno' || n === 'llegada' || n === 'hora llegada' || n === 'horario llegada') return { tipo: 'horarioLlegada' };
  if (n === 'incluye' || n.includes('incluye')) return { tipo: 'incluye' };
  if (n === 'detalles' || n === 'recomendaciones' || n.includes('recomendacion') || n.includes('restriccion')) return { tipo: 'detalles' };
  if (n === 'comision' || n.includes('comision')) return { tipo: 'comision' };
  return null;
}

const NOMBRES_HEADER = ['TOUR', 'DETALLE', 'ACTIVIDAD', 'ZONAS'];

function esFilaHeader(celdas: string[]): boolean {
  const tieneNombre = celdas.some((c) => NOMBRES_HEADER.includes(c.toUpperCase()));
  const tienePrecio = celdas.some((c) => {
    const col = campoDe(c);
    return col?.tipo === 'tarifa';
  });
  return tieneNombre && tienePrecio;
}

interface MapaColumnas {
  nombre: number | null;
  tarifas: { col: number; tarifa: TarifaColumna }[];
  horario: number | null;
  horarioLlegada: number | null;
  incluye: number | null;
  detalles: number | null;
  comision: number | null;
}

function construirMapa(celdas: string[]): MapaColumnas {
  const mapa: MapaColumnas = {
    nombre: null,
    tarifas: [],
    horario: null,
    horarioLlegada: null,
    incluye: null,
    detalles: null,
    comision: null,
  };
  celdas.forEach((c, ci) => {
    const campo = campoDe(c);
    if (!campo) return;
    if (campo.tipo === 'nombre' && mapa.nombre == null) mapa.nombre = ci;
    else if (campo.tipo === 'tarifa' && campo.tarifa) mapa.tarifas.push({ col: ci, tarifa: campo.tarifa });
    else if (campo.tipo === 'horario' && mapa.horario == null) mapa.horario = ci;
    else if (campo.tipo === 'horarioLlegada' && mapa.horarioLlegada == null) mapa.horarioLlegada = ci;
    else if (campo.tipo === 'incluye' && mapa.incluye == null) mapa.incluye = ci;
    else if (campo.tipo === 'detalles' && mapa.detalles == null) mapa.detalles = ci;
    else if (campo.tipo === 'comision' && mapa.comision == null) mapa.comision = ci;
  });
  return mapa;
}

function tarifasPorFila(mapa: MapaColumnas, celdas: string[]): TarifaRevision[] {
  const porRango = new Map<string, Partial<TarifaRevision> & { minEdad: number; maxEdad: number | null }>();

  for (const { col, tarifa } of mapa.tarifas) {
    const valor = limpiarNumero(celdas[col] ?? '');
    if (!valor) continue;
    const key = `${tarifa.minEdad}-${tarifa.maxEdad ?? '+'}`;
    const entry = porRango.get(key);
    if (entry) {
      if (tarifa.tipo === 'rack') entry.rack = valor;
      else entry.neta = valor;
    } else {
      porRango.set(key, {
        minEdad: tarifa.minEdad,
        maxEdad: tarifa.maxEdad,
        rack: tarifa.tipo === 'rack' ? valor : '',
        neta: tarifa.tipo === 'neta' ? valor : '',
      });
    }
  }

  return [...porRango.values()]
    .filter((t) => t.rack || t.neta)
    .sort((a, b) => a.minEdad - b.minEdad)
    .map((t) => ({
      minEdad: t.minEdad,
      maxEdad: t.maxEdad,
      rack: t.rack ?? '',
      neta: t.neta ?? '',
    }));
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
    tarifas: [],
    duracionHoras: '1',
    horarios: [{ salida: '08:00', llegada: '12:00' }],
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

  // Moneda: si hay algún indicador de colones, toda la hoja es colones
  let moneda: Moneda = 'usd';
  const indicadorColones = /₡|\bcrc\b|\bcolones\b/;
  for (const row of rows) {
    if (row.some((c) => indicadorColones.test(c.toLowerCase()))) {
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
      const tarifas = tarifasPorFila(mapa, celdas);
      const horario = mapa.horario != null ? celdas[mapa.horario] : '';
      const horarioLlegada = mapa.horarioLlegada != null ? celdas[mapa.horarioLlegada] : '';
      const duracion = extraerDuracion(detalle);

      const advertencias: string[] = [];
      const hayNino = tarifas.some((t) => t.maxEdad != null && t.maxEdad < 18);
      if (!hayNino) advertencias.push('Sin tarifa de niño');
      if (!tarifas.some((t) => t.neta !== '')) advertencias.push('Sin tarifa neta');
      if (moneda === 'crc') advertencias.push('Precio en colones');

      actual = nuevaFila(nombre, moneda, limpiarTexto(celdas[mapa.nombre]), {
        tarifas,
        duracionHoras: duracion || '1',
        horarios: [
          {
            salida: horario ? primeraHora(horario) : '08:00',
            llegada: horarioLlegada ? primeraHora(horarioLlegada) : '12:00',
          },
        ],
        incluye: mapa.incluye != null ? parsearIncluye(celdas[mapa.incluye]) : [],
        observaciones: detalle,
        aptoNinos: hayNino,
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
      // Si hay precios en la continuación, tratar de sumarlos
      const continuacionTarifas = tarifasPorFila(mapa, celdas);
      for (const nueva of continuacionTarifas) {
        const key = `${nueva.minEdad}-${nueva.maxEdad ?? '+'}`;
        const existente = actual.tarifas.find((t) => `${t.minEdad}-${t.maxEdad ?? '+'}` === key);
        if (existente) {
          if (nueva.rack && !existente.rack) existente.rack = nueva.rack;
          if (nueva.neta && !existente.neta) existente.neta = nueva.neta;
        } else if (nueva.rack || nueva.neta) {
          actual.tarifas.push(nueva);
        }
      }
      actual.tarifas.sort((a, b) => a.minEdad - b.minEdad);
    }

    // Tabla lateral: extraer productos con precio
    if (lado && /^\d+$/.test(celdas[lado.num] ?? '') && celdas[lado.nombre]) {
      const rack = lado.rack >= 0 ? limpiarNumero(celdas[lado.rack]) : '';
      const neta = lado.neta >= 0 ? limpiarNumero(celdas[lado.neta]) : '';
      if (rack || neta) {
        tours.push(
          nuevaFila(nombre, moneda, limpiarTexto(celdas[lado.nombre]), {
            tarifas: [{ minEdad: 12, maxEdad: 64, rack, neta }],
            aptoNinos: false,
            advertencias: moneda === 'crc' ? ['Precio en colones'] : [],
          }),
        );
      }
    }
  }

  const conPrecio = tours.filter((t) => t.tarifas.some((tar) => tar.rack !== '' || tar.neta !== ''));
  if (conPrecio.length === 0) return null;

  return {
    nombre,
    telefono: '',
    email: null,
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
