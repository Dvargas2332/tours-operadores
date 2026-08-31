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
import FuenteCell from '@/components/admin/FuenteCell';
import SortTh, { useOrdenColumna } from '@/components/admin/SortTh';
import type { OrdenColumna } from '@/components/admin/SortTh';
import { formatPrecio, freshness } from '@/data/mock-tours';
import type { Frescura, Operador, Tour } from '@/data/mock-tours';
import { CATEGORIA_META } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const POR_PAGINA = 25;

type ColOrden = 'nombre' | 'operador' | 'precio' | 'estado';

const ORDEN_DEFAULT: OrdenColumna<ColOrden> = { key: 'estado', dir: 'asc' };

const RANGO_ESTADO: Record<Frescura, number> = { danger: 0, warn: 1, ok: 2 };

function comparar(a: Tour, b: Tour, orden: OrdenColumna<ColOrden>): number {
  const dir = orden.dir === 'asc' ? 1 : -1;
  switch (orden.key) {
    case 'nombre':
      return dir * a.nombre.localeCompare(b.nombre, 'es');
    case 'operador':
      return dir * a.operador.nombre.localeCompare(b.operador.nombre, 'es');
    case 'precio':
      return dir * (a.precio_adulto - b.precio_adulto);
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
}

export default function ToursTable({
  tours,
  operadores,
  filtroOperador,
  onFiltroOperadorChange,
  onEditar,
  onEliminar,
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
    'h-9 rounded-r-sm border border-border bg-surface px-2 text-small text-ink transition-colors duration-fast hover:border-brand focus:border-brand focus:outline-none';

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 bg-bg px-1 pb-3 pt-1">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre de tour…"
            className="h-9 w-full rounded-r-sm border border-border bg-surface pl-8 pr-3 text-small text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15"
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
        <span className="ml-auto text-caption text-ink-muted tnum" aria-live="polite">
          {ordenados.length} tours
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-r-md border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <SortTh colKey="nombre" label="Tour" orden={orden} onCiclar={ciclar} />
                <SortTh colKey="operador" label="Operador" orden={orden} onCiclar={ciclar} />
                <th scope="col" className="px-3 py-2.5 text-label uppercase tracking-wide text-ink-muted">
                  Zona
                </th>
                <SortTh colKey="precio" label="$ Base" orden={orden} onCiclar={ciclar} className="w-[90px]" />
                <th scope="col" className="w-[80px] px-3 py-2.5 text-label uppercase tracking-wide text-ink-muted">
                  Tarifas
                </th>
                <th scope="col" className="w-[200px] px-3 py-2.5 text-label uppercase tracking-wide text-ink-muted">
                  Fuente
                </th>
                <SortTh colKey="estado" label="Estado" orden={orden} onCiclar={ciclar} className="w-[80px]" />
                <th scope="col" className="w-[90px] px-3 py-2.5 text-label uppercase tracking-wide text-ink-muted">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((tour, i) => {
                const cat = CATEGORIA_META[tour.categoria];
                const frescura = freshness(tour.fecha_actualizacion);
                const CatIcon = cat.icon;
                return (
                  <motion.tr
                    key={tour.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.35), ease: EASE, layout: { duration: 0.2 } }}
                    className={cn(
                      'border-b border-border transition-colors duration-fast last:border-0 hover:bg-surface-2',
                      frescura.estado === 'danger' && 'bg-danger/[0.03]',
                    )}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                            cat.clases,
                          )}
                          title={cat.label}
                        >
                          <CatIcon className="h-3 w-3" />
                        </span>
                        <span className="text-[14px] font-semibold leading-snug text-ink">{tour.nombre}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-small text-ink-muted">{tour.operador.nombre}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1 text-small text-ink-muted">
                        <MapPin className="h-3 w-3 shrink-0 text-ink-faint" />
                        {tour.zona}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[14px] font-medium text-ink tnum">
                      {formatPrecio(tour.tarifas.length ? Math.min(...tour.tarifas.map((t) => t.rack)) : tour.precio_adulto, tour.moneda)}
                    </td>
                    <td className="px-3 py-3 text-[14px] text-ink tnum">
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-caption text-ink-muted">
                        {tour.tarifas.length || 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <FuenteCell fuente={tour.fuente} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <FreshnessPill frescura={frescura} compact />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/tour/${tour.id}`)}
                          title="Ver detalle"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditar(tour)}
                          title="Editar tour"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-brand-soft hover:text-brand"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEliminar(tour)}
                          title="Eliminar tour"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-small text-ink-muted">
                    Ningún tour coincide con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-3 py-2.5">
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm border border-border bg-surface text-ink transition-colors duration-fast hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              title="Página siguiente"
              className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm border border-border bg-surface text-ink transition-colors duration-fast hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
