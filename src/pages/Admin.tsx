/**
 * Página: Administración (`/admin`) — administracion.md completo.
 * KPIs con count-up (solo primera visita por sesión), banner de
 * tarifarios desactualizados, tabs pill Operadores / Tours cargados
 * con tablas ordenables (lo más viejo arriba). Datos: fetchTours /
 * fetchOperadores de mock-tours (futuro tRPC, mismas firmas).
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { AlertTriangle, Building2, FileSpreadsheet, MapPinned, Plus, Trash2, Upload, UploadCloud } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AgregarOperadoresModal from '@/components/admin/AgregarOperadoresModal';
import EditarOperadorModal from '@/components/admin/EditarOperadorModal';
import EditarTourModal from '@/components/admin/EditarTourModal';
import OperadoresTable from '@/components/admin/OperadoresTable';
import type { FilaOperador } from '@/components/admin/OperadoresTable';
import ToursTable from '@/components/admin/ToursTable';
import { fetchOperadores, fetchTours, formatDateEs, freshness } from '@/data/mock-tours';
import type { Operador, Tour } from '@/data/mock-tours';
import { useMutation } from '@tanstack/react-query';
import { eliminarOperador, eliminarTour } from '@/data/mutations';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = 'operadores' | 'tours';
type EstadoCarga = 'cargando' | 'error' | 'listo';

/* ------------------------------------------------------------------ */
/* Count-up GSAP (solo primera visita por sesión)                      */
/* ------------------------------------------------------------------ */

const COUNTUP_KEY = 'tourhub-admin-countup';

function primeraVisitaSesion(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.sessionStorage.getItem(COUNTUP_KEY)) return false;
  window.sessionStorage.setItem(COUNTUP_KEY, '1');
  return true;
}

function CountUp({ valor, animar }: { valor: number; animar: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!animar) {
      el.textContent = String(valor);
      return;
    }
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: valor,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = String(Math.round(obj.v));
      },
    });
    return () => {
      tween.kill();
    };
  }, [valor, animar]);

  return (
    <span ref={ref} className="tnum">
      0
    </span>
  );
}

/** Pulso sutil 1↔1.02 cada 3s — KPI "Desactualizados" cuando > 0. Aislado + memo. */
const Pulso = memo(function Pulso({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
});

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

interface KpiProps {
  icon: LucideIcon;
  iconClases: string;
  indice: number;
  valor: React.ReactNode;
  label: string;
  caption: React.ReactNode;
}

function KpiCard({ icon: Icon, iconClases, indice, valor, label, caption }: KpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: indice * 0.06, ease: EASE }}
      className="rounded-r-md border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-[18px] w-[18px]', iconClases)} />
        <span className="text-caption uppercase tracking-wide text-ink-faint">{label}</span>
      </div>
      <div className="mt-2 font-display text-[26px] font-bold leading-none text-ink">{valor}</div>
      <div className="mt-1.5 text-caption text-ink-muted">{caption}</div>
    </motion.div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[108px] rounded-r-md border border-border bg-surface p-4">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer mt-3 h-7 w-14 rounded" />
          <div className="shimmer mt-2 h-3 w-32 rounded" />
        </div>
      ))}
    </div>
  );
}

