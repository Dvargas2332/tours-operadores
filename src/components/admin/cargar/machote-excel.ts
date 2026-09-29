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
