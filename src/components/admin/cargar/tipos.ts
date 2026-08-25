/**
 * Tipos y helpers compartidos del wizard "Cargar tarifario"
 * (cargar-tarifario.md). Incluye la fila de revisión editable, las
 * validaciones del paso 3 y la conversión a input del backend.
 */
import type { Categoria, Moneda } from '@/data/mock-tours';

export interface ArchivoSubido {
  nombre: string;
  tamano: number; // bytes
  ext: string;
}

export type MetodoExtraccion = 'excel' | 'pdf' | 'imagen' | 'word';

export function metodoDeArchivo(archivo: ArchivoSubido): MetodoExtraccion {
  if (['xlsx', 'xls', 'csv'].includes(archivo.ext)) return 'excel';
  if (archivo.ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(archivo.ext)) return 'word';
  return 'imagen';
}

export interface FilaRevision {
  key: string;
  operador: string; // nombre del operador (hoja del catálogo)
  moneda: Moneda; // usd | crc
  nombre: string;
  zona: string;
  categoria: Categoria;
  precioAdulto: string; // tarifa RACK (público) — se edita como texto; se valida/parsea al confirmar
  precioNino: string; // rack niño — vacío permitido = "no aplica"
  precioNetoAdulto: string; // tarifa NETA (uso interno) — requerida
  precioNetoNino: string; // neta niño — vacío permitido
  duracionHoras: string;
  horaSalida: string; // "07:30"
  incluye: string[];
  noIncluye: string[];
  minimoPersonas: string;
  aptoNinos: boolean;
  politicaCancelacion: string;
  observaciones: string;
  excluida: boolean;
  advertencias: string[];
}

export type ErroresFila = Partial<Record<'nombre' | 'zona' | 'precioAdulto' | 'precioNino' | 'precioNetoAdulto' | 'precioNetoNino' | 'duracion' | 'salida', string>>;

export function validarFila(f: FilaRevision): ErroresFila {
  const errores: ErroresFila = {};
  if (!f.nombre.trim()) errores.nombre = 'Falta nombre';
  if (!f.zona.trim()) errores.zona = 'Falta zona';

  const pa = Number(f.precioAdulto);
  if (f.precioAdulto.trim() === '' || !Number.isFinite(pa) || pa <= 0) {
    errores.precioAdulto = 'Precio requerido, mayor que 0';
  }
  if (f.precioNino.trim() !== '') {
    const pn = Number(f.precioNino);
    if (!Number.isFinite(pn) || pn <= 0) errores.precioNino = 'Precio inválido';
  }
  const pna = Number(f.precioNetoAdulto);
  if (f.precioNetoAdulto.trim() === '' || !Number.isFinite(pna) || pna <= 0) {
    errores.precioNetoAdulto = 'Neta requerida, mayor que 0';
  }
  if (f.precioNetoNino.trim() !== '') {
    const pnn = Number(f.precioNetoNino);
    if (!Number.isFinite(pnn) || pnn <= 0) errores.precioNetoNino = 'Neta inválida';
  }
  const d = Number(f.duracionHoras);
  if (f.duracionHoras.trim() === '' || !Number.isFinite(d) || d < 0.5 || d > 24) {
    errores.duracion = 'Entre 0.5 y 24 h';
  }
  if (!/^\d{2}:\d{2}$/.test(f.horaSalida)) errores.salida = 'Hora requerida';
  return errores;
}

/** Advertencia (no bloqueante) si la neta supera a la rack — revisar digitación. */
export function advertenciasNeta(f: FilaRevision): string[] {
  const out: string[] = [];
  const pa = Number(f.precioAdulto);
  const pna = Number(f.precioNetoAdulto);
  if (Number.isFinite(pa) && pa > 0 && Number.isFinite(pna) && pna > pa) {
    out.push('Neta adulto mayor que la rack — revisar');
  }
  if (f.precioNino.trim() !== '' && f.precioNetoNino.trim() !== '') {
    const pn = Number(f.precioNino);
    const pnn = Number(f.precioNetoNino);
    if (Number.isFinite(pn) && Number.isFinite(pnn) && pnn > pn) {
      out.push('Neta niño mayor que la rack — revisar');
    }
  }
  return out;
}

export function contarErrores(filas: FilaRevision[]): number {
  return filas.filter((f) => !f.excluida && Object.keys(validarFila(f)).length > 0).length;
}

let secuencia = 0;
export function nuevaKey(): string {
  secuencia += 1;
  return `fila-${Date.now()}-${secuencia}`;
}

export function filaVacia(operador = '', moneda: Moneda = 'usd'): FilaRevision {
  return {
    key: nuevaKey(),
    operador,
    moneda,
    nombre: '',
    zona: 'Arenal',
    categoria: 'aventura',
    precioAdulto: '',
    precioNino: '',
    precioNetoAdulto: '',
    precioNetoNino: '',
    duracionHoras: '',
    horaSalida: '08:00',
    incluye: [],
    noIncluye: [],
    minimoPersonas: '2',
    aptoNinos: true,
    politicaCancelacion: '',
    observaciones: '',
    excluida: false,
    advertencias: [],
  };
}

/** Zonas base conocidas (se extienden con las zonas del lote y "+ nueva zona"). */
export const ZONAS_BASE = ['Arenal', 'Caño Negro', 'La Fortuna centro', 'Río Celeste / Tenorio', 'Sarapiquí'];

export const EXTENSIONES_OK = ['xlsx', 'xls', 'csv', 'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
export const MAX_BYTES = 20 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Convierte el lote confirmado al input zod de `tours.cargarTarifario` (api/tours.ts). */
export function filaAInput(f: FilaRevision) {
  return {
    nombre: f.nombre.trim(),
    zona: f.zona.trim(),
    categoria: f.categoria,
    moneda: f.moneda,
    precioAdulto: Number(f.precioAdulto),
    precioNino: f.precioNino.trim() === '' ? null : Number(f.precioNino),
    precioNetoAdulto: Number(f.precioNetoAdulto),
    precioNetoNino: f.precioNetoNino.trim() === '' ? null : Number(f.precioNetoNino),
    duracionHoras: Number(f.duracionHoras),
    horaSalida: f.horaSalida,
    incluye: f.incluye,
    noIncluye: f.noIncluye,
    minimoPersonas: Math.max(1, Math.round(Number(f.minimoPersonas) || 2)),
    aptoNinos: f.aptoNinos,
    politicaCancelacion: f.politicaCancelacion,
    observaciones: f.observaciones,
  };
}
