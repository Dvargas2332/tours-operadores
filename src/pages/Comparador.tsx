/**
 * Página Comparador (`/comparar`) — comparador.md.
 * 3 slots de comparación, modal selector con sugerencia inteligente,
 * tabla fila-por-fila con matriz de incluye y mejor precio (token
 * --accent), copiar comparación y selección persistente (CompareContext).
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ClipboardList, Columns3, Plus, RotateCcw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { BadgeCategoria } from '@/components/detalle/DetalleUI';
import { buildResumenComparacion, copiarTexto } from '@/components/detalle/resumen';
import SelectorTourModal from '@/components/comparador/SelectorTourModal';
import TablaComparativa from '@/components/comparador/TablaComparativa';
import { Switch } from '@/components/ui/switch';
import { MAX_COMPARAR, useCompare } from '@/context/CompareContext';
import { useToursData } from '@/hooks/useToursData';
import type { Tour } from '@/data/mock-tours';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const;

/** Ilustración con respiración sutil — aislada y memoizada (guardrail de performance) */
const IlustracionVacia = memo(function IlustracionVacia() {
  return (
    <motion.img
      src="./empty-compare.svg"
      alt="Dos tarjetas flotando con una balanza equilibrada"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="w-[280px] max-w-full"
    />
  );
});

const Respiracion = memo(function Respiracion() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      animate={{ scale: [1, 1.015, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
});

/** Slot lleno: mini-tarjeta del tour seleccionado */
function SlotLleno({ tour, onQuitar }: { tour: Tour; onQuitar: () => void }) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={SPRING}
      className="relative rounded-r-md border border-border bg-surface p-4 shadow-card"
    >
      <BadgeCategoria tour={tour} />
      <div className="mt-2 line-clamp-2 min-h-[2.6em] text-h3 text-ink">{tour.nombre}</div>
      <div className="mt-0.5 truncate text-small text-ink-muted">{tour.operador.nombre}</div>
      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar ${tour.nombre} de la comparación`}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/** Slot vacío: caja punteada que abre el modal selector */
function SlotVacio({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      layout="position"
      type="button"
      onClick={onClick}
      className="flex h-[120px] w-full flex-col items-center justify-center gap-1.5 rounded-r-md border-2 border-dashed border-border text-ink-faint transition-colors duration-fast hover:border-brand/40 hover:text-ink-muted"
    >
      <Plus className="h-5 w-5" />
      <span className="text-small">Agregar tour</span>
    </motion.button>
  );
}

export default function Comparador() {
  const navigate = useNavigate();
  const data = useToursData();
  const { seleccionados, toggle, quitar, limpiar } = useCompare();

  const [resaltar, setResaltar] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tours = data?.tours ?? [];

  // IDs persistidos que ya no existen en la BD se descartan
  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.tours.map((t) => t.id));
    seleccionados.forEach((id) => {
      if (!ids.has(id)) quitar(id);
    });
  }, [data, seleccionados, quitar]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const seleccionadosTours = useMemo(
    () => seleccionados.map((id) => tours.find((t) => t.id === id)).filter((t): t is Tour => t != null),
    [seleccionados, tours],
  );

  const copiarComparacion = async () => {
    if (seleccionadosTours.length === 0) return;
    const ok = await copiarTexto(buildResumenComparacion(seleccionadosTours));
    if (ok) {
      setCopiado(true);
      toast.success('Comparación copiada');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiado(false), 1200);
    } else {
      toast.error('No se pudo copiar la comparación');
    }
  };

  const elegirDelModal = (id: number) => {
    toggle(id);
    setModalAbierto(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-5 py-5">
        {/* ===== Header de página ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-display text-ink">Comparador de tours</h1>
            <p className="mt-1 text-small text-ink-muted">
              Compara hasta 3 tours lado a lado. Los datos vienen de los tarifarios cargados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex cursor-pointer items-center gap-2.5">
              <Switch checked={resaltar} onCheckedChange={setResaltar} aria-label="Resaltar diferencias" />
              <span className="text-small font-medium text-ink">Resaltar diferencias</span>
            </label>
            <button
              type="button"
              onClick={limpiar}
              disabled={seleccionadosTours.length === 0}
              className="flex h-9 items-center gap-1.5 rounded-r-sm px-2 text-sm font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar selección
            </button>
            <motion.button
              type="button"
              onClick={copiarComparacion}
              disabled={seleccionadosTours.length === 0}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-r-sm border px-3 text-sm font-medium transition-colors duration-200',
                copiado
                  ? 'border-ok bg-ok text-white'
                  : 'border-border bg-surface text-ink hover:border-brand hover:text-brand',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-ink',
              )}
            >
              {copiado ? <Check className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              {copiado ? 'Copiado ✓' : 'Copiar comparación'}
            </motion.button>
          </div>
        </motion.div>

        {/* ===== Contenido ===== */}
        {!data ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer h-[120px] rounded-r-md" />
            ))}
          </div>
        ) : seleccionadosTours.length === 0 ? (
          /* ===== Estado vacío (comparador.md §4) ===== */
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="relative">
              <Respiracion />
              <IlustracionVacia />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.12, ease: EASE }}
              className="mt-6 text-h3 text-ink"
            >
              Selecciona tours para comparar
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.18, ease: EASE }}
              className="mt-2 max-w-md text-small text-ink-muted"
            >
              Marca la casilla “Comparar” en cualquier tarjeta de tour, o agrégalos aquí mismo.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.26, ease: EASE }}
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => navigate('/buscar')}
                className="flex h-10 items-center gap-2 rounded-r-sm bg-brand px-5 text-sm font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]"
              >
                <Search className="h-4 w-4" />
                Ir a buscar
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="flex h-10 items-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-sm font-medium text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
              >
                <Plus className="h-4 w-4" />
                Agregar tours aquí
              </button>
            </motion.div>
          </div>
        ) : (
          <>
            {/* ===== Slots de comparación ===== */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {seleccionadosTours.map((tour) => (
                  <SlotLleno key={tour.id} tour={tour} onQuitar={() => quitar(tour.id)} />
                ))}
                {Array.from({ length: MAX_COMPARAR - seleccionadosTours.length }).map((_, i) => (
                  <SlotVacio key={`vacio-${i}`} onClick={() => setModalAbierto(true)} />
                ))}
              </AnimatePresence>
            </div>

            {/* ===== Tabla comparativa (≥2 tours) ===== */}
            {seleccionadosTours.length >= 2 ? (
              <div className="mt-6">
                <TablaComparativa
                  tours={seleccionadosTours}
                  resaltarDiferencias={resaltar}
                  onQuitar={quitar}
                  onVerDetalle={(id) => navigate(`/tour/${id}`)}
                />
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="mt-6 flex items-center gap-2 rounded-r-md border border-border bg-surface px-4 py-3 text-small text-ink-muted"
              >
                <Columns3 className="h-4 w-4 shrink-0 text-ink-faint" />
                Agrega otro tour para ver la comparación lado a lado.
              </motion.p>
            )}
          </>
        )}
      </div>

      <SelectorTourModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        tours={tours}
        seleccionados={seleccionados}
        onElegir={elegirDelModal}
      />
    </div>
  );
}
