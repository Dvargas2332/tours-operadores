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

/** Tarifa por rango de edad dentro de la fila de revisión editable. */
export interface TarifaRevision {
  minEdad: number;
  maxEdad: number | null;
  rack: string; // string porque se edita inline; se parsea al confirmar
  neta: string; // vacío = no aplica
}

export interface HorarioRevision {
  salida: string; // "07:30"
  llegada: string; // "12:30"
}

export interface FilaRevision {
  key: string;
  operador: string; // nombre del operador (hoja del catálogo)
  moneda: Moneda; // usd | crc
  nombre: string;
  zona: string;
  categoria: Categoria;
  tarifas: TarifaRevision[];
  duracionHoras: string;
  horarios: HorarioRevision[];
  incluye: string[];
  noIncluye: string[];
  minimoPersonas: string;
  aptoNinos: boolean;
  politicaCancelacion: string;
  observaciones: string;
  excluida: boolean;
  advertencias: string[];
}

export type ErroresFila = Partial<Record<'nombre' | 'zona' | 'tarifas' | 'duracion' | 'horarios', string>>;

function tarifaRackValida(t: TarifaRevision): boolean {
  const rack = Number(t.rack);
  return t.rack.trim() !== '' && Number.isFinite(rack) && rack > 0;
}

export function validarFila(f: FilaRevision): ErroresFila {
  const errores: ErroresFila = {};
  if (!f.nombre.trim()) errores.nombre = 'Falta nombre';
  if (!f.zona.trim()) errores.zona = 'Falta zona';

  const validas = f.tarifas.filter(tarifaRackValida);
  if (validas.length === 0) {
    errores.tarifas = 'Al menos una tarifa rack requerida';
  } else {
    for (const t of f.tarifas) {
      if (t.rack.trim() === '') continue;
      const rack = Number(t.rack);
      if (!Number.isFinite(rack) || rack < 0) {
        errores.tarifas = 'Rack inválido';
        break;
      }
      if (t.neta.trim() !== '') {
        const neta = Number(t.neta);
        if (!Number.isFinite(neta) || neta < 0) {
          errores.tarifas = 'Neta inválida';
          break;
        }
      }
      if (!Number.isFinite(t.minEdad) || t.minEdad < 0 || (t.maxEdad != null && (t.maxEdad < t.minEdad || !Number.isFinite(t.maxEdad)))) {
        errores.tarifas = 'Rango de edad inválido';
        break;
      }
    }
  }

  const d = Number(f.duracionHoras);
  if (f.duracionHoras.trim() === '' || !Number.isFinite(d) || d < 0.5 || d > 24) {
    errores.duracion = 'Entre 0.5 y 24 h';
  }
  if (f.horarios.length === 0 || f.horarios.some((h) => !/^\d{2}:\d{2}$/.test(h.salida) || !/^\d{2}:\d{2}$/.test(h.llegada))) {
    errores.horarios = 'Horario requerido (HH:MM)';
  }
  return errores;
}

/** Advertencia (no bloqueante) si la neta supera a la rack — revisar digitación. */
export function advertenciasNeta(f: FilaRevision): string[] {
  const out: string[] = [];
  for (const t of f.tarifas) {
    const rack = Number(t.rack);
    const neta = Number(t.neta);
    if (Number.isFinite(rack) && rack > 0 && Number.isFinite(neta) && neta > rack) {
      const label = t.maxEdad != null ? `${t.minEdad}-${t.maxEdad}` : `+${t.minEdad}`;
      out.push(`Neta mayor que rack en ${label} años — revisar`);
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
    tarifas: [{ minEdad: 12, maxEdad: 64, rack: '', neta: '' }],
    duracionHoras: '',
    horarios: [{ salida: '08:00', llegada: '12:00' }],
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
  const tarifasBackend = f.tarifas
    .filter((t) => t.rack.trim() !== '' && t.rack.trim() !== '0')
    .map((t) => ({
      minEdad: t.minEdad,
      maxEdad: t.maxEdad,
      rack: Number(t.rack),
      neta: t.neta.trim() === '' || t.neta.trim() === '0' ? null : Number(t.neta),
      orden: 0,
    }))
    .sort((a, b) => a.minEdad - b.minEdad);

  const tarifaAdulto = tarifasBackend.find((t) => t.minEdad === 12 && t.maxEdad === 64)
    ?? tarifasBackend.find((t) => t.maxEdad == null || t.maxEdad >= 18)
    ?? tarifasBackend[0];

  const tarifaNino = tarifasBackend.find((t) => t.maxEdad != null && t.maxEdad < 18 && t.minEdad < 12);

  return {
    nombre: f.nombre.trim(),
    zona: f.zona.trim(),
    categoria: f.categoria,
    moneda: f.moneda,
    precioAdulto: tarifaAdulto?.rack ?? Number(f.tarifas[0]?.rack || 0),
    precioNino: tarifaNino?.rack ?? null,
    precioNetoAdulto: tarifaAdulto?.neta ?? null,
    tarifas: tarifasBackend.map((t, i) => ({ ...t, orden: i })),
    precioNetoNino: tarifaNino?.neta ?? null,
    duracionHoras: Number(f.duracionHoras),
    horarios: f.horarios.map((h, i) => ({ horaSalida: h.salida, horaLlegada: h.llegada, orden: i })),
    incluye: f.incluye,
    noIncluye: f.noIncluye,
    minimoPersonas: Math.max(1, Math.round(Number(f.minimoPersonas) || 2)),
    aptoNinos: f.aptoNinos || tarifasBackend.some((t) => t.maxEdad != null && t.maxEdad < 18),
    politicaCancelacion: f.politicaCancelacion,
    observaciones: f.observaciones,
  };
}
