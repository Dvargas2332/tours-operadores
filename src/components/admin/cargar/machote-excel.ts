/**
 * Generador del machote (plantilla) de Excel para cargar/actualizar el
 * catálogo de tours de forma masiva.
 *
 * El formato de las hojas es el mismo que lee `tarifario-excel.ts`
 * (wizard "Cargar tarifario"): una hoja por operador, fila de encabezados,
 * columna A = número de tour y columnas de tarifas por rango de edad con
 * palabra clave RACK (precio público) o NETA (costo interno).
 */
import * as XLSX from 'xlsx';
import type { Operador, Tour } from '@/data/mock-tours';

const ENCABEZADOS = [
  '#',
  'CÓDIGO OPERADOR',
  'CÓDIGO TOUR',
  'TOUR',
  'ZONA',
  'CATEGORÍA',
  'MONEDA',
  'ADULTO RACK',
  'ADULTO NETA',
  'NIÑO RACK',
  'NIÑO NETA',
  'ADULTO MAYOR RACK',
  'ADULTO MAYOR NETA',
  'HORARIOS',
  'INCLUYE',
  'OBSERVACIONES',
  'DURACIÓN (H)',
  'MÍNIMO PERSONAS',
  'APTO NIÑOS',
  'POLÍTICA CANCELACIÓN',
  'TELÉFONO',
  'EMAIL',
  'COMISIÓN',
  'IVA 13%',
  'PAGO COMPRACLIC',
  'PAGO SINPE',
  'PAGO TRANSFERENCIA',
  'PAGO CXC',
  'LOGO URL',
  'PÓLIZA URL',
];

const INSTRUCCIONES = [
  ['MACHOTE DE CATÁLOGO DE TOURS'],
  [''],
  ['1) Una hoja de Excel = un operador. El NOMBRE DE LA HOJA se usa como nombre del operador.'],
  ['2) Para crear un operador nuevo, duplicá una hoja de ejemplo y completá sus datos. Para crear un tour, agregá una fila con CÓDIGO TOUR vacío.'],
  ['3) CÓDIGO OPERADOR es único y corto (ej. CANOA); si se deja vacío se genera desde el nombre.'],
  ['4) CÓDIGO TOUR es el subcódigo dentro del operador (01, 02…); si se deja vacío se toma el siguiente libre. No cambies el código de un tour existente.'],
  ['5) MONEDA: USD o CRC por fila. Si la hoja dice "colones" o lleva ₡, las filas sin MONEDA se toman en CRC.'],
  ['6) Precios: escribí solo el número. RACK = precio público del cliente. NETA = costo del operador (uso interno, opcional).'],
  ['7) Rangos de edad del ejemplo: NIÑO = 0-11, ADULTO = 12-64, ADULTO MAYOR = 65+. Si un rango no aplica, dejalo vacío.'],
  ['8) HORARIOS: uno o varios horarios separados por punto y coma. Formato: 08:00-12:00; 13:00-17:00.'],
  ['9) INCLUYE: separá los items con punto y coma (transporte; guía; almuerzo; entradas; equipo; seguro; frutas; snacks; hidratación; toallas).'],
  ['10) CATEGORÍA: aventura, naturaleza, acuático, cultural o termas. Podés combinar con coma.'],
  ['11) APTO NIÑOS: SI/NO. IVA 13% y PAGO ...: SI/NO. Si la celda queda vacía, se conserva lo que ya tiene el operador.'],
  ['12) COMISIÓN: porcentaje del operador, siempre con % (ej: 10%).'],
  ['13) Las columnas TELÉFONO, EMAIL, IVA, PAGOS y URLS son del operador: se repiten en la hoja y se toma el primer valor.'],
  ['14) Los tours que no estén en este archivo NO se borran. Las tarifas por fecha (temporadas) tampoco se borran; se administran desde Admin → Tours → Temporadas.'],
  ['15) Si el operador tiene tarifas con otros rangos de edad, descargá su machote desde Admin → Operadores: ese incluye todas sus columnas.'],
  ['16) Al terminar, subí el archivo en Admin → Cargar tarifario. Se revisa todo antes de confirmar.'],
  [''],
  ['Podés borrar esta hoja de instrucciones antes de subir el archivo.'],
];

