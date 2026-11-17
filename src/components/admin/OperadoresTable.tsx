/**
 * Tabla de operadores — tab "Operadores" de Administración
 * (administracion.md §3). Ordenable por columna (default: última
 * actualización ascendente — lo más viejo arriba). Filas rojas con
 * tinte persistente; stagger 30ms + layout al re-ordenar.
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Edit2, Eye, FileText, Trash2, Upload, Download } from 'lucide-react';
import SortTh, { useOrdenColumna } from '@/components/admin/SortTh';
import type { OrdenColumna } from '@/components/admin/SortTh';
import { freshness } from '@/data/mock-tours';
import type { InfoFrescura, Operador } from '@/data/mock-tours';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { abrirPoliza } from '@/lib/polizas';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export interface FilaOperador {
  operador: Operador;
  numTours: number;
  ultimaFecha: string | null;
  frescura: InfoFrescura | null;
}

type ColOrden = 'operador' | 'tours' | 'comision' | 'estado';

const ORDEN_DEFAULT: OrdenColumna<ColOrden> = { key: 'estado', dir: 'asc' };

const RANGO_ESTADO: Record<string, number> = { danger: 0, warn: 1, ok: 2 };

function comparar(a: FilaOperador, b: FilaOperador, orden: OrdenColumna<ColOrden>): number {
  const dir = orden.dir === 'asc' ? 1 : -1;
  switch (orden.key) {
    case 'operador':
      return dir * a.operador.nombre.localeCompare(b.operador.nombre, 'es');
    case 'tours':
      return dir * (a.numTours - b.numTours);
    case 'comision':
      return dir * ((a.operador.comision ?? -1) - (b.operador.comision ?? -1));
    case 'estado':
    default:
      return (
        dir *
        ((a.frescura ? RANGO_ESTADO[a.frescura.estado] : -1) -
          (b.frescura ? RANGO_ESTADO[b.frescura.estado] : -1))
      );
  }
}

interface OperadoresTableProps {
  filas: FilaOperador[];
  onVerTours: (operadorId: number) => void;
  onDescargarMachote: (fila: FilaOperador) => void;
  onEditar: (fila: FilaOperador) => void;
  onEliminar: (fila: FilaOperador) => void;
  onToggleActivo: (operadorId: number, activo: boolean) => void;
}

const BTN_ACCION =
  'inline-flex h-7 w-7 items-center justify-center rounded-r-sm transition-colors duration-fast';
const BTN_GHOST = `${BTN_ACCION} text-ink-muted hover:bg-surface-2 hover:text-ink`;
const BTN_BRAND = `${BTN_ACCION} text-ink-muted hover:bg-brand-soft hover:text-brand`;
const BTN_PELIGRO = `${BTN_ACCION} text-ink-faint hover:bg-danger/10 hover:text-danger`;

export default function OperadoresTable({ filas, onVerTours, onDescargarMachote, onEditar, onEliminar, onToggleActivo }: OperadoresTableProps) {
  const { orden, ciclar } = useOrdenColumna<ColOrden>(ORDEN_DEFAULT);

  const ordenadas = [...filas].sort((a, b) => comparar(a, b, orden ?? ORDEN_DEFAULT));

  return (
    <div className="overflow-hidden rounded-r-md border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="divide-x divide-border border-b border-border bg-surface-2/70">
              <th scope="col" className="w-9 px-2 py-1.5 text-center text-label uppercase tracking-wide text-ink-faint tnum">
                #
              </th>
              <th scope="col" className="w-12 px-2 py-1.5 text-center text-label uppercase tracking-wide text-ink-muted">
                Activo
              </th>
              <SortTh dense colKey="operador" label="Operador" orden={orden} onCiclar={ciclar} />
              <th scope="col" className="w-[124px] px-2 py-1.5 text-label uppercase tracking-wide text-ink-muted">
                Teléfono
              </th>
              <th scope="col" className="w-[210px] px-2 py-1.5 text-label uppercase tracking-wide text-ink-muted">
                Correo
              </th>
              <SortTh dense center colKey="tours" label="Tours" orden={orden} onCiclar={ciclar} className="w-[64px]" />
              <SortTh dense colKey="comision" label="%" orden={orden} onCiclar={ciclar} className="w-[56px]" />
              <th scope="col" className="w-[172px] px-2 py-1.5 text-right text-label uppercase tracking-wide text-ink-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((fila, i) => {
              const { operador } = fila;
              const frescuraFila = fila.frescura ?? (fila.ultimaFecha ? freshness(fila.ultimaFecha) : null);
              return (
                <motion.tr
                  key={operador.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3), ease: EASE, layout: { duration: 0.25 } }}
                  className={cn(
                    'divide-x divide-border/70 border-b border-border/70 transition-colors duration-fast last:border-0 hover:bg-surface-2',
                    frescuraFila?.estado === 'danger' && 'bg-danger/[0.03]',
                  )}
                >
                  <td className="px-2 py-1.5 text-center text-[11px] text-ink-faint tnum">{i + 1}</td>
                  <td className="px-2 py-1.5 text-center">
                    <Switch
                      checked={operador.activo}
                      onCheckedChange={(v) => onToggleActivo(operador.id, v)}
                      aria-label={`Activar o desactivar ${operador.nombre}`}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'block max-w-[240px] truncate text-[13px] font-semibold leading-tight',
                          operador.activo ? 'text-ink' : 'text-ink-muted',
                        )}
                        title={operador.nombre}
                      >
                        {operador.nombre}
                      </span>
                      {!operador.activo && (
                        <span className="shrink-0 rounded-full bg-volcan-soft px-1.5 py-px text-[10px] font-medium text-warn">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-[12px] text-ink-muted">
                    {operador.telefono ? (
                      <span className="block truncate" title={operador.telefono}>
                        {operador.telefono}
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-[12px] text-ink-muted">
                    {operador.email ? (
                      <span className="block truncate" title={operador.email}>
                        {operador.email}
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center text-[13px] font-medium text-ink tnum">{fila.numTours}</td>
                  <td className="px-2 py-1.5 text-[13px] text-ink tnum">
                    {operador.comision != null ? (
                      `${operador.comision}%`
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => onVerTours(operador.id)}
                        title="Ver tours"
                        aria-label={`Ver tours de ${operador.nombre}`}
                        className={BTN_GHOST}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditar(fila)}
                        title="Editar operador"
                        aria-label={`Editar ${operador.nombre}`}
                        className={BTN_BRAND}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        to={`/admin/cargar?operador=${operador.id}`}
                        title="Actualizar tarifario"
                        aria-label={`Actualizar tarifario de ${operador.nombre}`}
                        className={BTN_BRAND}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDescargarMachote(fila)}
                        title="Descargar machote de este operador"
                        aria-label={`Descargar machote de ${operador.nombre}`}
                        className={BTN_BRAND}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {operador.poliza_url && (
                        <button
                          type="button"
                          onClick={() => void abrirPoliza(operador.poliza_url!)}
                          title="Ver póliza de seguro"
                          aria-label={`Ver póliza de ${operador.nombre}`}
                          className={BTN_GHOST}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEliminar(fila)}
                        aria-label={`Eliminar ${operador.nombre}`}
                        title="Eliminar operador y sus tours"
                        className={BTN_PELIGRO}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
