/**
 * Tabla de operadores — tab "Operadores" de Administración
 * (administracion.md §3). Ordenable por columna (default: última
 * actualización ascendente — lo más viejo arriba). Filas rojas con
 * tinte persistente; stagger 30ms + layout al re-ordenar.
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Eye, Phone, Trash2, Upload } from 'lucide-react';
import FreshnessPill from '@/components/admin/FreshnessPill';
import SortTh, { useOrdenColumna } from '@/components/admin/SortTh';
import type { OrdenColumna } from '@/components/admin/SortTh';
import { formatDateEs, freshness } from '@/data/mock-tours';
import type { InfoFrescura, Operador } from '@/data/mock-tours';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export interface FilaOperador {
  operador: Operador;
  numTours: number;
  ultimaFecha: string | null;
  frescura: InfoFrescura | null;
}

type ColOrden = 'operador' | 'tours' | 'comision' | 'ultima' | 'estado';

const ORDEN_DEFAULT: OrdenColumna<ColOrden> = { key: 'ultima', dir: 'asc' };

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
      return (
        dir *
        ((a.frescura ? RANGO_ESTADO[a.frescura.estado] : -1) -
          (b.frescura ? RANGO_ESTADO[b.frescura.estado] : -1))
      );
    case 'ultima':
    default:
      // null = sin tarifario: se considera lo más viejo (primero en asc)
      return dir * ((a.ultimaFecha ?? '').localeCompare(b.ultimaFecha ?? ''));
  }
}

interface OperadoresTableProps {
  filas: FilaOperador[];
  onVerTours: (operadorId: number) => void;
  onEliminar: (fila: FilaOperador) => void;
}

export default function OperadoresTable({ filas, onVerTours, onEliminar }: OperadoresTableProps) {
  const { orden, ciclar } = useOrdenColumna<ColOrden>(ORDEN_DEFAULT);

  const ordenadas = [...filas].sort((a, b) => comparar(a, b, orden ?? ORDEN_DEFAULT));

  return (
    <div className="overflow-hidden rounded-r-md border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <SortTh colKey="operador" label="Operador" orden={orden} onCiclar={ciclar} />
              <SortTh colKey="tours" label="Tours" orden={orden} onCiclar={ciclar} center className="w-[90px]" />
              <SortTh colKey="comision" label="Comisión" orden={orden} onCiclar={ciclar} className="w-[110px]" />
              <SortTh colKey="ultima" label="Última actualización" orden={orden} onCiclar={ciclar} className="w-[200px]" />
              <SortTh colKey="estado" label="Estado" orden={orden} onCiclar={ciclar} className="w-[150px]" />
              <th scope="col" className="w-[250px] px-3 py-2.5 text-label uppercase tracking-wide text-ink-muted">
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
                    'border-b border-border transition-colors duration-fast last:border-0 hover:bg-surface-2',
                    frescuraFila?.estado === 'danger' && 'bg-danger/[0.03]',
                  )}
                >
                  <td className="px-3 py-3">
                    <div className="text-[15px] font-semibold leading-snug text-ink">{operador.nombre}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-caption text-ink-faint">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{operador.contacto}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="text-[15px] font-medium text-ink tnum">{fila.numTours}</div>
                    <div className="text-caption text-ink-faint">tours</div>
                  </td>
                  <td className="px-3 py-3">
                    {operador.comision != null ? (
                      <>
                        <div className="text-[15px] font-medium text-ink tnum">{operador.comision}%</div>
                        <div className="text-caption text-ink-faint">uso interno</div>
                      </>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {fila.ultimaFecha && fila.frescura ? (
                      <>
                        <div className="text-[14px] font-medium text-ink tnum">
                          {formatDateEs(fila.ultimaFecha)}
                        </div>
                        <div className="text-caption text-ink-muted">{fila.frescura.relativo}</div>
                      </>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {frescuraFila ? (
                      <FreshnessPill frescura={frescuraFila} />
                    ) : (
                      <span className="text-caption text-ink-faint">Sin tarifario</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onVerTours(operador.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-r-sm px-2 text-caption font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver tours
                      </button>
                      <Link
                        to={`/admin/cargar?operador=${operador.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-r-sm border border-border bg-surface px-2.5 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Actualizar
                      </Link>
                      <button
                        type="button"
                        onClick={() => onEliminar(fila)}
                        aria-label={`Eliminar ${operador.nombre}`}
                        title="Eliminar operador y sus tours"
                        className="flex h-8 w-8 items-center justify-center rounded-r-sm text-ink-faint transition-colors duration-fast hover:bg-danger/10 hover:text-danger"
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
