/**
 * Generador del machote (plantilla) de Excel para cargar/actualizar el
 * catálogo de tours de forma masiva.
 *
 * El formato de las hojas es el mismo que ya lee `tarifario-excel.ts`
 * (wizard "Cargar tarifario"): una hoja por operador, fila 1 = encabezados,
 * columna A = número de tour, columnas de tarifas por rango de edad con
 * palabra clave RACK (precio público) o NETA (costo interno).
 */
import * as XLSX from 'xlsx';
import type { Operador, Tour } from '@/data/mock-tours';

const ENCABEZADOS = [
  '#',
  'TOUR',
  'ADULTO RACK',
  'ADULTO NETA',
  'NIÑO RACK',
  'NIÑO NETA',
  'ADULTO MAYOR RACK',
  'PICK UP',
  'DROP OFF',
  'INCLUYE',
  'DETALLES',
  'COMISIÓN',
];

const INSTRUCCIONES = [
  ['MACHOTE DE CATÁLOGO DE TOURS'],
  [''],
  ['1) Una hoja de Excel = un operador. El NOMBRE DE LA HOJA se usa como nombre del operador.'],
  ['2) Duplicá la hoja "EJEMPLO USD" (o "EJEMPLO COLONES") y renombrala con el nombre del operador. Agregá una hoja por cada operador.'],
  ['3) Reemplazá las filas de ejemplo por los tours: la columna # debe ser un número y TOUR es el nombre del tour.'],
  ['4) Precios: escribí solo el número. RACK = precio público del cliente. NETA = costo del operador (uso interno, opcional).'],
  ['5) Rangos de edad: usá las columnas del machote (NIÑO = 0-11, ADULTO = 12-64, ADULTO MAYOR = 65+). Si un rango no aplica, dejalo vacío.'],
  ['6) Si la hoja menciona "colones" o lleva el símbolo ₡, TODOS los precios de esa hoja se toman en colones (CRC); si no, en dólares (USD).'],
  ['7) INCLUYE: separá los items con punto y coma (transporte; guía; almuerzo; entradas; equipo; seguro; frutas; snacks; hidratación; toallas).'],
  ['8) PICK UP / DROP OFF: hora de salida y de regreso del tour (ej: 07:30).'],
  ['9) DETALLES: notas para el cliente. Si escribís "Duración: X horas" se detecta automáticamente.'],
  ['10) COMISIÓN: porcentaje de comisión del operador, siempre con % (ej: 10%).'],
  ['11) Cuando termines, subí el archivo en Admin → Cargar tarifario. Se revisa todo antes de confirmar.'],
  [''],
  ['Podés borrar esta hoja de instrucciones antes de subir el archivo.'],
];

function hojaConAnchos(filas: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws['!cols'] = ENCABEZADOS.map((h, i) => ({
    wch: i === 1 ? 32 : i >= 9 && i <= 10 ? 38 : Math.max(10, h.length + 4),
  }));
  return ws;
}