function TablaSkeleton() {
  return (
    <div className="overflow-hidden rounded-r-md border border-border bg-surface">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
          <div className="shimmer h-4 flex-1 rounded" />
          <div className="shimmer h-4 w-16 rounded" />
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-6 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function Admin() {
  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [tours, setTours] = useState<Tour[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [tab, setTab] = useState<Tab>('operadores');
  const [filtroOperador, setFiltroOperador] = useState<number | null>(null);
  const [modalOperadores, setModalOperadores] = useState(false);
  const [operadorAEditar, setOperadorAEditar] = useState<FilaOperador | null>(null);
  const [tourAEditar, setTourAEditar] = useState<Tour | null>(null);
  const [modalTourOpen, setModalTourOpen] = useState(false);
  const [tourAEliminar, setTourAEliminar] = useState<Tour | null>(null);
  const [operadorAEliminar, setOperadorAEliminar] = useState<FilaOperador | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const tablaRef = useRef<HTMLDivElement>(null);
  const [animarCountUp] = useState(primeraVisitaSesion);

  const cargar = useCallback(() => {
    setEstado('cargando');
    Promise.all([fetchTours(), fetchOperadores()])
      .then(([t, o]) => {
        setTours(t);
        setOperadores(o);
        setEstado('listo');
      })
      .catch(() => setEstado('error'));
  }, []);

  /** Recarga silenciosa (sin skeletons) tras mutaciones */
  const refrescar = useCallback(() => {
    Promise.all([fetchTours(), fetchOperadores()])
      .then(([t, o]) => {
        setTours(t);
        setOperadores(o);
      })
      .catch(() => setEstado('error'));
  }, []);

  const eliminarOperadorMutacion = useMutation({
    mutationFn: (id: number) => eliminarOperador(id),
    onSuccess: () => {
      setOperadorAEliminar(null);
      setErrorEliminar(null);
      refrescar();
    },
    onError: (err) => setErrorEliminar(err.message),
  });

  const eliminarTourMutacion = useMutation({
    mutationFn: (id: number) => eliminarTour(id),
    onSuccess: () => {
      setTourAEliminar(null);
      setErrorEliminar(null);
      refrescar();
    },
    onError: (err) => setErrorEliminar(err.message),
  });

  useEffect(cargar, [cargar]);

  /* ----- Datos derivados ----- */
  const filasOperadores: FilaOperador[] = operadores.map((operador) => {
    const delOperador = tours.filter((t) => t.operador.id === operador.id);
    const ultimaFecha =
      delOperador.length > 0
        ? delOperador.reduce((max, t) => (t.fecha_actualizacion > max ? t.fecha_actualizacion : max), delOperador[0].fecha_actualizacion)
        : null;
    return {
      operador,
      numTours: delOperador.length,
      ultimaFecha,
      frescura: ultimaFecha ? freshness(ultimaFecha) : null,
    };
  });

  const conTarifario = filasOperadores.filter((f) => f.numTours > 0);
  const desactualizados = conTarifario.filter((f) => f.frescura && f.frescura.estado !== 'ok');
  const conMasDe180 = desactualizados.filter((f) => f.frescura!.estado === 'danger');

  const ultimaCargaTour = tours.length > 0
    ? tours.reduce((max, t) => (t.fecha_actualizacion > max.fecha_actualizacion ? t : max), tours[0])
    : null;
  const ultimaCargaFrescura = ultimaCargaTour ? freshness(ultimaCargaTour.fecha_actualizacion) : null;

  const verToursDeOperador = (operadorId: number) => {
    setFiltroOperador(operadorId);
    setTab('tours');
  };

  const irAOperadores = () => {
    setTab('operadores');
    window.setTimeout(() => tablaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  /* ----- Render ----- */
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-display text-ink">Administración</h1>
            <p className="mt-1 text-small text-ink-muted">
              Estado de los tarifarios cargados en la base de datos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOperadores(true)}
              className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-brand px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Agregar operadores
            </button>
            <Link
              to="/admin/cargar"
              className="inline-flex h-10 items-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
            >
              <Upload className="h-4 w-4" />
              Cargar tarifario
            </Link>
            <button
              type="button"
              onClick={() => {
                setTourAEditar(null);
                setModalTourOpen(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-brand px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" />
              Crear tour
            </button>
          </div>
        </div>

        {/* Error */}
        {estado === 'error' && (
          <div className="mt-6 flex items-center gap-3 rounded-r-sm border border-danger/30 bg-danger/[0.08] px-4 py-3">
            <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-danger" />
            <p className="flex-1 text-small text-ink">No pudimos cargar los datos de administración.</p>
            <button
              type="button"
              onClick={cargar}
              className="rounded-r-sm border border-border bg-surface px-3 py-1.5 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Cargando */}
        {estado === 'cargando' && (
          <div className="mt-6 space-y-6">
            <KpiSkeleton />
            <TablaSkeleton />
          </div>
        )}

        {/* BD vacía */}
        {estado === 'listo' && operadores.length === 0 && (
          <div className="mt-10 flex flex-col items-center rounded-r-md border border-border bg-surface px-6 py-14 text-center shadow-card">
            <img src="./upload-drop.svg" alt="" className="h-[180px] w-[240px] object-contain" />
            <h2 className="mt-4 text-h3 text-ink">Aún no hay operadores</h2>
            <p className="mt-2 max-w-[420px] text-small text-ink-muted">
              Empieza agregando tus operadores (manual o desde Excel) con nombre, teléfono, email y comisión.
              Después podrás cargar sus tarifarios.
            </p>
            <button
              type="button"
              onClick={() => setModalOperadores(true)}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-r-sm bg-brand px-5 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Agregar operadores
            </button>
            <Link
              to="/admin/cargar"
              className="mt-3 text-caption font-medium text-ink-muted transition-colors duration-fast hover:text-brand"
            >
              o carga un tarifario directamente
            </Link>
          </div>
        )}

        {/* Contenido */}
        {estado === 'listo' && operadores.length > 0 && (
          <>
            {/* KPIs */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                indice={0}
                icon={Building2}
                iconClases="text-brand"
                label="Operadores"
                valor={<CountUp valor={conTarifario.length} animar={animarCountUp} />}
                caption="con tarifario cargado"
              />
              <KpiCard
                indice={1}
                icon={MapPinned}
                iconClases="text-brand"
                label="Tours"
                valor={<CountUp valor={tours.length} animar={animarCountUp} />}
                caption="en la base de datos"
              />
              <KpiCard
                indice={2}
                icon={UploadCloud}
                iconClases="text-ok"
                label="Última carga"
                valor={
                  ultimaCargaTour ? (
                    <span className="tnum">{formatDateEs(ultimaCargaTour.fecha_actualizacion).replace(/ \d{4}$/, '')}</span>
                  ) : (
                    '—'
                  )
                }
                caption={
                  ultimaCargaTour && ultimaCargaFrescura
                    ? `${ultimaCargaFrescura.relativo} · ${ultimaCargaTour.operador.nombre}`
                    : 'sin cargas'
                }
              />
              <KpiCard
                indice={3}
                icon={AlertTriangle}
                iconClases="text-warn"
                label="Desactualizados"
                valor={
                  desactualizados.length > 0 ? (
                    <Pulso>
                      <CountUp valor={desactualizados.length} animar={animarCountUp} />
                    </Pulso>
                  ) : (
                    <CountUp valor={0} animar={animarCountUp} />
                  )
                }
                caption={
                  conMasDe180.length > 0 ? (
                    <span className="text-danger">{conMasDe180.length} con +6 meses</span>
                  ) : (
                    'tarifarios con +90 días'
                  )
                }
              />
            </div>

            {/* Banner de alerta */}
            {desactualizados.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: conMasDe180.length > 0 ? [0, -2, 2, -2, 2, 0] : 0,
                }}
                transition={{
                  opacity: { duration: 0.25, delay: 0.3, ease: EASE },
                  y: { duration: 0.25, delay: 0.3, ease: EASE },
                  x: { duration: 0.3, delay: 0.6 },
                }}
                className="mt-4 flex flex-wrap items-center gap-3 rounded-r-sm border-l-[3px] border-warn bg-volcan-soft/50 px-4 py-3.5"
              >
                <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-warn" />
                <p className="flex-1 text-[15px] font-semibold leading-snug text-ink">
                  {desactualizados.length}{' '}
                  {desactualizados.length === 1 ? 'operador tiene' : 'operadores tienen'} tarifarios con más de 90
                  días sin actualizar:{' '}
                  <span className="font-normal">
                    {desactualizados
                      .map((f) => `${f.operador.nombre.split(' ')[0]} (${f.frescura!.dias} días)`)
                      .join(', ')}
                    .
                  </span>
                </p>
                <button
                  type="button"
                  onClick={irAOperadores}
                  className="rounded-r-sm border border-border bg-surface px-3 py-1.5 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
                >
                  Ver operadores
                </button>
              </motion.div>
            )}

            {/* Tabs pill */}
            <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-surface-2 p-1">
              {(
                [
                  { id: 'operadores', label: `Operadores (${operadores.length})`, alerta: desactualizados.length > 0 },
                  { id: 'tours', label: `Tours cargados (${tours.length})`, alerta: false },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative flex h-9 items-center gap-1.5 rounded-full px-4 text-caption font-semibold transition-colors duration-fast',
                    tab === t.id ? 'text-ink' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {tab === t.id && (
                    <motion.span
                      layoutId="admin-tab-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-surface shadow-card"
                    />
                  )}
                  <span className="relative">{t.label}</span>
                  {t.alerta && <span className="relative h-2 w-2 rounded-full bg-warn" />}
                </button>
              ))}
            </div>

            {/* Contenido del tab */}
            <div ref={tablaRef} className="mt-4 scroll-mt-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  {tab === 'operadores' ? (
                    <OperadoresTable
                      filas={filasOperadores}
                      onVerTours={verToursDeOperador}
                      onEditar={(fila) => setOperadorAEditar(fila)}
                      onEliminar={(fila) => {
                        setErrorEliminar(null);
                        setOperadorAEliminar(fila);
                      }}
                    />
                  ) : (
                    <ToursTable
                      tours={tours}
                      operadores={operadores}
                      filtroOperador={filtroOperador}
                      onFiltroOperadorChange={setFiltroOperador}
                      onEditar={(tour) => {
                        setTourAEditar(tour);
                        setModalTourOpen(true);
                      }}
                      onEliminar={(tour) => {
                        setErrorEliminar(null);
                        setTourAEliminar(tour);
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Modal: agregar operadores por Excel */}
      <AgregarOperadoresModal
        open={modalOperadores}
        onClose={() => setModalOperadores(false)}
        onGuardado={refrescar}
      />

      {/* Modal: editar operador */}
      <EditarOperadorModal
        operador={operadorAEditar?.operador ?? null}
        open={operadorAEditar != null}
        onClose={() => setOperadorAEditar(null)}
        onGuardado={refrescar}
      />

      {/* Modal: crear / editar tour */}
      <EditarTourModal
        key={tourAEditar?.id ?? 'crear'}
        tour={tourAEditar}
        operadores={operadores}
        open={modalTourOpen}
        onClose={() => {
          setModalTourOpen(false);
          setTourAEditar(null);
        }}
        onGuardado={refrescar}
      />

      {/* Confirmación: eliminar operador + sus tours */}
      <AnimatePresence>
        {operadorAEliminar && (
          <>
            <motion.div
              key="backdrop-eliminar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => !eliminarOperadorMutacion.isPending && setOperadorAEliminar(null)}
              className="fixed inset-0 z-40 bg-[rgba(27,36,30,0.35)]"
              aria-hidden
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[18vh]">
              <motion.div
                role="alertdialog"
                aria-modal="true"
                aria-label={`Eliminar ${operadorAEliminar.operador.nombre}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="pointer-events-auto w-full max-w-[420px] rounded-r-lg border border-border bg-surface p-5 shadow-overlay"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10">
                  <Trash2 className="h-5 w-5 text-danger" />
                </div>
                <h3 className="mt-3 text-h3 text-ink">¿Eliminar {operadorAEliminar.operador.nombre}?</h3>
                <p className="mt-1.5 text-small text-ink-muted">
                  Se eliminarán también sus {operadorAEliminar.numTours}{' '}
                  {operadorAEliminar.numTours === 1 ? 'tour' : 'tours'}. Esta acción no se puede deshacer.
                </p>
                {errorEliminar && (
                  <p className="mt-2 text-caption text-danger">No pudimos eliminar: {errorEliminar}</p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOperadorAEliminar(null)}
                    disabled={eliminarOperadorMutacion.isPending}
                    className="h-10 rounded-r-sm px-4 text-[14px] font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarOperadorMutacion.mutate(operadorAEliminar.operador.id)}
                    disabled={eliminarOperadorMutacion.isPending}
                    className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-danger px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {eliminarOperadorMutacion.isPending ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmación: eliminar tour */}
      <AnimatePresence>
        {tourAEliminar && (
          <>
            <motion.div
              key="backdrop-eliminar-tour"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => !eliminarTourMutacion.isPending && setTourAEliminar(null)}
              className="fixed inset-0 z-40 bg-[rgba(27,36,30,0.35)]"
              aria-hidden
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[18vh]">
              <motion.div
                role="alertdialog"
                aria-modal="true"
                aria-label={`Eliminar ${tourAEliminar.nombre}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="pointer-events-auto w-full max-w-[420px] rounded-r-lg border border-border bg-surface p-5 shadow-overlay"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10">
                  <Trash2 className="h-5 w-5 text-danger" />
                </div>
                <h3 className="mt-3 text-h3 text-ink">¿Eliminar {tourAEliminar.nombre}?</h3>
                <p className="mt-1.5 text-small text-ink-muted">
                  Esta acción elimina el tour de {tourAEliminar.operador.nombre} y no se puede deshacer.
                </p>
                {errorEliminar && (
                  <p className="mt-2 text-caption text-danger">No pudimos eliminar: {errorEliminar}</p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTourAEliminar(null)}
                    disabled={eliminarTourMutacion.isPending}
                    className="h-10 rounded-r-sm px-4 text-[14px] font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarTourMutacion.mutate(tourAEliminar.id)}
                    disabled={eliminarTourMutacion.isPending}
                    className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-danger px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {eliminarTourMutacion.isPending ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
