/**
 * Parseo y validación del Excel/CSV de operadores (Administración →
 * "Agregar operadores (Excel)"). Lógica pura, sin React, para poder probarla.
 * Columnas esperadas (primera hoja): nombre (req.), contacto, comision (0–100),
 * con encabezados tolerantes a variantes en español.
 */
import * as XLSX from 'xlsx';

export interface FilaExcel {
  key: number;
  nombre: string;
  contacto: string;
  comision: string; // texto crudo editable; '' = sin comisión
}

export interface FilaValidada extends FilaExcel {
  comisionNum: number | null;
  errores: string[];
}

/** minúsculas, sin tildes, sin signos — para tolerar variantes de encabezado */
function normalizarEncabezado(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();
}

function columnaDe(encabezado: string): 'nombre' | 'contacto' | 'comision' | null {
  const h = normalizarEncabezado(encabezado);
  if (!h) return null;
  if (h === 'nombre' || h === 'operador' || h === 'agencia' || h.includes('nombre')) return 'nombre';
  if (h.includes('contacto') || h.includes('telefono') || h.includes('email') || h.includes('correo')) return 'contacto';
  if (h.includes('comision') || h.includes('porcentaje') || h === '%') return 'comision';
  return null;
}

/** '' → null; "15", "15%", "15,5" → número. NaN si no se puede parsear. */
export function parseComision(raw: unknown): number | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const n = Number(s.replace(/%/g, '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function validar(fila: FilaExcel): FilaValidada {
  const errores: string[] = [];
  const nombre = fila.nombre.trim();
  if (!nombre) errores.push('Falta el nombre');
  const comisionNum = parseComision(fila.comision);
  if (comisionNum !== null && (Number.isNaN(comisionNum) || comisionNum < 0 || comisionNum > 100)) {
    errores.push('Comisión fuera de rango (0–100)');
  }
  return {
    ...fila,
    nombre,
    contacto: fila.contacto.trim(),
    comisionNum: Number.isNaN(comisionNum) ? null : comisionNum,
    errores,
  };
}

let nextKey = 1;

export function parsearArchivo(data: ArrayBuffer | string): { filas: FilaExcel[]; error?: string } {
  // string (CSV leído como texto UTF-8) evita mojibake de tildes
  const wb = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array' });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  if (!hoja) return { filas: [], error: 'El archivo no tiene hojas.' };
  const crudas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' });
  if (crudas.length === 0) return { filas: [], error: 'La primera hoja está vacía.' };

  // Mapeo de columnas por encabezado tolerante
  const mapa = new Map<string, 'nombre' | 'contacto' | 'comision'>();
  for (const enc of Object.keys(crudas[0])) {
    const col = columnaDe(enc);
    if (col && ![...mapa.values()].includes(col)) mapa.set(enc, col);
  }
  if (![...mapa.values()].includes('nombre')) {
    return {
      filas: [],
      error: 'No encontramos la columna «nombre» en la primera fila. Usa la plantilla: nombre, contacto, comision.',
    };
  }

  const filas: FilaExcel[] = [];
  for (const cruda of crudas) {
    const fila: FilaExcel = { key: nextKey++, nombre: '', contacto: '', comision: '' };
    for (const [enc, col] of mapa) {
      const v = String(cruda[enc] ?? '').trim();
      if (col === 'nombre') fila.nombre = v;
      else if (col === 'contacto') fila.contacto = v;
      else fila.comision = v;
    }
    // Ignora filas completamente vacías (sin nombre ni datos)
    if (!fila.nombre && !fila.contacto && !fila.comision) continue;
    filas.push(fila);
  }
  if (filas.length === 0) return { filas: [], error: 'No encontramos filas con datos.' };
  return { filas };
}