/** Descarga el machote de Excel con instrucciones y hojas de ejemplo (USD y colones). */
export function descargarMachote(): void {
  const wb = XLSX.utils.book_new();

  const wsInstrucciones = XLSX.utils.aoa_to_sheet(INSTRUCCIONES);
  wsInstrucciones['!cols'] = [{ wch: 120 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'INSTRUCCIONES');

  const usd: unknown[][] = [
    ENCABEZADOS,
    ['1', 'Canopy Arenal', 65, 45, 40, 28, '', '07:30', '12:00', 'transporte; guía; equipo; frutas', 'Duración: 4 horas. Traer ropa cómoda y cerrada.', '10%'],
    ['2', 'Cataratas La Fortuna', 85, 60, 55, 38, 80, '08:00', '13:00', 'transporte; guía; almuerzo; entradas', 'Duración: 5 horas. Paseo opcional por el pueblo.', '10%'],
  ];
  XLSX.utils.book_append_sheet(wb, hojaConAnchos(usd), 'EJEMPLO USD');

  const crc: unknown[][] = [
    ['Precios en colones ₡ — todos los precios de esta hoja se toman en CRC (podés borrar esta fila)'],
    ENCABEZADOS,
    ['1', 'Tour termas del bosque', 17500, 12000, 9500, 7000, '', '09:00', '14:00', 'transporte; entradas; toallas', 'Duración: 3 horas.', '10%'],
  ];
  XLSX.utils.book_append_sheet(wb, hojaConAnchos(crc), 'EJEMPLO COLONES');

  XLSX.writeFile(wb, 'machote-catalogo-tours.xlsx');
}

/* ------------------------------------------------------------------ */
/* Machote por operador (actualización)                                */
/* ------------------------------------------------------------------ */

interface RangoMachote {
  min: number;
  max: number | null;
  key: string;
  label: string;
}

function claveRango(min: number, max: number | null): string {
  return `${min}-${max ?? '+'}`;
}

function etiquetaRango(min: number, max: number | null): string {
  if (min === 12 && max === 64) return 'ADULTO';
  if (min === 0 && max === 11) return 'NIÑO';
  if (min === 65 && max == null) return 'ADULTO MAYOR';
  return max == null ? `RANGO ${min}+` : `RANGO ${min}-${max}`;
}

function rangosDe(tours: Tour[]): RangoMachote[] {
  const map = new Map<string, RangoMachote>();
  const agregar = (min: number, max: number | null) => {
    const key = claveRango(min, max);
    if (!map.has(key)) map.set(key, { min, max, key, label: etiquetaRango(min, max) });
  };
  agregar(12, 64);
  agregar(0, 11);
  agregar(65, null);
  for (const t of tours) {
    for (const tar of t.tarifas) agregar(tar.min_edad, tar.max_edad);
  }
  const orden = (r: RangoMachote) => {
    if (r.min === 12 && r.max === 64) return 0;
    if (r.min === 0 && r.max === 11) return 1;
    if (r.min === 65 && r.max == null) return 2;
    return 3;
  };
  return [...map.values()].sort(
    (a, b) => orden(a) - orden(b) || a.min - b.min || (a.max ?? 999) - (b.max ?? 999),
  );
}

function nombreHoja(nombre: string): string {
  return (nombre.replace(/[\\/?*[\]:]/g, ' ').trim() || 'OPERADOR').slice(0, 31);
}

function slugArchivo(texto: string): string {
  return (
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'operador'
  );
}

/**
 * Machote de un operador con sus tours de la base: código único, precios de
 * cada rango, horarios y todos los campos editables. Las filas sin código se
 * crean nuevas al subir; las que tienen código actualizan el tour existente.
 */
export function descargarMachoteOperador(operador: Operador, tours: Tour[]): void {
  const rangos = rangosDe(tours);
  const encabezados = [
    '#',
    'CÓDIGO',
    'TOUR',
    ...rangos.flatMap((r) => [`${r.label} RACK`, `${r.label} NETA`]),
    'PICK UP',
    'DROP OFF',
    'INCLUYE',
    'DETALLES',
    'COMISIÓN',
    'ZONA',
    'CATEGORÍA',
    'DURACIÓN (H)',
    'MÍNIMO PERSONAS',
    'APTO NIÑOS',
    'POLÍTICA CANCELACIÓN',
  ];

  const filas = tours
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((t, i) => {
      const porRango = new Map(t.tarifas.map((tar) => [claveRango(tar.min_edad, tar.max_edad), tar]));
      const precios = rangos.flatMap((r) => {
        const tar = porRango.get(r.key);
        return [tar?.rack ?? '', tar?.neta ?? ''];
      });
      const horario = t.horarios[0];
      return [
        String(i + 1),
        t.codigo,
        t.nombre,
        ...precios,
        horario?.hora_salida ?? '',
        horario?.hora_llegada ?? '',
        t.incluye.join('; '),
        t.observaciones,
        operador.comision != null ? `${operador.comision}%` : '',
        t.zona,
        t.categorias.join(', '),
        t.duracion_horas,
        t.minimo_personas,
        t.apto_ninos ? 'SI' : 'NO',
        t.politica_cancelacion,
      ];
    });

  const wb = XLSX.utils.book_new();
  const esCrc = tours.length > 0 && tours.every((t) => t.moneda === 'crc');
  const cuerpo = esCrc
    ? [['Precios en colones ₡ — todos los precios de esta hoja se toman en CRC'], encabezados, ...filas]
    : [encabezados, ...filas];
  const ws = XLSX.utils.aoa_to_sheet(cuerpo);
  const primerPrecio = 3;
  const ultimoPrecio = primerPrecio + rangos.length * 2 - 1;
  ws['!cols'] = encabezados.map((h, i) => {
    if (i === 0) return { wch: 5 };
    if (i === 1) return { wch: 14 };
    if (i === 2) return { wch: 40 };
    if (i >= primerPrecio && i <= ultimoPrecio) return { wch: 14 };
    if (i >= ultimoPrecio + 3 && i <= ultimoPrecio + 4) return { wch: 38 };
    return { wch: Math.max(12, h.length + 2) };
  });
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja(operador.nombre));

  const instrucciones = [
    [`MACHOTE DE ACTUALIZACIÓN — ${operador.nombre}`],
    [''],
    ['1) Este archivo trae los tours que ya están en la base, con su CÓDIGO único.'],
    ['2) Para actualizar un tour, dejá su CÓDIGO y cambiá los datos que necesites.'],
    ['3) Para crear un tour nuevo, agregá una fila con el CÓDIGO vacío.'],
    ['4) No cambies el código de un tour existente: se usa para encontrarlo y actualizarlo.'],
    ['5) Los tours que no estén en este archivo NO se borran.'],
    ['6) RACK = precio público; NETA = costo del operador. Los rangos de edad son los de la base.'],
    ['7) INCLUYE: separá con punto y coma. APTO NIÑOS: SI/NO.'],
    ['8) Al terminar, subí el archivo en Admin → Cargar tarifario (con el operador seleccionado).'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones);
  wsInstr['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'INSTRUCCIONES');

  XLSX.writeFile(wb, `machote-${slugArchivo(operador.nombre)}.xlsx`);
}
