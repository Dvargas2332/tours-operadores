/**
 * Estado de filtros del buscador + motor de filtrado + intérprete mock
 * de búsqueda libre (buscador.md §1-2). El intérprete simula lo que luego
 * hará el backend (texto libre → filtros estructurados).
 */
import type { Categoria, Operador, Tour } from '@/data/mock-tours';
import { CATEGORIA_META, HORARIO_META, INCLUYE_META, horarioBucket } from '@/lib/tour-meta';
import type { HorarioKey } from '@/lib/tour-meta';
import { formatUSD } from '@/data/mock-tours';

export type DuracionFiltro = 'cualquiera' | 'hasta3' | 'hasta5' | 'hasta8' | 'dia-completo';

export const DURACION_OPCIONES: { key: DuracionFiltro; label: string }[] = [
  { key: 'cualquiera', label: 'Cualquiera' },
  { key: 'hasta3', label: 'Hasta 3 h (medio día corto)' },
  { key: 'hasta5', label: 'Hasta 5 h' },
  { key: 'hasta8', label: 'Hasta 8 h' },
  { key: 'dia-completo', label: 'Día completo (>8 h)' },
];

export const PRECIO_MIN = 0;
export const PRECIO_MAX = 300;

export interface Filtros {
  precio: [number, number];
  precioActivo: boolean;
  zonas: string[];
  categorias: Categoria[];
  duracion: DuracionFiltro;
  horarios: HorarioKey[];
  incluye: string[];
  aptoNinos: boolean;
  edadNino: number | null;
  operadores: number[];
  /** Texto libre interpretado por IA (chip especial) */
  texto: string | null;
}

export const FILTROS_INICIALES: Filtros = {
  precio: [PRECIO_MIN, PRECIO_MAX],
  precioActivo: false,
  zonas: [],
  categorias: [],
  duracion: 'cualquiera',
  horarios: [],
  incluye: [],
  aptoNinos: false,
  edadNino: null,
  operadores: [],
  texto: null,
};

/* ------------------------------------------------------------------ */
/* Motor de filtrado                                                   */
/* ------------------------------------------------------------------ */

export function aplicarFiltros(tours: Tour[], f: Filtros): Tour[] {
  return tours.filter((t) => {
    if (f.precioActivo) {
      if (t.precio_adulto < f.precio[0] || t.precio_adulto > f.precio[1]) return false;
      // Con el filtro de niños activo, también filtra precio_nino
      if (f.aptoNinos && t.precio_nino != null) {
        if (t.precio_nino < f.precio[0] || t.precio_nino > f.precio[1]) return false;
      }
    }
    if (f.zonas.length > 0 && !f.zonas.includes(t.zona)) return false;
    if (f.categorias.length > 0 && !f.categorias.includes(t.categoria)) return false;
    if (f.duracion !== 'cualquiera') {
      const d = t.duracion_horas;
      const ok =
        f.duracion === 'hasta3' ? d <= 3
        : f.duracion === 'hasta5' ? d <= 5
        : f.duracion === 'hasta8' ? d <= 8
        : d > 8;
      if (!ok) return false;
    }
    if (f.horarios.length > 0 && !f.horarios.includes(horarioBucket(t.hora_salida))) return false;
    if (f.incluye.length > 0 && !f.incluye.every((k) => t.incluye.includes(k))) return false;
    if (f.aptoNinos && !t.apto_ninos) return false;
    if (f.operadores.length > 0 && !f.operadores.includes(t.operador.id)) return false;
    return true;
  });
}

/** Filtros sin una sección — para conteos dinámicos por zona (buscador.md §2.2) */
export function sinSeccion(f: Filtros, seccion: 'zonas'): Filtros {
  if (seccion === 'zonas') return { ...f, zonas: [] };
  return f;
}

export function contarActivos(f: Filtros): number {
  let n = 0;
  if (f.precioActivo) n++;
  n += f.zonas.length;
  n += f.categorias.length;
  if (f.duracion !== 'cualquiera') n++;
  n += f.horarios.length;
  n += f.incluye.length;
  if (f.aptoNinos) n++;
  n += f.operadores.length;
  return n; // el chip de texto IA no cuenta para "Limpiar (n)"
}

export interface ChipFiltro {
  id: string;
  label: string;
}

