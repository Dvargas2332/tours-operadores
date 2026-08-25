/**
 * Tabla comparativa fila-por-fila (comparador.md §3) con matriz de
 * "qué incluye", resaltado de mejor precio (token --accent) y modo
 * "resaltar diferencias". En móvil se transforma en acordeones por tour.
 */
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Check, ChevronDown, Copy, MapPin, Minus, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import { BadgeCategoria, DOT_FRESCURA, PopoverOperador } from '@/components/detalle/DetalleUI';
import { buildResumenTour, copiarTexto } from '@/components/detalle/resumen';
import { formatPrecio, freshness, formatDateEs } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { INCLUYE_KEYS, INCLUYE_META, formatDuracion } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ---------- utilidades ---------- */

function todosIguales(valores: unknown[]): boolean {
  return valores.every((v) => v === valores[0]);
}

/** Pill "Mejor precio" con pop spring (comparador.md §3) — token --accent */
function PillMejorPrecio() {
  return (
    <motion.span
      initial={{ scale: 0.7 }}
      animate={{ scale: [0.7, 1.1, 1] }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mt-1 inline-flex items-center gap-1 rounded-full bg-volcan px-2 py-0.5 text-caption font-semibold text-white"
    >
      <Trophy className="h-3 w-3" />
      Mejor precio
    </motion.span>
  );
}

function CheckIncluye() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft">
      <Check className="h-3.5 w-3.5 text-ok" />
    </span>
  );
}

/** Texto Small con "ver más" que expande en línea (política de cancelación) */
function TextoExpandible({ texto, muted = false }: { texto: string; muted?: boolean }) {
  const [expandido, setExpandido] = useState(false);
  const esLargo = texto.length > 140;
  return (
    <div>
      <p className={cn('text-small', muted ? 'text-ink-muted' : 'text-ink', !expandido && esLargo && 'line-clamp-4')}>
        {texto}
      </p>
      {esLargo && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="mt-1 text-caption font-semibold text-brand hover:underline"
        >
          {expandido ? 'ver menos' : 'ver más'}
        </button>
      )}
    </div>
  );
}

/* ---------- modelo de filas ---------- */

interface FilaDef {
  key: string;
  label: string;
  /** Valores serializados para detectar diferencia entre columnas */
  valores: unknown[];
  render: (tour: Tour) => React.ReactNode;
  /** Clase extra por celda (p.ej. mejor precio) */
  claseCelda?: (tour: Tour) => string | undefined;
}

