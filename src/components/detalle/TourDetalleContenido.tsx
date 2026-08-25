/**
 * Contenido completo del detalle de tour (tour-detalle.md §1–§7), compartido
 * por la página completa (/tour/:id) y el drawer de escritorio (≥1280px).
 * Misma información en ambas presentaciones; cambian densidad y acciones.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import {
  AlertTriangle,
  Baby,
  Building2,
  Bus,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileSpreadsheet,
  FileText,
  MapPin,
  Minus,
  Scale,
  StickyNote,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { BadgeCategoria, DOT_FRESCURA, DotFrescura, PopoverOperador } from '@/components/detalle/DetalleUI';
import { buildResumenTour, copiarTexto, labelIncluye } from '@/components/detalle/resumen';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCompare } from '@/context/CompareContext';
import { formatPrecio, freshness, formatDateEs } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { INCLUYE_META, formatDuracion } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const seccion = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

/* Count-up de valores numéricos: solo la primera apertura por sesión
   (tour-detalle.md §2) para no cansar. MotionValue → sin re-renders. */
let conteoYaHecho = false;

function ValorCountUp({ valor, formato }: { valor: number; formato: (n: number) => string }) {
  const mv = useMotionValue(conteoYaHecho ? valor : 0);
  const texto = useTransform(mv, (v) => formato(v));

  useEffect(() => {
    if (conteoYaHecho) {
      mv.set(valor);
      return;
    }
    conteoYaHecho = true;
    const controls = animate(mv, valor, { duration: 0.3, ease: 'easeOut' });
    return () => controls.stop();
  }, [mv, valor]);

  return <motion.span className="tnum">{texto}</motion.span>;
}

/** "08:00" + 3h → "11:00" */
function regresoEstimado(horaSalida: string, duracionHoras: number): string {
  const [h, m] = horaSalida.split(':').map(Number);
  const total = (h * 60 + m + Math.round(duracionHoras * 60)) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function horasTexto(horas: number): string {
  const n = Number.isInteger(horas) ? horas : horas.toFixed(1);
  return `${n} horas`;
}

const OPERA_DIARIO = /todos los d[ií]as|diario|lunes a domingo/i;

function IconBoton({
  label,
  onClick,
  activo = false,
  children,
}: {
  label: string;
  onClick: () => void;
  activo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={activo}
          onClick={onClick}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-r-sm border transition-colors duration-fast',
            activo
              ? 'border-brand bg-brand-soft text-brand'
              : 'border-border bg-surface text-ink-muted hover:border-brand hover:text-brand',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Check con draw-in (path animation 250ms) al entrar al viewport */
function CheckDraw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className}>
      <motion.path
        d="M2 6.2 4.8 9 10 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
    </svg>
  );
}

interface StatCeldaProps {
  icon: React.ElementType;
  caption: string;
  children: React.ReactNode;
  index: number;
}

function StatCelda({ icon: Icon, caption, children, index }: StatCeldaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.15 + index * 0.05 }}
      className="flex items-center gap-3 rounded-r-md bg-surface-2 px-4 py-3.5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="font-display text-xl font-bold leading-tight text-ink">{children}</div>
        <div className="text-caption text-ink-faint">{caption}</div>
      </div>
    </motion.div>
  );
}

export interface TourDetalleContenidoProps {
  tour: Tour;
  variante: 'pagina' | 'drawer';
  /** Header sticky gana sombra cuando el contenedor hizo scroll */
  scrolled?: boolean;
  /** Solo drawer: cierra el panel */
  onCerrar?: () => void;
}

