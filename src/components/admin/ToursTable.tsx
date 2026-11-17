/**
 * Tabla "Tours cargados" — tab de Administración (administracion.md §4).
 * Toolbar sticky: búsqueda con debounce 300ms + selects de operador /
 * zona / estado + contador. Ordenable (default: actualización asc),
 * paginación de 25 con controles inferiores.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Edit2, Eye, MapPin, Search, Trash2 } from 'lucide-react';
import FreshnessPill from '@/components/admin/FreshnessPill';
import { Switch } from '@/components/ui/switch';
import SortTh, { useOrdenColumna } from '@/components/admin/SortTh';
import type { OrdenColumna } from '@/components/admin/SortTh';
import { freshness } from '@/data/mock-tours';
import type { Frescura, Operador, Tour } from '@/data/mock-tours';
import { CATEGORIA_META } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const POR_PAGINA = 25;

type ColOrden = 'nombre' | 'operador' | 'estado';

const ORDEN_DEFAULT: OrdenColumna<ColOrden> = { key: 'estado', dir: 'asc' };

const RANGO_ESTADO: Record<Frescura, number> = { danger: 0, warn: 1, ok: 2 };

function comparar(a: Tour, b: Tour, orden: OrdenColumna<ColOrden>): number {
  const dir = orden.dir === 'asc' ? 1 : -1;
  switch (orden.key) {
    case 'nombre':
      return dir * a.nombre.localeCompare(b.nombre, 'es');
    case 'operador':
      return dir * a.operador.nombre.localeCompare(b.operador.nombre, 'es');
    case 'estado':
    default:
      return dir * (RANGO_ESTADO[freshness(a.fecha_actualizacion).estado] - RANGO_ESTADO[freshness(b.fecha_actualizacion).estado]);
  }
}

interface ToursTableProps {
  tours: Tour[];
  operadores: Operador[];
  /** Filtro de operador impuesto desde la tabla de operadores ("Ver tours") */
  filtroOperador: number | null;
  onFiltroOperadorChange: (id: number | null) => void;
  onEditar: (tour: Tour) => void;
  onEliminar: (tour: Tour) => void;
  onToggleActivo: (tour: Tour, activo: boolean) => void;
}