function usarFilas(tours: Tour[]): FilaDef[] {
  return useMemo(() => {
    const mejorAdulto = Math.min(...tours.map((t) => t.precio_adulto));
    const conNino = tours.filter((t) => t.precio_nino != null);
    const mejorNino = conNino.length >= 2 ? Math.min(...conNino.map((t) => t.precio_nino as number)) : null;
    const masCorta = Math.min(...tours.map((t) => t.duracion_horas));
    const hayCortaDistinta = !todosIguales(tours.map((t) => t.duracion_horas));

    const filas: FilaDef[] = [
      {
        key: 'precio-adulto',
        label: 'Tarifa rack adulto',
        valores: tours.map((t) => t.precio_adulto),
        claseCelda: (t) => (t.precio_adulto === mejorAdulto ? 'bg-volcan-soft/60' : undefined),
        render: (t) => (
          <div>
            <span className="font-display text-xl font-bold text-ink tnum">{formatPrecio(t.precio_adulto, t.moneda)}</span>
            {t.precio_adulto === mejorAdulto && <PillMejorPrecio />}
          </div>
        ),
      },
      {
        key: 'precio-nino',
        label: 'Tarifa rack niño',
        valores: tours.map((t) => t.precio_nino),
        claseCelda: (t) =>
          mejorNino != null && t.precio_nino === mejorNino ? 'bg-volcan-soft/60' : undefined,
        render: (t) => (
          <div>
            <span className="font-display text-xl font-bold text-ink tnum">
              {t.precio_nino != null ? formatPrecio(t.precio_nino, t.moneda) : '—'}
            </span>
            {mejorNino != null && t.precio_nino === mejorNino && <PillMejorPrecio />}
          </div>
        ),
      },
      {
        key: 'neta-adulto',
        label: 'Tarifa neta adulto',
        valores: tours.map((t) => t.precio_neto_adulto),
        render: (t) => (
          <div>
            <span className="font-display text-[17px] font-semibold text-brand tnum">
              {formatPrecio(t.precio_neto_adulto, t.moneda)}
            </span>
            <span className="ml-2 text-caption text-ink-faint">
              margen {formatPrecio(t.precio_adulto - t.precio_neto_adulto, t.moneda)}
            </span>
          </div>
        ),
      },
      {
        key: 'neta-nino',
        label: 'Tarifa neta niño',
        valores: tours.map((t) => t.precio_neto_nino),
        render: (t) => (
          <span className="font-display text-[17px] font-semibold text-brand tnum">
            {t.precio_neto_nino != null ? formatPrecio(t.precio_neto_nino, t.moneda) : '—'}
          </span>
        ),
      },
      {
        key: 'duracion',
        label: 'Duración',
        valores: tours.map((t) => t.duracion_horas),
        render: (t) => (
          <div>
            <span className="text-[15px] font-semibold text-ink tnum">{formatDuracion(t.duracion_horas)}</span>
            {hayCortaDistinta && t.duracion_horas === masCorta && (
              <span className="ml-2 text-caption text-ink-muted">más corto</span>
            )}
          </div>
        ),
      },
      {
        key: 'salida',
        label: 'Hora de salida',
        valores: tours.map((t) => t.hora_salida),
        render: (t) => <span className="text-[15px] font-semibold text-ink tnum">{t.hora_salida}</span>,
      },
      {
        key: 'zona',
        label: 'Zona',
        valores: tours.map((t) => t.zona),
        render: (t) => (
          <span className="inline-flex items-center gap-1.5 text-[15px] text-ink">
            <MapPin className="h-3.5 w-3.5 text-ink-muted" />
            {t.zona}
          </span>
        ),
      },
      {
        key: 'operador',
        label: 'Operador',
        valores: tours.map((t) => t.operador.id),
        render: (t) => (
          <PopoverOperador operador={t.operador} tour={t}>
            <button
              type="button"
              className="text-left text-[15px] font-medium text-ink underline decoration-border underline-offset-2 transition-colors duration-fast hover:text-brand"
            >
              {t.operador.nombre}
            </button>
          </PopoverOperador>
        ),
      },
      // Matriz "Qué incluye": una sub-fila por amenidad presente en alguno
      ...INCLUYE_KEYS.filter((key) => tours.some((t) => t.incluye.includes(key))).map(
        (key): FilaDef => ({
          key: `incluye-${key}`,
          label: INCLUYE_META[key].label,
          valores: tours.map((t) => t.incluye.includes(key)),
          render: (t) =>
            t.incluye.includes(key) ? <CheckIncluye /> : <Minus className="h-4 w-4 text-ink-faint" />,
        }),
      ),
      {
        key: 'minimo',
        label: 'Mínimo personas',
        valores: tours.map((t) => t.minimo_personas),
        render: (t) => <span className="text-[15px] font-semibold text-ink tnum">{t.minimo_personas}</span>,
      },
      {
        key: 'apto-ninos',
        label: 'Apto niños',
        valores: tours.map((t) => t.apto_ninos),
        render: (t) =>
          t.apto_ninos ? (
            <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-ink">
              <Baby className="h-4 w-4 text-brand" />
              Sí
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-warn">
              <Baby className="h-4 w-4" />
              No — solo adultos
            </span>
          ),
      },
      {
        key: 'politica',
        label: 'Política de cancelación',
        valores: tours.map((t) => t.politica_cancelacion),
        render: (t) => <TextoExpandible texto={t.politica_cancelacion} />,
      },
      {
        key: 'observaciones',
        label: 'Observaciones',
        valores: tours.map((t) => t.observaciones),
        render: (t) => <TextoExpandible texto={t.observaciones} muted />,
      },
      {
        key: 'actualizado',
        label: 'Actualizado',
        valores: tours.map((t) => freshness(t.fecha_actualizacion).estado),
        render: (t) => {
          const fresh = freshness(t.fecha_actualizacion);
          return (
            <div className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT_FRESCURA[fresh.estado])} />
              <span className="text-small font-medium text-ink tnum">{formatDateEs(t.fecha_actualizacion)}</span>
              <span className="text-caption text-ink-faint">{fresh.relativo}</span>
            </div>
          );
        },
      },
    ];
    return filas;
  }, [tours]);
}

/* ---------- props ---------- */

interface TablaComparativaProps {
  tours: Tour[];
  resaltarDiferencias: boolean;
  onQuitar: (id: number) => void;
  onVerDetalle: (id: number) => void;
}