export default function TourDetalleContenido({ tour, variante, scrolled = false, onCerrar }: TourDetalleContenidoProps) {
  const { toggle, estaSeleccionado } = useCompare();
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fresh = freshness(tour.fecha_actualizacion);
  const seleccionado = estaSeleccionado(tour.id);
  const operaDiario = OPERA_DIARIO.test(tour.observaciones);
  const esDrawer = variante === 'drawer';

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Atajo `c`: marca/desmarca comparar (tour-detalle.md §10)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'c' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      toggle(tour.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, tour.id]);

  const copiarResumen = async () => {
    const ok = await copiarTexto(buildResumenTour(tour));
    if (ok) {
      setCopiado(true);
      toast.success('Resumen copiado al portapapeles');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiado(false), 1200);
    } else {
      toast.error('No se pudo copiar el resumen');
    }
  };

  const anioVigencia = tour.fuente.match(/20\d{2}/)?.[0] ?? tour.fecha_actualizacion.slice(0, 4);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* ===== Header (sticky) ===== */}
      <motion.header
        variants={seccion}
        className={cn(
          'sticky top-0 z-20 border-b border-border bg-surface px-5 pb-4 pt-4 transition-shadow duration-200',
          scrolled && 'shadow-card',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <BadgeCategoria tour={tour} />
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-caption font-medium text-ink-muted">
              <MapPin className="h-3 w-3" />
              {tour.zona}
            </span>
            <DotFrescura tour={tour} conLabel />
          </div>
          {/* Acciones del header */}
          <div className="flex shrink-0 items-center gap-1.5">
            <IconBoton
              label={seleccionado ? 'Quitar del comparador' : 'Comparar (tecla C)'}
              activo={seleccionado}
              onClick={() => toggle(tour.id)}
            >
              <Scale className="h-4 w-4" />
            </IconBoton>
            <IconBoton label="Copiar resumen" onClick={copiarResumen}>
              <Copy className="h-4 w-4" />
            </IconBoton>
            {esDrawer && onCerrar && (
              <IconBoton label="Cerrar (Esc)" onClick={onCerrar}>
                <X className="h-4 w-4" />
              </IconBoton>
            )}
          </div>
        </div>

        <h1
          className={cn(
            'mt-3 font-display font-bold leading-[1.15] tracking-[-0.02em] text-ink',
            esDrawer ? 'text-2xl' : 'text-2xl md:text-display',
          )}
        >
          {tour.nombre}
        </h1>

        <div className="mt-2">
          <PopoverOperador operador={tour.operador} tour={tour}>
            <button
              type="button"
              className="group inline-flex items-center gap-1.5 rounded-r-sm text-left transition-colors duration-fast hover:text-brand"
            >
              <Building2 className="h-3.5 w-3.5 text-ink-muted transition-colors duration-fast group-hover:text-brand" />
              <span className="text-[15px] font-semibold text-ink-muted transition-colors duration-fast group-hover:text-brand">
                {tour.operador.nombre}
              </span>
              <span className="text-caption text-ink-faint">Operador</span>
            </button>
          </PopoverOperador>
        </div>
      </motion.header>

      <div className="space-y-6 px-5 py-5">
        {/* ===== Franja de datos clave ===== */}
        <motion.section variants={seccion} aria-label="Datos clave">
          <div className={cn('grid gap-2', esDrawer ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4')}>
            <StatCelda icon={User} caption="rack · adulto" index={0}>
              <ValorCountUp valor={tour.precio_adulto} formato={(v) => formatPrecio(Math.round(v), tour.moneda)} />
            </StatCelda>
            <StatCelda icon={Baby} caption={tour.precio_nino != null ? 'rack · niño' : 'niño no aplica'} index={1}>
              {tour.precio_nino != null ? (
                <ValorCountUp valor={tour.precio_nino} formato={(v) => formatPrecio(Math.round(v), tour.moneda)} />
              ) : (
                '—'
              )}
            </StatCelda>
            <StatCelda icon={Clock} caption="duración total" index={2}>
              <ValorCountUp valor={tour.duracion_horas} formato={(v) => formatDuracion(Math.round(v * 10) / 10)} />
            </StatCelda>
            <StatCelda icon={Bus} caption="hora de salida" index={3}>
              <span className="tnum">{tour.hora_salida}</span>
            </StatCelda>
          </div>

          {/* Badges informativos */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-caption font-medium text-ink-muted">
              <Users className="h-3 w-3" />
              Mín. {tour.minimo_personas} personas
            </span>
            {tour.apto_ninos ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-caption font-medium text-brand">
                <Baby className="h-3 w-3" />
                Apto para niños
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-volcan-soft px-2.5 py-1 text-caption font-medium text-warn">
                <Baby className="h-3 w-3" />
                Solo adultos
              </span>
            )}
            {operaDiario && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-caption font-medium text-ink-muted">
                <CalendarClock className="h-3 w-3" />
                Todos los días
              </span>
            )}
          </div>
        </motion.section>

        {/* ===== Tarifas: rack (público) y neta (uso interno) ===== */}
        <motion.section variants={seccion} aria-label="Tarifas">
          <h2 className="mb-2 text-h3 text-ink">Tarifas</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {/* Rack — precio público */}
            <div className="rounded-r-md border border-border bg-surface p-4">
              <p className="text-label text-ink-muted">Tarifa rack · público</p>
              <div className="mt-2 flex items-baseline gap-4">
                <div>
                  <span className="tnum font-sora text-[24px] font-bold leading-none tracking-tight text-ink">
                    {formatPrecio(tour.precio_adulto, tour.moneda)}
                  </span>
                  <p className="mt-1 text-caption text-ink-faint">adulto</p>
                </div>
                <div>
                  {tour.precio_nino != null ? (
                    <>
                      <span className="tnum font-sora text-[17px] font-semibold leading-none text-ink">
                        {formatPrecio(tour.precio_nino, tour.moneda)}
                      </span>
                      <p className="mt-1 text-caption text-ink-faint">niño</p>
                    </>
                  ) : (
                    <span className="text-caption text-ink-faint">niño no aplica</span>
                  )}
                </div>
              </div>
            </div>
            {/* Neta — costo operador (uso interno) */}
            <div className="rounded-r-md border border-border bg-surface-2 p-4">
              <p className="text-label text-ink-muted">Tarifa neta · uso interno</p>
              <div className="mt-2 flex items-baseline gap-4">
                <div>
                  <span className="tnum font-sora text-[24px] font-bold leading-none tracking-tight text-brand">
                    {formatPrecio(tour.precio_neto_adulto, tour.moneda)}
                  </span>
                  <p className="mt-1 text-caption text-ink-faint">adulto</p>
                </div>
                <div>
                  {tour.precio_neto_nino != null ? (
                    <>
                      <span className="tnum font-sora text-[17px] font-semibold leading-none text-brand">
                        {formatPrecio(tour.precio_neto_nino, tour.moneda)}
                      </span>
                      <p className="mt-1 text-caption text-ink-faint">niño</p>
                    </>
                  ) : (
                    <span className="text-caption text-ink-faint">niño no aplica</span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-caption text-ink-faint">
                Margen por adulto: {formatPrecio(tour.precio_adulto - tour.precio_neto_adulto, tour.moneda)} · No mostrar al huésped
              </p>
            </div>
          </div>
        </motion.section>

        {/* ===== Incluye / No incluye ===== */}
        <motion.section
          variants={seccion}
          className="rounded-r-md border border-border bg-surface p-4"
          aria-label="Qué incluye"
        >
          <div className={cn('grid gap-5', esDrawer ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
            <div>
              <h2 className="flex items-center gap-1.5 text-label uppercase tracking-wide text-ok">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Incluye
              </h2>
              {tour.incluye.length > 0 ? (
                <ul className="mt-3 space-y-2.5">
                  {tour.incluye.map((key, i) => {
                    const meta = INCLUYE_META[key];
                    const Icon = meta?.icon ?? Check;
                    return (
                      <motion.li
                        key={key}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.2, ease: EASE, delay: i * 0.035 }}
                        className="flex items-center gap-2.5"
                      >
                        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                          <Icon className="h-4 w-4" />
                          <CheckDraw className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-surface text-ok" />
                        </span>
                        <span className="text-[15px] text-ink">{labelIncluye(key)}</span>
                      </motion.li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-caption text-ink-faint">Sin especificar en el tarifario</p>
              )}
            </div>
            <div>
              <h2 className="flex items-center gap-1.5 text-label uppercase tracking-wide text-danger">
                <XCircle className="h-3.5 w-3.5" />
                No incluye
              </h2>
              {tour.no_incluye.length > 0 ? (
                <ul className="mt-3 space-y-2.5">
                  {tour.no_incluye.map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.2, ease: EASE, delay: i * 0.035 }}
                      className="flex items-center gap-2.5"
                    >
                      <Minus className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                      <span className="text-[15px] text-ink-muted">{labelIncluye(item)}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-caption text-ink-faint">Sin especificar en el tarifario</p>
              )}
            </div>
          </div>
        </motion.section>

        {/* ===== Horarios y logística ===== */}
        <motion.section
          variants={seccion}
          className="rounded-r-md border border-border bg-surface p-4"
          aria-label="Horarios y logística"
        >
          <h2 className="text-h3 text-ink">Horarios y logística</h2>
          <dl className="mt-3 divide-y divide-border">
            {[
              { label: 'Salida', valor: <span className="tnum text-base">{tour.hora_salida}</span> },
              {
                label: 'Regreso estimado',
                valor: (
                  <>
                    <span className="tnum">{regresoEstimado(tour.hora_salida, tour.duracion_horas)}</span>{' '}
                    <span className="text-caption text-ink-faint">aprox.</span>
                  </>
                ),
              },
              { label: 'Duración total', valor: horasTexto(tour.duracion_horas) },
              {
                label: 'Recojo en hotel',
                valor: tour.incluye.includes('transporte')
                  ? 'Incluido — pasan 30 min antes'
                  : 'Consultar con operador',
              },
              { label: 'Mínimo de personas', valor: <span className="tnum">{tour.minimo_personas}</span> },
              ...(operaDiario ? [{ label: 'Días de operación', valor: 'Lunes a domingo' as React.ReactNode }] : []),
            ].map((fila, i) => (
              <motion.div
                key={fila.label}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.18, ease: EASE, delay: i * 0.03 }}
                className="flex items-baseline gap-4 py-2.5"
              >
                <dt className="w-[120px] shrink-0 text-label text-ink-muted">{fila.label}</dt>
                <dd className="text-[15px] font-semibold text-ink">{fila.valor}</dd>
              </motion.div>
            ))}
          </dl>
        </motion.section>

        {/* ===== Políticas + observaciones ===== */}
        <motion.section variants={seccion} className="space-y-3" aria-label="Políticas y observaciones">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="rounded-r-sm border-l-[3px] border-volcan bg-volcan-soft/50 px-4 py-3.5"
          >
            <h2 className="flex items-center gap-1.5 text-label uppercase tracking-wide text-ink">
              <FileText className="h-3.5 w-3.5 text-volcan" />
              Política de cancelación
            </h2>
            <p className="mt-2 text-[15px] italic leading-relaxed text-ink">“{tour.politica_cancelacion}”</p>
            <p className="mt-2 text-caption text-ink-muted">Texto tal como aparece en el tarifario del operador.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.22, ease: EASE, delay: 0.08 }}
            className="rounded-r-sm border-l-[3px] border-ink-faint bg-surface-2 px-4 py-3.5"
          >
            <h2 className="flex items-center gap-1.5 text-label uppercase tracking-wide text-ink">
              <StickyNote className="h-3.5 w-3.5 text-ink-muted" />
              Observaciones
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">{tour.observaciones}</p>
            <p className="mt-2 text-caption text-ink-muted">Observaciones del operador</p>
          </motion.div>
        </motion.section>

        {/* ===== Procedencia del dato ===== */}
        <motion.section variants={seccion} aria-label="Procedencia del dato">
          {fresh.estado !== 'ok' && (
            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: [0, -2, 2, -1, 1, 0] }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className={cn(
                'mb-3 flex flex-wrap items-center gap-2 rounded-r-sm px-3.5 py-2.5 text-caption font-medium',
                fresh.estado === 'warn' ? 'bg-volcan-soft text-warn' : 'bg-danger/10 text-danger',
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {fresh.estado === 'warn'
                ? 'Este tarifario tiene más de 90 días — considera confirmar el precio.'
                : 'Tarifario desactualizado (>6 meses). Confirma con el operador antes de cotizar al huésped.'}
              {fresh.estado === 'danger' && (
                <PopoverOperador operador={tour.operador} tour={tour}>
                  <button
                    type="button"
                    className="ml-auto h-8 rounded-r-sm border border-border bg-surface px-3 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
                  >
                    Ver contacto del operador
                  </button>
                </PopoverOperador>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="grid gap-3 rounded-r-md bg-surface-2 p-3.5 sm:grid-cols-3"
          >
            <div className="min-w-0">
              <div className="text-caption uppercase tracking-wide text-ink-faint">Fuente</div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-1 flex cursor-default items-center gap-1.5">
                    {/\.(xlsx|xls|csv)$/i.test(tour.fuente) ? (
                      <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    )}
                    <span className="truncate font-mono text-mono text-ink">{tour.fuente}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{tour.fuente}</TooltipContent>
              </Tooltip>
            </div>
            <div>
              <div className="text-caption uppercase tracking-wide text-ink-faint">Actualizado</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT_FRESCURA[fresh.estado])} />
                <span className="text-small font-semibold text-ink tnum">{formatDateEs(tour.fecha_actualizacion)}</span>
              </div>
              <div className="mt-0.5 text-caption text-ink-muted">{fresh.relativo}</div>
            </div>
            <div>
              <div className="text-caption uppercase tracking-wide text-ink-faint">Operador</div>
              <div className="mt-1 text-small font-semibold text-ink">{tour.operador.nombre}</div>
              <div className="mt-0.5 text-caption text-ink-muted">tarifario vigente {anioVigencia}</div>
            </div>
          </motion.div>
        </motion.section>

        {/* ===== Copiar resumen (killer feature) ===== */}
        <motion.section variants={seccion}>
          <motion.button
            type="button"
            onClick={copiarResumen}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-r-sm text-sm font-semibold text-white transition-colors duration-200',
              esDrawer ? 'w-full' : 'w-full sm:w-auto sm:px-8',
              copiado ? 'bg-ok' : 'bg-brand hover:bg-brand-hover',
            )}
          >
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? 'Copiado ✓' : 'Copiar resumen para el huésped'}
          </motion.button>
        </motion.section>

        {/* En página, link discreto de regreso al final */}
        {!esDrawer && (
          <motion.div variants={seccion} className="pb-2 text-center">
            <Link to="/" className="text-small font-medium text-brand hover:underline">
              ← Volver al buscador
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/** Skeleton con la anatomía completa del detalle (tour-detalle.md §9) */
export function TourDetalleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando detalle del tour">
      <div className="border-b border-border px-5 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="shimmer h-5 w-20 rounded-full" />
            <div className="shimmer h-5 w-16 rounded-full" />
            <div className="shimmer h-5 w-24 rounded-full" />
          </div>
          <div className="flex gap-1.5">
            <div className="shimmer h-9 w-9 rounded-r-sm" />
            <div className="shimmer h-9 w-9 rounded-r-sm" />
          </div>
        </div>
        <div className="shimmer mt-3 h-7 w-3/4 rounded-md" />
        <div className="shimmer mt-2 h-4 w-2/5 rounded-md" />
      </div>
      <div className="space-y-6 px-5 py-5">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-[68px] rounded-r-md" />
          ))}
        </div>
        <div className="shimmer h-44 rounded-r-md" />
        <div className="shimmer h-40 rounded-r-md" />
        <div className="shimmer h-24 rounded-r-sm" />
        <div className="shimmer h-20 rounded-r-md" />
        <div className="shimmer h-11 w-full rounded-r-sm" />
      </div>
    </div>
  );
}
