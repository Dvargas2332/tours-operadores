/**
 * Temporadas de precio por fecha. Se guardan en tablas nuevas y nunca
 * modifican las tarifas base ni los tours existentes.
 */
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { differenceInCalendarDays } from 'date-fns';
import { CalendarDays, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { labelTarifa } from '@/components/reserva/mensaje-reserva';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateEs } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { crearTemporada, eliminarTemporada, fetchTemporadas } from '@/data/temporadas';

interface TemporadasModalProps {
  tour: Tour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TemporadasModal({ tour, open, onOpenChange }: TemporadasModalProps) {
  const [temporadas, setTemporadas] = useState<Tour['temporadas']>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [rango, setRango] = useState<DateRange | undefined>();
  const [precios, setPrecios] = useState<Record<number, { rack: string; neta: string }>>({});

  const tarifasBase = useMemo(
    () => (tour ? tour.tarifas.slice().sort((a, b) => a.orden - b.orden) : []),
    [tour],
  );

  const preciosBase = useMemo(() => {
    return Object.fromEntries(
      tarifasBase.map((t) => [
        t.id,
        { rack: String(t.rack), neta: t.neta != null ? String(t.neta) : '' },
      ]),
    ) as Record<number, { rack: string; neta: string }>;
  }, [tarifasBase]);

  useEffect(() => {
    if (!open || !tour) return;
    setNombre('');
    setRango(undefined);
    setPrecios(preciosBase);
    setError(null);
    setCargando(true);
    fetchTemporadas(tour.id)
      .then(setTemporadas)
      .catch((err) => setError((err as Error)?.message ?? 'No se pudieron cargar las temporadas.'))
      .finally(() => setCargando(false));
  }, [open, tour, preciosBase]);

  const dias = useMemo(() => {
    if (!rango?.from || !rango?.to) return 0;
    return differenceInCalendarDays(rango.to, rango.from) + 1;
  }, [rango]);

  const limpiarFormulario = () => {
    setNombre('');
    setRango(undefined);
    setPrecios(preciosBase);
    setError(null);
  };

  const guardar = async () => {
    if (!tour) return;
    setError(null);
    if (!rango?.from || !rango?.to) {
      setError('Elegí el día de inicio y el día de fin en el calendario.');
      return;
    }
    const tarifas = tarifasBase
      .map((t) => {
        const p = precios[t.id] ?? preciosBase[t.id];
        const rack = Number(p?.rack);
        if (!Number.isFinite(rack) || rack <= 0) return null;
        const netaTexto = p?.neta?.trim();
        return {
          tarifa_id: t.id,
          rack,
          neta: netaTexto ? Number(netaTexto) : null,
        };
      })
      .filter((t): t is { tarifa_id: number; rack: number; neta: number | null } => t != null);

    if (tarifas.length === 0) {
      setError('Cargá al menos un precio rack.');
      return;
    }

    setGuardando(true);
    try {
      const nueva = await crearTemporada(tour.id, {
        nombre: nombre.trim() || 'Temporada',
        desde: isoLocal(rango.from),
        hasta: isoLocal(rango.to),
        prioridad: 0,
        tarifas,
      });
      setTemporadas((prev) => [...prev, nueva].sort((a, b) => a.fecha_desde.localeCompare(b.fecha_desde)));
      limpiarFormulario();
      toast.success('Temporada guardada');
    } catch (err) {
      setError((err as Error)?.message ?? 'No se pudo guardar la temporada.');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (id: number, nombreTemporada: string) => {
    if (!window.confirm(`¿Eliminar la temporada "${nombreTemporada}"? Esta acción no modifica las tarifas base.`)) {
      return;
    }
    try {
      await eliminarTemporada(id);
      setTemporadas((prev) => prev.filter((t) => t.id !== id));
      toast.success('Temporada eliminada');
    } catch (err) {
      setError((err as Error)?.message ?? 'No se pudo eliminar la temporada.');
    }
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const desde = rango?.from ? formatDateEs(isoLocal(rango.from)) : '—';
  const hasta = rango?.to ? formatDateEs(isoLocal(rango.to)) : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden border-border bg-surface text-ink sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-h3 text-ink">Tarifas por fecha</DialogTitle>
          <DialogDescription className="text-small text-ink-muted">
            Elegí un rango y poné el precio de cada tarifa. Las temporadas sobrescriben el precio en esas fechas sin modificar el tour ni sus tarifas base.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
          <section>
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-h3 text-ink">
                <CalendarDays className="h-[18px] w-[18px] text-brand" />
                Temporadas guardadas
              </h3>
              <span className="text-caption text-ink-muted">{temporadas.length}</span>
            </div>

            {cargando ? (
              <div className="mt-3 flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : temporadas.length === 0 ? (
              <div className="mt-2 rounded-r-sm border border-dashed border-border bg-surface-2 px-3 py-3 text-small text-ink-muted">
                Todavía no hay temporadas. Creá la primera con el formulario de abajo.
              </div>
            ) : (
              <div className="mt-2 overflow-hidden rounded-r-sm border border-border">
                {temporadas.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-surface px-3 py-2 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-small font-semibold text-ink">{t.nombre}</p>
                      <p className="text-caption text-ink-muted tnum">
                        {formatDateEs(t.fecha_desde)} → {formatDateEs(t.fecha_hasta)}
                        <span className="ml-2 text-ink-faint">· {t.tarifas.length} tarifa{t.tarifas.length === 1 ? '' : 's'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void borrar(t.id, t.nombre)}
                      aria-label={`Eliminar ${t.nombre}`}
                      title="Eliminar temporada"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-r-sm text-danger transition-colors duration-fast hover:bg-danger/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-r-md border border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-h3 text-ink">Nueva temporada</h3>
              <button
                type="button"
                onClick={limpiarFormulario}
                className="inline-flex items-center gap-1.5 text-caption font-medium text-ink-muted transition-colors duration-fast hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar
              </button>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
              <div>
                <Label>Rango de fechas</Label>
                <div className="mt-1 rounded-r-md border border-border bg-surface p-2">
                  <Calendar
                    mode="range"
                    selected={rango}
                    onSelect={(next) => {
                      setRango(next);
                      setError(null);
                    }}
                    disabled={(date) => date < hoy}
                    numberOfMonths={1}
                    className="w-full [--cell-size:--spacing(10)]"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-caption text-ink-muted">
                  <span>{dias > 0 ? `${dias} día${dias === 1 ? '' : 's'} seleccionado${dias === 1 ? '' : 's'}` : 'Tocá el día de inicio y luego el de fin.'}</span>
                  {(rango?.from || rango?.to) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRango(undefined);
                        setError(null);
                      }}
                      className="shrink-0 font-medium text-ink-muted hover:text-ink"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="temporada-nombre">Nombre</Label>
                  <Input
                    id="temporada-nombre"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      setError(null);
                    }}
                    placeholder="Ej: Temporada alta"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-r-sm border border-border bg-surface px-3 py-2">
                    <p className="text-label uppercase tracking-wide text-ink-muted">Desde</p>
                    <p className="mt-0.5 text-small font-medium text-ink tnum">{desde}</p>
                  </div>
                  <div className="rounded-r-sm border border-border bg-surface px-3 py-2">
                    <p className="text-label uppercase tracking-wide text-ink-muted">Hasta</p>
                    <p className="mt-0.5 text-small font-medium text-ink tnum">{hasta}</p>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Label>Precios por tarifa</Label>
                    <span className="text-caption text-ink-muted">La neta es opcional</span>
                  </div>
                  <div className="mt-1.5 overflow-hidden rounded-r-sm border border-border bg-surface">
                    <div className="grid grid-cols-[minmax(0,1fr)_82px_82px] gap-2 border-b border-border bg-surface-2 px-3 py-1.5 text-label uppercase tracking-wide text-ink-muted">
                      <span>Tarifa</span>
                      <span>Rack</span>
                      <span>Neta</span>
                    </div>
                    {tarifasBase.map((t) => {
                      const p = precios[t.id] ?? preciosBase[t.id];
                      return (
                        <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_82px_82px] items-center gap-2 border-b border-border px-3 py-1.5 last:border-b-0">
                          <span className="truncate text-small text-ink">{labelTarifa(t)}</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={p?.rack ?? ''}
                            aria-label={`Rack ${labelTarifa(t)}`}
                            onChange={(e) =>
                              setPrecios((prev) => ({
                                ...prev,
                                [t.id]: { rack: e.target.value, neta: prev[t.id]?.neta ?? p?.neta ?? '' },
                              }))
                            }
                            className="h-8 px-2 text-right tnum"
                          />
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={p?.neta ?? ''}
                            aria-label={`Neta ${labelTarifa(t)}`}
                            onChange={(e) =>
                              setPrecios((prev) => ({
                                ...prev,
                                [t.id]: { rack: prev[t.id]?.rack ?? p?.rack ?? '', neta: e.target.value },
                              }))
                            }
                            placeholder="—"
                            className="h-8 px-2 text-right tnum"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-caption text-ink-muted">Si dejás la neta vacía, se usa la neta base del tour.</p>
                </div>

                {error && (
                  <p role="alert" className="rounded-r-sm bg-danger/10 px-3 py-2 text-caption text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void guardar()}
                  disabled={guardando || tarifasBase.length === 0}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-r-sm bg-brand px-4 text-small font-semibold text-white transition-colors duration-fast hover:bg-brand-hover disabled:opacity-50"
                >
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {guardando ? 'Guardando…' : 'Agregar temporada'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