/** Chips de filtros activos en el orden del panel (buscador.md §3) */
export function chipsDeFiltros(f: Filtros, operadores: Operador[]): ChipFiltro[] {
  const chips: ChipFiltro[] = [];
  if (f.precioActivo) {
    chips.push({ id: 'precio', label: `${formatUSD(f.precio[0])}–${formatUSD(f.precio[1])}` });
  }
  for (const z of f.zonas) chips.push({ id: `zona:${z}`, label: `Zona: ${z}` });
  for (const c of f.categorias) chips.push({ id: `cat:${c}`, label: `Categoría: ${CATEGORIA_META[c].label}` });
  if (f.duracion !== 'cualquiera') {
    const op = DURACION_OPCIONES.find((o) => o.key === f.duracion);
    chips.push({ id: 'duracion', label: `Duración: ${op?.label ?? ''}` });
  }
  for (const h of f.horarios) chips.push({ id: `horario:${h}`, label: `Salida: ${HORARIO_META[h].label}` });
  for (const i of f.incluye) chips.push({ id: `incluye:${i}`, label: `Incluye: ${INCLUYE_META[i]?.label ?? i}` });
  if (f.aptoNinos) {
    chips.push({ id: 'ninos', label: f.edadNino ? `Apto niños (${f.edadNino} años)` : 'Apto para niños' });
  }
  for (const idOp of f.operadores) {
    const op = operadores.find((o) => o.id === idOp);
    chips.push({ id: `operador:${idOp}`, label: `Operador: ${op?.nombre ?? idOp}` });
  }
  return chips;
}

/** Quita un chip por id (inverso de chipsDeFiltros) */
export function quitarChip(f: Filtros, chipId: string): Filtros {
  if (chipId === 'precio') return { ...f, precioActivo: false, precio: [PRECIO_MIN, PRECIO_MAX] };
  if (chipId === 'duracion') return { ...f, duracion: 'cualquiera' };
  if (chipId === 'ninos') return { ...f, aptoNinos: false, edadNino: null };
  if (chipId === 'texto') return { ...f, texto: null };
  const [tipo, valor] = chipId.split(':');
  if (tipo === 'zona') return { ...f, zonas: f.zonas.filter((z) => z !== valor) };
  if (tipo === 'cat') return { ...f, categorias: f.categorias.filter((c) => c !== valor) };
  if (tipo === 'horario') return { ...f, horarios: f.horarios.filter((h) => h !== valor) };
  if (tipo === 'incluye') return { ...f, incluye: f.incluye.filter((i) => i !== valor) };
  if (tipo === 'operador') return { ...f, operadores: f.operadores.filter((o) => o !== Number(valor)) };
  return f;
}

/* ------------------------------------------------------------------ */
/* Ordenamiento (buscador.md §4)                                       */
/* ------------------------------------------------------------------ */

export type Orden = 'relevancia' | 'precio-asc' | 'precio-desc' | 'duracion-asc' | 'nombre';

export const ORDEN_OPCIONES: { key: Orden; label: string }[] = [
  { key: 'relevancia', label: 'Relevancia' },
  { key: 'precio-asc', label: 'Precio: menor a mayor' },
  { key: 'precio-desc', label: 'Precio: mayor a menor' },
  { key: 'duracion-asc', label: 'Duración: más corto' },
  { key: 'nombre', label: 'Nombre A–Z' },
];

