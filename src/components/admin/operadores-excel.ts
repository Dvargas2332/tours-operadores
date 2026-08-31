/**
 * Parseo y validación del Excel/CSV de operadores (Administración →
 * "Agregar operadores (Excel)"). Lógica pura, sin React, para poder probarla.
 * Columnas esperadas (primera hoja): nombre (req.), telefono, email,
 * comision (0–100). También se acepta la columna legacy "contacto".
 * Encabezados tolerantes a variantes en español.
 */
import * as XLSX from 'xlsx';

export interface FilaExcel {
  key: number;
  nombre: string;
  telefono: string;
  email: string;
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

function columnaDe(encabezado: string): 'nombre' | 'telefono' | 'email' | 'contacto' | 'comision' | null {
  const h = normalizarEncabezado(encabezado);
  if (!h) return null;
  if (h === 'nombre' || h === 'operador' || h === 'agencia' || h.includes('nombre')) return 'nombre';
  if (h.includes('telefono') || h.includes('celular') || h === 'tel') return 'telefono';
  if (h.includes('email') || h.includes('correo') || h.includes('e mail') || h === 'mail') return 'email';
  if (h.includes('contacto')) return 'contacto';
  if (h.includes('comision') || h.includes('porcentaje') || h === '%') return 'comision';
  return null;
}

/** Extrae email y teléfono de una cadena legacy tipo "tel · email" o "email". */
function parseContactoLegacy(raw: string): { telefono: string; email: string } {
  const partes = raw.split('·').map((p) => p.trim());
  const email = partes.find((p) => p.includes('@')) ?? '';
  const telefono = partes.find((p) => p && !p.includes('@')) ?? '';
  return { telefono, email };
}

/** '' → null; "15", "15%", "15,5" → número. NaN si no se puede parsear. */
export function parseComision(raw: unknown): number | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const n = Number(s.replace(/%/g, '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validar(fila: FilaExcel): FilaValidada {
  const errores: string[] = [];
  const nombre = fila.nombre.trim();
  if (!nombre) errores.push('Falta el nombre');
  const telefono = fila.telefono.trim();
  const email = fila.email.trim();
  if (email && !EMAIL_RE.test(email)) errores.push('Email inválido');
  const comisionNum = parseComision(fila.comision);
  if (comisionNum !== null && (Number.isNaN(comisionNum) || comisionNum < 0 || comisionNum > 100)) {
    errores.push('Comisión fuera de rango (0–100)');
  }
  return {
    ...fila,
    nombre,
    telefono,
    email,
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
  const mapa = new Map<string, 'nombre' | 'telefono' | 'email' | 'contacto' | 'comision'>();
  for (const enc of Object.keys(crudas[0])) {
    const col = columnaDe(enc);
    if (col && ![...mapa.values()].includes(col)) mapa.set(enc, col);
  }
  if (![...mapa.values()].includes('nombre')) {
    return {
      filas: [],
      error: 'No encontramos la columna «nombre» en la primera fila. Usa la plantilla: nombre, telefono, email, comision.',
    };
  }

  const filas: FilaExcel[] = [];
  for (const cruda of crudas) {
    const fila: FilaExcel = { key: nextKey++, nombre: '', telefono: '', email: '', comision: '' };
    let contactoLegacy = '';
    for (const [enc, col] of mapa) {
      const v = String(cruda[enc] ?? '').trim();
      if (col === 'nombre') fila.nombre = v;
      else if (col === 'telefono') fila.telefono = v;
      else if (col === 'email') fila.email = v;
      else if (col === 'contacto') contactoLegacy = v;
      else fila.comision = v;
    }
    // Si hay columna legacy "contacto", la distribuimos entre teléfono/email
    if (contactoLegacy) {
      const parsed = parseContactoLegacy(contactoLegacy);
      if (!fila.telefono) fila.telefono = parsed.telefono;
      if (!fila.email) fila.email = parsed.email;
    }
    // Ignora filas completamente vacías
    if (!fila.nombre && !fila.telefono && !fila.email && !fila.comision) continue;
    filas.push(fila);
  }
  if (filas.length === 0) return { filas: [], error: 'No encontramos filas con datos.' };
  return { filas };
}
