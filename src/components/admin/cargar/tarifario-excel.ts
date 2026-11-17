/**
 * Parser del catálogo de operadores (CATALOGO TOURS.xlsx).
 *
 * Una hoja por operador. Encabezados irregulares (español/inglés), varias
 * secciones por hoja, tours multi-fila y tablas laterales (restaurante/SPA).
 * Estrategia best-effort: extrae todo lo que tenga nombre + precio y deja
 * categoría/zona por defecto para corregir en la revisión.
 */
import * as XLSX from 'xlsx';
import type { Categoria, Moneda } from '@/data/mock-tours';
import type { FilaRevision, HorarioRevision, TarifaRevision } from './tipos';
import { nuevaKey } from './tipos';

export interface OperadorCatalogo {
  nombre: string;
  codigo: string;
  telefono?: string;
  email?: string | null;
  comision: number | null;
  conIva?: boolean;
  pagoCompraclic?: boolean;
  pagoSinpe?: boolean;
  pagoTransferencia?: boolean;
  pagoCxc?: boolean;
  logoUrl?: string | null;
  polizaUrl?: string | null;
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

function parsearMoneda(raw: string, porDefecto: Moneda): Moneda {
  const n = normalizar(raw);
  if (!n) return porDefecto;
  if (n.includes('crc') || n.includes('colon') || raw.includes('₡')) return 'crc';
  if (n.includes('usd') || n.includes('dolar')) return 'usd';
  return porDefecto;
}

/** "08:00-12:00; 13:00-17:00" → dos horarios. También acepta "08:00 a 12:00". */
function parsearHorarios(raw: string): HorarioRevision[] {
  const partes = raw
    .split(/[;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: HorarioRevision[] = [];
  for (const parte of partes) {
    const rango = parte.match(/(\d{1,2}:\d{2})\s*(?:-|–|a|hasta)\s*(\d{1,2}:\d{2})/i);
    if (rango) {
      const salida = primeraHora(rango[1]);
      const llegada = primeraHora(rango[2]);
      out.push({ salida, llegada });
      continue;
    }
    const unica = parte.match(/(\d{1,2}:\d{2})/);
    if (unica) {
      const salida = primeraHora(unica[1]);
      out.push({ salida, llegada: salida });
    }
  }
  return out;
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

const ALIASES_CATEGORIA: Record<string, Categoria> = {
  aventura: 'aventura',
  naturaleza: 'naturaleza',
  acuatico: 'acuatico',
  acuatica: 'acuatico',
  water: 'acuatico',
  cultural: 'cultural',
  cultura: 'cultural',
  termas: 'termas',
  termales: 'termas',
  spa: 'termas',
};

function parsearCategorias(raw: string): Categoria[] {
  const out: Categoria[] = [];
  for (const token of raw.split(/[;,|/]+/)) {
    const t = normalizar(token);
    const cat = ALIASES_CATEGORIA[t];
    if (cat && !out.includes(cat)) out.push(cat);
  }
  return out;
}

function parsearSiNo(raw: string): boolean | null {
  const n = normalizar(raw);
  if (!n) return null;
  if (['si', 'yes', 'true', '1', 'x'].includes(n)) return true;
  if (['no', 'false', '0'].includes(n)) return false;
  return null;
}

interface TarifaColumna {
  minEdad: number;
  maxEdad: number | null;
  tipo: 'rack' | 'neta';
}

interface ColumnaDetectada {
  tipo:
    | 'nombre'
    | 'codigo'
    | 'codigoOperador'
    | 'tarifa'
    | 'horario'
    | 'horarios'
    | 'horarioLlegada'
    | 'incluye'
    | 'detalles'
    | 'comision'
    | 'zona'
    | 'categorias'
    | 'duracion'
    | 'minimo'
    | 'aptoNinos'
    | 'politica'
    | 'telefono'
    | 'email'
    | 'conIva'
    | 'pagoCompraclic'
    | 'pagoSinpe'
    | 'pagoTransferencia'
    | 'pagoCxc'
    | 'moneda'
    | 'logoUrl'
    | 'polizaUrl';
  tarifa?: TarifaColumna;
}

/** Extrae un rango de edad de un header de columna. Ej: "niños 6-11", "+65", "adulto mayor". */
function extraerRango(header: string): { minEdad: number; maxEdad: number | null } | null {
  const n = normalizar(header);

  // Rangos explícitos: 0-5, 6-11, 12-64, 11-18. Se leen del header original
  // porque normalizar() convierte el guion en espacio.
  const rango = header.match(/(\d+)\s*[-a]\s*(\d+)/i);
  if (rango) {
    const min = Number(rango[1]);
    const max = Number(rango[2]);
    if (min >= 0 && max >= min) return { minEdad: min, maxEdad: max };
  }

  // "+65", "65+", "mayor 65", "adulto mayor"
  const mayor =
    header.match(/(?:\+|mayor\s*|adulto\s*mayor\s*|tercera\s*edad\s*)(\d+)/i) ??
    header.match(/(\d+)\s*\+/);
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

  if (
    n === 'codigo operador' ||
    n === 'cod operador' ||
    n === 'operator code' ||
    n === 'codigo de operador'
  ) {
    return { tipo: 'codigoOperador' };
  }
  if (
    n === 'codigo' ||
    n === 'codigo tour' ||
    n === 'cod tour' ||
    n === 'code' ||
    n === 'tour code' ||
    n === 'id tour' ||
    n === 'tour id'
  ) {
    return { tipo: 'codigo' };
  }
  if (n === 'zona' || n === 'zona tour') return { tipo: 'zona' };
  if (n === 'categoria' || n === 'categorias' || n === 'category' || n === 'categories') {
    return { tipo: 'categorias' };
  }
  if (n === 'duracion' || n === 'duracion h' || n === 'duracion horas' || n === 'duration' || n === 'horas') {
    return { tipo: 'duracion' };
  }
  if (
    n === 'minimo' ||
    n === 'minimo personas' ||
    n === 'minimo pax' ||
    n === 'min pax' ||
    n === 'min people'
  ) {
    return { tipo: 'minimo' };
  }
  if (n === 'apto ninos' || n === 'apto para ninos') return { tipo: 'aptoNinos' };
  if (n.includes('politica') && (n.includes('cancel') || n === 'politica')) {
    return { tipo: 'politica' };
  }
  if (n === 'telefono' || n === 'teléfono' || n.includes('telefono') || n.includes('celular') || n === 'whatsapp') {
    return { tipo: 'telefono' };
  }
  if (n === 'email' || n === 'correo' || n.includes('correo') || n.includes('e mail')) {
    return { tipo: 'email' };
  }
  if (n === 'moneda' || n === 'currency') return { tipo: 'moneda' };
  if (n === 'logo url' || n === 'logo' || n === 'url logo') return { tipo: 'logoUrl' };
  if (n === 'poliza url' || n === 'url poliza' || n === 'poliza') return { tipo: 'polizaUrl' };
  if (
    n === 'iva' ||
    n === 'iva 13' ||
    n === 'iva 13%' ||
    n === 'con iva' ||
    n === '13%' ||
    n === 'impuesto'
  ) {
    return { tipo: 'conIva' };
  }
  if (n.includes('compraclic') || n.includes('compra clic')) return { tipo: 'pagoCompraclic' };
  if (n.includes('sinpe')) return { tipo: 'pagoSinpe' };
  if (n.includes('transferencia')) return { tipo: 'pagoTransferencia' };
  if (n === 'cxc' || n.includes('cxc') || n.includes('credito') || n.includes('crédito')) {
    return { tipo: 'pagoCxc' };
  }

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

  if (n === 'horarios' || n === 'horarios de salida' || n === 'salidas') return { tipo: 'horarios' };
  if (n === 'pick up' || n === 'manana' || n === 'diurno' || n === 'horario' || n === 'hora') return { tipo: 'horario' };
  if (n === 'drop off' || n === 'regreso' || n === 'retorno' || n === 'llegada' || n === 'hora llegada' || n === 'horario llegada') return { tipo: 'horarioLlegada' };
  if (n === 'incluye' || n.includes('incluye')) return { tipo: 'incluye' };
  if (n === 'detalles' || n === 'recomendaciones' || n.includes('recomendacion') || n.includes('restriccion') || n.includes('observacion') || n === 'notas') return { tipo: 'detalles' };
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
  codigo: number | null;
  codigoOperador: number | null;
  tarifas: { col: number; tarifa: TarifaColumna }[];
  horario: number | null;
  horarios: number | null;
  horarioLlegada: number | null;
  incluye: number | null;
  detalles: number | null;
  comision: number | null;
  zona: number | null;
  categorias: number | null;
  duracion: number | null;
  minimo: number | null;
  aptoNinos: number | null;
  politica: number | null;
  telefono: number | null;
  email: number | null;
  conIva: number | null;
  pagoCompraclic: number | null;
  pagoSinpe: number | null;
  pagoTransferencia: number | null;
  pagoCxc: number | null;
  moneda: number | null;
  logoUrl: number | null;
  polizaUrl: number | null;
}

function construirMapa(celdas: string[]): MapaColumnas {
  const mapa: MapaColumnas = {
    nombre: null,
    codigo: null,
    codigoOperador: null,
    tarifas: [],
    horario: null,
    horarios: null,
    horarioLlegada: null,
    incluye: null,
    detalles: null,
    comision: null,
    zona: null,
    categorias: null,
    duracion: null,
    minimo: null,
    aptoNinos: null,
    politica: null,
    telefono: null,
    email: null,
    conIva: null,
    pagoCompraclic: null,
    pagoSinpe: null,
    pagoTransferencia: null,
    pagoCxc: null,
    moneda: null,
    logoUrl: null,
    polizaUrl: null,
  };
  celdas.forEach((c, ci) => {
    const campo = campoDe(c);
    if (!campo) return;
    if (campo.tipo === 'nombre' && mapa.nombre == null) mapa.nombre = ci;
    else if (campo.tipo === 'codigo' && mapa.codigo == null) mapa.codigo = ci;
    else if (campo.tipo === 'codigoOperador' && mapa.codigoOperador == null) mapa.codigoOperador = ci;
    else if (campo.tipo === 'tarifa' && campo.tarifa) mapa.tarifas.push({ col: ci, tarifa: campo.tarifa });
    else if (campo.tipo === 'horario' && mapa.horario == null) mapa.horario = ci;
    else if (campo.tipo === 'horarios' && mapa.horarios == null) mapa.horarios = ci;
    else if (campo.tipo === 'horarioLlegada' && mapa.horarioLlegada == null) mapa.horarioLlegada = ci;
    else if (campo.tipo === 'incluye' && mapa.incluye == null) mapa.incluye = ci;
    else if (campo.tipo === 'detalles' && mapa.detalles == null) mapa.detalles = ci;
    else if (campo.tipo === 'comision' && mapa.comision == null) mapa.comision = ci;
    else if (campo.tipo === 'zona' && mapa.zona == null) mapa.zona = ci;
    else if (campo.tipo === 'categorias' && mapa.categorias == null) mapa.categorias = ci;
    else if (campo.tipo === 'duracion' && mapa.duracion == null) mapa.duracion = ci;
    else if (campo.tipo === 'minimo' && mapa.minimo == null) mapa.minimo = ci;
    else if (campo.tipo === 'aptoNinos' && mapa.aptoNinos == null) mapa.aptoNinos = ci;
    else if (campo.tipo === 'politica' && mapa.politica == null) mapa.politica = ci;
    else if (campo.tipo === 'telefono' && mapa.telefono == null) mapa.telefono = ci;
    else if (campo.tipo === 'email' && mapa.email == null) mapa.email = ci;
    else if (campo.tipo === 'conIva' && mapa.conIva == null) mapa.conIva = ci;
    else if (campo.tipo === 'pagoCompraclic' && mapa.pagoCompraclic == null) mapa.pagoCompraclic = ci;
    else if (campo.tipo === 'pagoSinpe' && mapa.pagoSinpe == null) mapa.pagoSinpe = ci;
    else if (campo.tipo === 'pagoTransferencia' && mapa.pagoTransferencia == null) mapa.pagoTransferencia = ci;
    else if (campo.tipo === 'pagoCxc' && mapa.pagoCxc == null) mapa.pagoCxc = ci;
    else if (campo.tipo === 'moneda' && mapa.moneda == null) mapa.moneda = ci;
    else if (campo.tipo === 'logoUrl' && mapa.logoUrl == null) mapa.logoUrl = ci;
    else if (campo.tipo === 'polizaUrl' && mapa.polizaUrl == null) mapa.polizaUrl = ci;
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
    codigo: '',
    operador,
    moneda,
    nombre,
    zona: 'Arenal',
    categorias: ['aventura'],
    tarifas: [],
    duracionHoras: '1',
    horarios: [{ salida: '08:00', llegada: '12:00' }],
    incluye: [],
    minimoPersonas: '2',
    aptoNinos: true,
    politicaCancelacion: '',
    observaciones: '',
    excluida: false,
    advertencias: [],
    camposPresentes: {},
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
    if (
      row.some((c) => {
        const texto = c.trim().toLowerCase();
        // La celda suelta "CRC" es el valor de la columna MONEDA, no un aviso de hoja.
        if (texto === 'crc') return false;
        if (!indicadorColones.test(texto)) return false;
        return texto.includes('₡') || /colones|precio|moneda|tarifa/.test(texto);
      })
    ) {
      moneda = 'crc';
      break;
    }
  }

  let mapa: MapaColumnas = construirMapa([]);
  let actual: FilaRevision | null = null;
  const tours: FilaRevision[] = [];
  const comisiones: number[] = [];
  let codigoOperador = '';
  let telefono = '';
  let email = '';
  let conIva: boolean | undefined;
  let pagoCompraclic: boolean | undefined;
  let pagoSinpe: boolean | undefined;
  let pagoTransferencia: boolean | undefined;
  let pagoCxc: boolean | undefined;
  let logoUrl = '';
  let polizaUrl = '';

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

    if (mapa.codigoOperador != null && celdas[mapa.codigoOperador]) {
      codigoOperador = limpiarTexto(celdas[mapa.codigoOperador]);
    }

    if (celdas.every((c) => c === '')) continue;

    // Datos del operador: se repiten en cada fila del machote, se toma el primero.
    if (!telefono && mapa.telefono != null) telefono = limpiarTexto(celdas[mapa.telefono] ?? '');
    if (!email && mapa.email != null) email = limpiarTexto(celdas[mapa.email] ?? '');
    if (!logoUrl && mapa.logoUrl != null) logoUrl = limpiarTexto(celdas[mapa.logoUrl] ?? '');
    if (!polizaUrl && mapa.polizaUrl != null) polizaUrl = limpiarTexto(celdas[mapa.polizaUrl] ?? '');
    if (conIva === undefined && mapa.conIva != null) {
      const v = parsearSiNo(celdas[mapa.conIva] ?? '');
      if (v != null) conIva = v;
    }
    if (pagoCompraclic === undefined && mapa.pagoCompraclic != null) {
      const v = parsearSiNo(celdas[mapa.pagoCompraclic] ?? '');
      if (v != null) pagoCompraclic = v;
    }
    if (pagoSinpe === undefined && mapa.pagoSinpe != null) {
      const v = parsearSiNo(celdas[mapa.pagoSinpe] ?? '');
      if (v != null) pagoSinpe = v;
    }
    if (pagoTransferencia === undefined && mapa.pagoTransferencia != null) {
      const v = parsearSiNo(celdas[mapa.pagoTransferencia] ?? '');
      if (v != null) pagoTransferencia = v;
    }
    if (pagoCxc === undefined && mapa.pagoCxc != null) {
      const v = parsearSiNo(celdas[mapa.pagoCxc] ?? '');
      if (v != null) pagoCxc = v;
    }

    // Comisión (columna COMISIÓN con "%")
    if (mapa.comision != null && celdas[mapa.comision]) {
      const m = celdas[mapa.comision].match(/(\d+(?:\.\d+)?)\s*%/);
      if (m) comisiones.push(Number(m[1]));
    }

    const tieneIdentidad = /^\d+$/.test(celdas[0]) || (mapa.codigo != null && celdas[mapa.codigo] !== '');

    if (tieneIdentidad && mapa.nombre != null && celdas[mapa.nombre]) {
      const detalle = mapa.detalles != null ? celdas[mapa.detalles] : '';
      const tarifas = tarifasPorFila(mapa, celdas);
      const horario = mapa.horario != null ? celdas[mapa.horario] : '';
      const horarioLlegada = mapa.horarioLlegada != null ? celdas[mapa.horarioLlegada] : '';
      const horariosCol = mapa.horarios != null ? parsearHorarios(celdas[mapa.horarios] ?? '') : [];
      const horariosPresente = mapa.horarios != null
        ? (celdas[mapa.horarios] ?? '').trim() !== ''
        : Boolean(horario?.trim() || horarioLlegada?.trim());
      const horarios: HorarioRevision[] =
        horariosCol.length > 0
          ? horariosCol
          : [
              {
                salida: horario ? primeraHora(horario) : '08:00',
                llegada: horarioLlegada ? primeraHora(horarioLlegada) : '12:00',
              },
            ];
      const duracionDetalle = extraerDuracion(detalle);
      const duracionCol = mapa.duracion != null ? limpiarNumero(celdas[mapa.duracion] ?? '') : '';
      const minimoCol = mapa.minimo != null ? limpiarNumero(celdas[mapa.minimo] ?? '') : '';
      const zonaCol = mapa.zona != null ? limpiarTexto(celdas[mapa.zona] ?? '') : '';
      const categoriasCol = mapa.categorias != null ? parsearCategorias(celdas[mapa.categorias] ?? '') : null;
      const aptoCol = mapa.aptoNinos != null ? parsearSiNo(celdas[mapa.aptoNinos] ?? '') : null;
      const politicaCol = mapa.politica != null ? limpiarTexto(celdas[mapa.politica] ?? '') : '';
      const codigoCol = mapa.codigo != null ? limpiarTexto(celdas[mapa.codigo] ?? '') : '';
      const monedaFila = mapa.moneda != null
        ? parsearMoneda(celdas[mapa.moneda] ?? '', moneda)
        : moneda;

      const advertencias: string[] = [];
      const hayNino = tarifas.some((t) => t.maxEdad != null && t.maxEdad < 18);
      if (!hayNino) advertencias.push('Sin tarifa de niño');
      if (!tarifas.some((t) => t.neta !== '')) advertencias.push('Sin tarifa neta');
      if (monedaFila === 'crc') advertencias.push('Precio en colones');

      actual = nuevaFila(nombre, monedaFila, limpiarTexto(celdas[mapa.nombre]), {
        codigo: codigoCol,
        zona: zonaCol || 'Arenal',
        categorias: categoriasCol && categoriasCol.length > 0 ? categoriasCol : ['aventura'],
        tarifas,
        duracionHoras: duracionCol || duracionDetalle || '1',
        minimoPersonas: minimoCol || '2',
        horarios,
        incluye: mapa.incluye != null ? parsearIncluye(celdas[mapa.incluye]) : [],
        observaciones: detalle,
        aptoNinos: aptoCol ?? hayNino,
        politicaCancelacion: politicaCol,
        advertencias,
        camposPresentes: {
          nombre: true,
          zona: mapa.zona != null && zonaCol !== '',
          categorias: mapa.categorias != null && categoriasCol != null && categoriasCol.length > 0,
          duracion: duracionCol !== '' || duracionDetalle !== '',
          minimo: minimoCol !== '',
          aptoNinos: mapa.aptoNinos != null && aptoCol != null,
          politica: mapa.politica != null && politicaCol !== '',
          observaciones: mapa.detalles != null,
          incluye: mapa.incluye != null,
          horarios: horariosPresente,
          tarifas: mapa.tarifas.length > 0,
          moneda: mapa.moneda != null || moneda === 'crc',
          comision: mapa.comision != null,
        },
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
    codigo: codigoOperador,
    ...(telefono ? { telefono } : {}),
    ...(email ? { email } : {}),
    comision: comisiones.length ? comisiones[0] : null,
    ...(conIva !== undefined ? { conIva } : {}),
    ...(pagoCompraclic !== undefined ? { pagoCompraclic } : {}),
    ...(pagoSinpe !== undefined ? { pagoSinpe } : {}),
    ...(pagoTransferencia !== undefined ? { pagoTransferencia } : {}),
    ...(pagoCxc !== undefined ? { pagoCxc } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(polizaUrl ? { polizaUrl } : {}),
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