export function ordenar(tours: Tour[], orden: Orden, texto: string | null): Tour[] {
  const arr = [...tours];
  switch (orden) {
    case 'precio-asc':
      return arr.sort((a, b) => a.precio_adulto - b.precio_adulto);
    case 'precio-desc':
      return arr.sort((a, b) => b.precio_adulto - a.precio_adulto);
    case 'duracion-asc':
      return arr.sort((a, b) => a.duracion_horas - b.duracion_horas);
    case 'nombre':
      return arr.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    case 'relevancia': {
      // Mock de relevancia: coincidencias del texto en nombre/zona/categoría primero
      if (!texto) return arr.sort((a, b) => a.precio_adulto - b.precio_adulto);
      const q = texto.toLowerCase();
      const score = (t: Tour) => {
        let s = 0;
        if (t.nombre.toLowerCase().includes(q)) s += 3;
        if (t.zona.toLowerCase().includes(q)) s += 2;
        if (CATEGORIA_META[t.categoria].label.toLowerCase().includes(q)) s += 1;
        for (const palabra of q.split(/\s+/)) {
          if (palabra.length > 2 && t.nombre.toLowerCase().includes(palabra)) s += 1;
        }
        return s;
      };
      return arr.sort((a, b) => score(b) - score(a) || a.precio_adulto - b.precio_adulto);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Intérprete mock de búsqueda libre (buscador.md §1)                  */
/* Futuro: endpoint tRPC que traduce texto → filtros.                  */
/* ------------------------------------------------------------------ */

export interface Interpretacion {
  filtros: Partial<Filtros>;
  /** Descripciones legibles de lo interpretado */
  resumen: string[];
}

const REGLAS_CATEGORIA: [RegExp, Categoria][] = [
  [/canopy|tarz[aá]n|rapel|canyoning|cabalgata|cuadra|atv|bugg/i, 'aventura'],
  [/rafting|tubing|kayak|r[ií]o balsa|sarapiqu[ií]|safari float/i, 'acuatico'],
  [/termas|termales|aguas termales|relax|spa|hot springs/i, 'termas'],
  [/caf[eé]|chocolate|cultur|trapiche|historia/i, 'cultural'],
  [/naturaleza|puentes|colgantes|caminata|nocturna|volc[aá]n|celeste|tenorio|caño negro|safari|aves|observaci/i, 'naturaleza'],
];

const REGLAS_ZONA: [RegExp, string][] = [
  [/r[ií]o celeste|tenorio/i, 'Río Celeste / Tenorio'],
  [/caño negro/i, 'Caño Negro'],
  [/sarapiqu[ií]/i, 'Sarapiquí'],
  [/monteverde/i, 'Monteverde'],
  [/centro|fortuna centro|catarata|waterfall/i, 'La Fortuna centro'],
  [/arenal|volc[aá]n|fortuna/i, 'Arenal'],
];

export function interpretarBusqueda(texto: string): Interpretacion | null {
  const q = texto.trim();
  if (q.length < 3) return null;

  const parcial: Partial<Filtros> = {};
  const resumen: string[] = [];

  // Categoría
  for (const [re, cat] of REGLAS_CATEGORIA) {
    if (re.test(q)) {
      parcial.categorias = [cat];
      resumen.push(`Categoría: ${CATEGORIA_META[cat].label}`);
      break;
    }
  }

  // Zona
  for (const [re, zona] of REGLAS_ZONA) {
    if (re.test(q)) {
      parcial.zonas = [zona];
      resumen.push(`Zona: ${zona}`);
      break;
    }
  }

  // Precio: "menos de $250", "bajo $80", "< $100", "$80"
  const mPrecio = q.match(/(?:menos de|bajo|m[aá]x(?:imo)?|hasta|<|≤)?\s*\$\s*(\d+(?:\.\d+)?)/i);
  if (mPrecio) {
    const max = Math.min(PRECIO_MAX, Math.max(10, Math.round(Number(mPrecio[1]))));
    parcial.precio = [PRECIO_MIN, max];
    parcial.precioActivo = true;
    resumen.push(`≤ ${formatUSD(max)} por persona`);
  }

  // Horarios
  const horarios = new Set<HorarioKey>();
  if (/temprano/i.test(q)) horarios.add('antes7');
  if (/mañana/i.test(q)) { horarios.add('antes7'); horarios.add('manana'); }
  if (/mediod[ií]a|medio d[ií]a(?! corto)/i.test(q) && !/medio d[ií]a corto/i.test(q)) horarios.add('mediodia');
  if (/tarde|atardecer|sunset/i.test(q)) horarios.add('tarde');
  if (/noche|nocturna/i.test(q)) horarios.add('noche');
  if (horarios.size > 0) {
    parcial.horarios = [...horarios];
    resumen.push(`Salida: ${[...horarios].map((h) => HORARIO_META[h].label).join(', ')}`);
  }

  // Qué incluye
  const incluye = new Set<string>();
  if (/almuerzo|comida|cena|aliment/i.test(q)) incluye.add('almuerzo');
  if (/transporte|recojo|recoger|shuttle/i.test(q)) incluye.add('transporte');
  if (/gu[ií]a/i.test(q)) incluye.add('guia');
  if (/entrada|parque/i.test(q)) incluye.add('entradas');
  if (/equipo/i.test(q)) incluye.add('equipo');
  if (/seguro/i.test(q)) incluye.add('seguro');
  if (incluye.size > 0) {
    parcial.incluye = [...incluye];
    resumen.push(`Incluye: ${[...incluye].map((i) => INCLUYE_META[i].label).join(', ')}`);
  }

  // Niños
  if (/niñ|beb[eé]|familia|infantil|menores/i.test(q)) {
    parcial.aptoNinos = true;
    const mEdad = q.match(/(\d{1,2})\s*añ/i);
    if (mEdad) parcial.edadNino = Number(mEdad[1]);
    resumen.push('Apto para niños');
  }

  // Duración
  if (/d[ií]a completo|todo el d[ií]a/i.test(q)) {
    parcial.duracion = 'dia-completo';
    resumen.push('Duración: día completo');
  } else if (/medio d[ií]a corto|corto|r[aá]pido/i.test(q)) {
    parcial.duracion = 'hasta3';
    resumen.push('Duración: hasta 3 h');
  } else if (/medio d[ií]a/i.test(q)) {
    parcial.duracion = 'hasta5';
    resumen.push('Duración: hasta 5 h');
  }

  if (resumen.length === 0) return null;
  return { filtros: parcial, resumen };
}