export default function ToursTable({
  tours,
  operadores,
  filtroOperador,
  onFiltroOperadorChange,
  onEditar,
  onEliminar,
  onToggleActivo,
}: ToursTableProps) {
  const navigate = useNavigate();
  const { orden, ciclar } = useOrdenColumna<ColOrden>(ORDEN_DEFAULT);

  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [zona, setZona] = useState('');
  const [estado, setEstado] = useState<'' | Frescura>('');
  const [pagina, setPagina] = useState(1);

  // Debounce 300ms del input de búsqueda
  useEffect(() => {
    const t = window.setTimeout(() => setBusqueda(texto.trim().toLowerCase()), 300);
    return () => window.clearTimeout(t);
  }, [texto]);

  const zonas = useMemo(() => [...new Set(tours.map((t) => t.zona))].sort((a, b) => a.localeCompare(b, 'es')), [tours]);

  const filtrados = useMemo(() => {
    return tours.filter((t) => {
      if (busqueda && !t.nombre.toLowerCase().includes(busqueda)) return false;
      if (filtroOperador != null && t.operador.id !== filtroOperador) return false;
      if (zona && t.zona !== zona) return false;
      if (estado && freshness(t.fecha_actualizacion).estado !== estado) return false;
      return true;
    });
  }, [tours, busqueda, filtroOperador, zona, estado]);

  const ordenados = useMemo(
    () => [...filtrados].sort((a, b) => comparar(a, b, orden ?? ORDEN_DEFAULT)),
    [filtrados, orden],
  );

  // Reinicia paginación al cambiar filtros u orden
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroOperador, zona, estado, orden]);

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = ordenados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const selectClases =
    'h-7 rounded-r-sm border border-border bg-surface px-1.5 text-[12px] text-ink transition-colors duration-fast hover:border-brand focus:border-brand focus:outline-none';

  return (
    <div className="overflow-hidden rounded-r-md border border-border bg-surface shadow-card">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 border-b border-border bg-surface-2/50 px-2 py-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre de tour…"
            className="h-7 w-full rounded-r-sm border border-border bg-surface pl-7 pr-2 text-[12px] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15"
          />
        </div>
        <select
          value={filtroOperador ?? ''}
          onChange={(e) => onFiltroOperadorChange(e.target.value === '' ? null : Number(e.target.value))}
          className={selectClases}
          aria-label="Filtrar por operador"
        >
          <option value="">Todos los operadores</option>
          {operadores.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nombre}
            </option>
          ))}
        </select>
        <select value={zona} onChange={(e) => setZona(e.target.value)} className={selectClases} aria-label="Filtrar por zona">
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as '' | Frescura)}
          className={selectClases}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="ok">Actualizado</option>
          <option value="warn">Revisar</option>
          <option value="danger">Desactualizado</option>
        </select>
        <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-ink-muted tnum" aria-live="polite">
          {ordenados.length} tours
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="divide-x divide-border border-b border-border bg-surface-2/70">
                <th scope="col" className="w-9 px-2 py-1.5 text-center text-label uppercase tracking-wide text-ink-faint tnum">
                  #
                </th>
                <th scope="col" className="w-12 px-2 py-1.5 text-center text-label uppercase tracking-wide text-ink-muted">
                  Activo
                </th>
                <SortTh dense colKey="nombre" label="Tour" orden={orden} onCiclar={ciclar} />
                <SortTh dense colKey="operador" label="Operador" orden={orden} onCiclar={ciclar} className="w-[150px]" />
                <th scope="col" className="w-[120px] px-2 py-1.5 text-label uppercase tracking-wide text-ink-muted">
                  Zona
                </th>
                <th scope="col" className="w-[64px] px-2 py-1.5 text-center text-label uppercase tracking-wide text-ink-muted">
                  Tarifas
                </th>
                <SortTh dense center colKey="estado" label="Estado" orden={orden} onCiclar={ciclar} className="w-[64px]" />
                <th scope="col" className="w-[104px] px-2 py-1.5 text-right text-label uppercase tracking-wide text-ink-muted">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((tour, i) => {
                const frescura = freshness(tour.fecha_actualizacion);
                return (
                  <motion.tr
                    key={tour.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.35), ease: EASE, layout: { duration: 0.2 } }}
                    className={cn(
                      'divide-x divide-border/70 border-b border-border/70 transition-colors duration-fast last:border-0 hover:bg-surface-2',
                      frescura.estado === 'danger' && 'bg-danger/[0.03]',
                    )}
                  >
                    <td className="px-2 py-1.5 text-center text-[11px] text-ink-faint tnum">
                      {(paginaActual - 1) * POR_PAGINA + i + 1}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <Switch
                        checked={tour.activo}
                        onCheckedChange={(v) => onToggleActivo(tour, v)}
                        aria-label={`Activar o desactivar ${tour.nombre}`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={cn(
                            'block max-w-[340px] truncate text-[13px] font-semibold leading-tight',
                            tour.activo ? 'text-ink' : 'text-ink-muted',
                          )}
                          title={tour.nombre}
                        >
                          {tour.nombre}
                        </span>
                        {tour.categorias.map((c) => {
                          const meta = CATEGORIA_META[c];
                          const CatIcon = meta.icon;
                          return (
                            <span
                              key={c}
                              className={cn(
                                'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                                meta.clases,
                              )}
                              title={meta.label}
                            >
                              <CatIcon className="h-2.5 w-2.5" />
                            </span>
                          );
                        })}
                        {!tour.activo && (
                          <span className="shrink-0 rounded-full bg-volcan-soft px-1.5 py-px text-[10px] font-medium text-warn">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-[12px] text-ink-muted">
                      <span className="block truncate" title={tour.operador.nombre}>
                        {tour.operador.nombre}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[12px] text-ink-muted">
                      <span className="flex items-center gap-1 truncate" title={tour.zona}>
                        <MapPin className="h-3 w-3 shrink-0 text-ink-faint" />
                        <span className="truncate">{tour.zona}</span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center text-[13px] text-ink tnum">
                      {tour.tarifas.length || 1}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <FreshnessPill frescura={frescura} compact />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/tour/${tour.id}`)}
                          title="Ver detalle"
                          aria-label={`Ver detalle de ${tour.nombre}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditar(tour)}
                          title="Editar tour"
                          aria-label={`Editar ${tour.nombre}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-brand-soft hover:text-brand"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEliminar(tour)}
                          title="Eliminar tour"
                          aria-label={`Eliminar ${tour.nombre}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-small text-ink-muted">
                    Ningún tour coincide con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-surface-2/40 px-2 py-1.5">
          <span className="text-caption text-ink-muted tnum">
            Mostrando {visibles.length === 0 ? 0 : (paginaActual - 1) * POR_PAGINA + 1}–
            {(paginaActual - 1) * POR_PAGINA + visibles.length} de {ordenados.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaActual <= 1}
              title="Página anterior"
              className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm border border-border bg-surface text-ink transition-colors duration-fast hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              title="Página siguiente"
              className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm border border-border bg-surface text-ink transition-colors duration-fast hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
  );
}