export default function TablaComparativa({ tours, resaltarDiferencias, onQuitar, onVerDetalle }: TablaComparativaProps) {
  const filas = usarFilas(tours);

  const copiarResumen = async (tour: Tour) => {
    const ok = await copiarTexto(buildResumenTour(tour));
    if (ok) toast.success('Resumen copiado al portapapeles');
    else toast.error('No se pudo copiar el resumen');
  };

  const esDiferente = (fila: FilaDef) => resaltarDiferencias && !todosIguales(fila.valores);

  const filaAcciones: FilaDef = {
    key: 'acciones',
    label: 'Acciones',
    valores: tours.map(() => null),
    render: (t) => (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onVerDetalle(t.id)}
          className="h-9 rounded-r-sm border border-border bg-surface px-3 text-sm font-medium text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
        >
          Ver detalle
        </button>
        <button
          type="button"
          onClick={() => copiarResumen(t)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-r-sm bg-brand px-3 text-sm font-semibold text-white transition-colors duration-fast hover:bg-brand-hover"
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar resumen
        </button>
      </div>
    ),
  };

  const todasLasFilas = [...filas, filaAcciones];

  /* ---------- móvil: acordeones por tour ---------- */
  const acordeones = (
    <div className="space-y-3 md:hidden">
      {tours.map((tour) => (
        <AcordeonTour
          key={tour.id}
          tour={tour}
          filas={todasLasFilas}
          resaltarDiferencias={resaltarDiferencias}
          onQuitar={onQuitar}
        />
      ))}
    </div>
  );

  /* ---------- escritorio/tablet: tabla ---------- */
  const tabla = (
    <motion.div
      layout="position"
      className="hidden overflow-x-auto rounded-r-md border border-border bg-surface shadow-card md:block"
    >
      <table className="w-full min-w-[560px] table-fixed border-collapse">
        <colgroup>
          <col className="w-[160px]" />
          {tours.map((t) => (
            <col key={t.id} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 top-0 z-20 bg-surface-2 px-4 py-3 text-left text-label uppercase tracking-wide text-ink-muted">
              Comparar
            </th>
            {tours.map((tour) => (
              <th key={tour.id} className="sticky top-0 z-10 bg-surface px-4 py-3 text-left align-top shadow-[0_1px_0_var(--border)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <BadgeCategoria tour={tour} />
                    <div className="mt-1.5 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink">
                      {tour.nombre}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuitar(tour.id)}
                    aria-label={`Quitar ${tour.nombre}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {todasLasFilas.map((fila) => {
            const dif = esDiferente(fila);
            return (
              <motion.tr
                key={fila.key}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } },
                }}
                className="group/row border-b border-border last:border-b-0"
              >
                <th
                  scope="row"
                  className={cn(
                    'sticky left-0 z-10 px-4 py-3 text-left align-top text-label font-semibold text-ink-muted transition-colors duration-med',
                    dif ? 'bg-volcan-soft/40 text-ink' : 'bg-surface-2',
                    'group-hover/row:bg-surface-2',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {dif && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-volcan" aria-hidden />}
                    <span className={cn(fila.key.startsWith('incluye-') && 'font-normal normal-case')}>
                      {fila.key.startsWith('incluye-') ? `Incluye: ${fila.label}` : fila.label}
                    </span>
                  </span>
                </th>
                {tours.map((tour) => (
                  <td
                    key={tour.id}
                    className={cn(
                      'px-4 py-3 align-top transition-colors duration-med',
                      fila.claseCelda?.(tour) ?? (dif ? 'bg-volcan-soft/40' : 'bg-surface'),
                      'group-hover/row:bg-surface-2',
                    )}
                  >
                    {fila.render(tour)}
                  </td>
                ))}
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </motion.div>
  );

  return (
    <>
      {tabla}
      {acordeones}
    </>
  );
}

/* ---------- acordeón móvil ---------- */

function AcordeonTour({
  tour,
  filas,
  resaltarDiferencias,
  onQuitar,
}: {
  tour: Tour;
  filas: FilaDef[];
  resaltarDiferencias: boolean;
  onQuitar: (id: number) => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="overflow-hidden rounded-r-md border border-border bg-surface shadow-card">
      <div className="flex items-start gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <BadgeCategoria tour={tour} />
            <div className="mt-1 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink">
              {tour.nombre}
            </div>
            <div className="mt-0.5 text-caption text-ink-faint">
              {tour.operador.nombre} · <span className="tnum">{formatPrecio(tour.precio_adulto, tour.moneda)}</span> adulto
            </div>
          </div>
          <ChevronDown
            className={cn('mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform duration-med', abierto && 'rotate-180')}
          />
        </button>
        <button
          type="button"
          onClick={() => onQuitar(tour.id)}
          aria-label={`Quitar ${tour.nombre}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <dl className="divide-y divide-border border-t border-border">
              {filas.map((fila) => {
                const dif = resaltarDiferencias && !todosIguales(fila.valores);
                return (
                  <div key={fila.key} className={cn('flex gap-4 px-4 py-2.5', dif && 'bg-volcan-soft/40')}>
                    <dt className="w-[120px] shrink-0 pt-0.5 text-label text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        {dif && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-volcan" aria-hidden />}
                        {fila.key.startsWith('incluye-') ? `Incluye: ${fila.label}` : fila.label}
                      </span>
                    </dt>
                    <dd className="min-w-0 flex-1">{fila.render(tour)}</dd>
                  </div>
                );
              })}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