function anchoColumna(header: string): number {
  if (header === '#') return 5;
  if (header === 'TOUR') return 34;
  if (header === 'INCLUYE' || header === 'OBSERVACIONES' || header === 'POLÍTICA CANCELACIÓN') return 42;
  if (header.includes('URL')) return 30;
  if (header === 'EMAIL' || header === 'TELÉFONO') return 24;
  if (header === 'HORARIOS' || header === 'CATEGORÍA' || header === 'ZONA') return 18;
  return Math.max(11, header.length + 3);
}

function hojaConAnchos(filas: unknown[][], headers: string[] = ENCABEZADOS): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws['!cols'] = headers.map((h) => ({ wch: anchoColumna(h) }));
  return ws;
}

/** Descarga el machote de Excel con instrucciones y hojas de ejemplo (USD y colones). */
export function descargarMachote(): void {
  const wb = XLSX.utils.book_new();

  const wsInstrucciones = XLSX.utils.aoa_to_sheet(INSTRUCCIONES);
  wsInstrucciones['!cols'] = [{ wch: 125 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'INSTRUCCIONES');

  const usd: unknown[][] = [
    ENCABEZADOS,
    [
      '1', 'CANOA', '01', 'Canopy Arenal', 'Arenal', 'Aventura', 'USD',
      65, 45, 40, 28, '', '',
      '08:00-12:00; 13:00-17:00',
      'transporte; guía; equipo; frutas',
      'Duración: 4 horas. Traer ropa cómoda y cerrada.',
      4, 2, 'SI', 'Cancelación 48 h antes: 100%.',
      '+506 2479-9800', 'reservas@canoa.cr', '10%', 'SI', 'SI', 'SI', 'SI', 'NO', '', '',
    ],
    [
      '2', 'CANOA', '02', 'Cataratas La Fortuna', 'La Fortuna centro', 'Naturaleza, Aventura', 'USD',
      85, 60, 55, 38, 80, 55,
      '08:00-13:00',
      'transporte; guía; almuerzo; entradas',
      'Duración: 5 horas. Paseo opcional por el pueblo.',
      5, 2, 'SI', 'Cancelación 24 h antes: 50%.',
      '+506 2479-9800', 'reservas@canoa.cr', '10%', 'SI', 'SI', 'SI', 'SI', 'NO', '', '',
    ],
  ];
  XLSX.utils.book_append_sheet(wb, hojaConAnchos(usd), 'EJEMPLO USD');

  const crc: unknown[][] = [
    ['Precios en colones ₡ — las filas sin MONEDA se toman en CRC (podés borrar esta fila)'],
    ENCABEZADOS,
    [
      '1', 'TERMAS', '01', 'Tour termas del bosque', 'La Fortuna centro', 'Termas & Relax', 'CRC',
      17500, 12000, 9500, 7000, '', '',
      '09:00-14:00',
      'transporte; entradas; toallas',
      'Duración: 3 horas.',
      3, 2, 'SI', 'Cancelación 24 h antes: 50%.',
      '+506 2479-1234', 'reservas@termas.cr', '10%', 'NO', 'NO', 'SI', 'SI', 'NO', '', '',
    ],
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

function siNo(valor: boolean): string {
  return valor ? 'SI' : 'NO';
}

function horariosTexto(tour: Tour): string {
  return tour.horarios
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((h) => (h.hora_llegada ? `${h.hora_salida}-${h.hora_llegada}` : h.hora_salida))
    .join('; ');
}

/**
 * Machote de un operador con sus tours de la base: código único, precios de
 * cada rango, horarios, datos del operador y todos los campos editables.
 * Las filas sin código se crean nuevas al subir; las que tienen código
 * actualizan el tour existente.
 */
export function descargarMachoteOperador(operador: Operador, tours: Tour[]): void {
  const rangos = rangosDe(tours);
  const encabezados = [
    '#',
    'CÓDIGO OPERADOR',
    'CÓDIGO TOUR',
    'TOUR',
    'ZONA',
    'CATEGORÍA',
    'MONEDA',
    ...rangos.flatMap((r) => [`${r.label} RACK`, `${r.label} NETA`]),
    'HORARIOS',
    'INCLUYE',
    'OBSERVACIONES',
    'DURACIÓN (H)',
    'MÍNIMO PERSONAS',
    'APTO NIÑOS',
    'POLÍTICA CANCELACIÓN',
    'TELÉFONO',
    'EMAIL',
    'COMISIÓN',
    'IVA 13%',
    'PAGO COMPRACLIC',
    'PAGO SINPE',
    'PAGO TRANSFERENCIA',
    'PAGO CXC',
    'LOGO URL',
    'PÓLIZA URL',
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
      return [
        String(i + 1),
        operador.codigo,
        t.codigo,
        t.nombre,
        t.zona,
        t.categorias.join(', '),
        t.moneda.toUpperCase(),
        ...precios,
        horariosTexto(t),
        t.incluye.join('; '),
        t.observaciones,
        t.duracion_horas,
        t.minimo_personas,
        siNo(t.apto_ninos),
        t.politica_cancelacion,
        operador.telefono,
        operador.email ?? '',
        operador.comision != null ? `${operador.comision}%` : '',
        siNo(operador.con_iva),
        siNo(operador.pago_compraclic),
        siNo(operador.pago_sinpe),
        siNo(operador.pago_transferencia),
        siNo(operador.pago_cxc),
        operador.logo_url ?? '',
        operador.poliza_url ?? '',
      ];
    });

  const wb = XLSX.utils.book_new();
  const esCrc = tours.length > 0 && tours.every((t) => t.moneda === 'crc');
  const cuerpo = esCrc
    ? [['Precios en colones ₡ — las filas sin MONEDA se toman en CRC'], encabezados, ...filas]
    : [encabezados, ...filas];
  const ws = hojaConAnchos(cuerpo, encabezados);
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja(operador.nombre));

  const instrucciones = [
    [`MACHOTE DE ACTUALIZACIÓN — ${operador.nombre}`],
    [''],
    ['1) Este archivo trae los tours que ya están en la base, con su CÓDIGO OPERADOR y CÓDIGO TOUR.'],
    ['2) Para actualizar un tour, dejá su CÓDIGO TOUR y cambiá los datos que necesites.'],
    ['3) Para crear un tour nuevo, agregá una fila con el CÓDIGO TOUR vacío; se toma el siguiente libre.'],
    ['4) No cambies el código de un tour existente: se usa para encontrarlo y actualizarlo.'],
    ['5) CÓDIGO OPERADOR identifica al operador y ya viene lleno. Para crear un operador nuevo usá una hoja nueva con su nombre.'],
    ['6) Los tours que no estén en este archivo NO se borran. Las temporadas de precio por fecha tampoco se borran.'],
    ['7) RACK = precio público; NETA = costo del operador. Los rangos de edad se toman de las columnas del machote.'],
    ['8) MONEDA: USD o CRC por fila. HORARIOS: separá varios con punto y coma, ej. 08:00-12:00; 13:00-17:00.'],
    ['9) INCLUYE: separá con punto y coma. APTO NIÑOS, IVA 13% y PAGO ...: SI/NO.'],
    ['10) TELÉFONO, EMAIL, COMISIÓN, IVA, PAGOS y URLS son del operador; se repiten en cada fila y se toma el primer valor.'],
    ['11) Si una celda del operador queda vacía, se conserva el valor actual. Para apagar un IVA o pago, escribí NO.'],
    ['12) Al terminar, subí el archivo en Admin → Cargar tarifario (con el operador seleccionado).'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones);
  wsInstr['!cols'] = [{ wch: 115 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'INSTRUCCIONES');

  XLSX.writeFile(wb, `machote-${slugArchivo(operador.nombre)}.xlsx`);
}
