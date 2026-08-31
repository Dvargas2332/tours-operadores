/**
 * Página de reserva: wizard de fecha → personas → resumen → WhatsApp.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Clock, MessageCircle, Minus, Plus, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { buildMensajeReserva, calcularLineasPorTarifas, calcularTotal, labelTarifa, type ConteoTarifas } from '@/components/reserva/mensaje-reserva';
import { telefonoDeContacto, urlWhatsApp } from '@/components/detalle/resumen';
import { fetchTourById, formatPrecio, horarioRepresentativo } from '@/data/mock-tours';
import type { Horario } from '@/data/mock-tours';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Paso {
  label: string;
  descripcion: string;
}

const PASOS: Paso[] = [
  { label: 'Fecha', descripcion: 'Elige el día' },
  { label: 'Personas', descripcion: 'Cantidad y edades' },
  { label: 'Resumen', descripcion: 'Verifica y envía' },
];

function StepperReserva({ paso }: { paso: number }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      {PASOS.map((p, i) => {
        const activo = i + 1 === paso;
        const completado = i + 1 < paso;
        return (
          <div key={p.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-caption font-semibold',
                  activo
                    ? 'border-brand bg-brand text-white'
                    : completado
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-border bg-surface text-ink-muted',
                )}
              >
                {completado ? '✓' : i + 1}
              </div>
              <span className={cn('mt-1 text-caption', activo ? 'text-ink' : 'text-ink-muted')}>{p.label}</span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={cn('mx-2 h-[2px] flex-1 rounded-full', completado ? 'bg-brand' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Reservar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [direccion, setDireccion] = useState(1);
  const [tour, setTour] = useState<Awaited<ReturnType<typeof fetchTourById>>>(undefined);
  const [cargando, setCargando] = useState(true);

  const [fecha, setFecha] = useState<Date | undefined>();
  const [horario, setHorario] = useState<Horario | undefined>();
  const [conteos, setConteos] = useState<ConteoTarifas>({});
  const [nombreCliente, setNombreCliente] = useState('');
  const [hotel, setHotel] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    fetchTourById(Number(id)).then((t) => {
      setTour(t);
      setCargando(false);
      if (t) {
        setConteos(Object.fromEntries(t.tarifas.map((tar) => [tar.id, 0])));
        setHorario(horarioRepresentativo(t));
      }
    });
  }, [id]);

  const irAPaso = (n: number) => {
    setDireccion(n > paso ? 1 : -1);
    setPaso(n);
  };

  const lineas = useMemo(() => (tour ? calcularLineasPorTarifas(tour, conteos) : []), [tour, conteos]);
  const total = useMemo(() => calcularTotal(lineas), [lineas]);
  const totalPersonas = useMemo(() => Object.values(conteos).reduce((s, n) => s + n, 0), [conteos]);

  const telefono = useMemo(() => (tour?.operador.telefono ? telefonoDeContacto(tour.operador.telefono) : null), [tour]);
  const hrefWhatsApp = useMemo(() => {
    if (!tour || !fecha || !horario || !telefono) return null;
    const mensaje = buildMensajeReserva({
      tour,
      fecha,
      horario,
      lineas,
      total,
      nombreCliente: nombreCliente || undefined,
      hotel: hotel || undefined,
      notas: notas || undefined,
    });
    return urlWhatsApp(telefono, mensaje);
  }, [tour, fecha, horario, telefono, lineas, total, nombreCliente, hotel, notas]);

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h2 className="text-h2 text-ink">Tour no encontrado</h2>
        <button
          type="button"
          onClick={() => navigate('/buscar')}
          className="mt-4 inline-flex items-center gap-2 rounded-r-sm bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a buscar
        </button>
      </div>
    );
  }

  const cambiarCantidad = (tarifaId: number, delta: number) => {
    setConteos((prev) => ({ ...prev, [tarifaId]: Math.max(0, (prev[tarifaId] ?? 0) + delta) }));
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[720px] px-4 py-6 md:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-r-sm px-2 py-1.5 text-caption font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <h1 className="mt-4 text-display text-ink">Reservar tour</h1>
        <p className="text-small text-ink-muted">{tour.nombre} · {tour.operador.nombre}</p>

        <div className="mt-6 rounded-r-md border border-border bg-surface p-5 shadow-card">
          <StepperReserva paso={paso} />

          <AnimatePresence mode="wait" initial={false} custom={direccion}>
            <motion.div
              key={paso}
              custom={direccion}
              initial={{ opacity: 0, x: 24 * direccion }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * direccion }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {paso === 1 && (
                <div>
                  <h2 className="text-h3 text-ink">¿Qué día querés hacer el tour?</h2>
                  <div className="mt-4 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={setFecha}
                      disabled={(date) => date < hoy}
                      className="rounded-r-md border border-border"
                    />
                  </div>

                  {tour.horarios.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-h3 text-ink">¿A qué horario querés salir?</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tour.horarios.map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setHorario(h)}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-r-sm border px-4 py-2 text-small font-medium transition-colors duration-fast',
                              horario?.id === h.id
                                ? 'border-brand bg-brand-soft text-brand'
                                : 'border-border bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink',
                            )}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span className="tnum">{h.hora_salida}</span>
                            <span className="text-ink-faint">→</span>
                            <span className="tnum">{h.hora_llegada}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={!fecha || !horario}
                      onClick={() => irAPaso(2)}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-r-sm px-5 text-sm font-semibold text-white',
                        !fecha || !horario ? 'cursor-not-allowed bg-ink-faint/60' : 'bg-brand hover:bg-brand-hover',
                      )}
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {paso === 2 && (
                <div>
                  <h2 className="text-h3 text-ink">¿Cuántas personas van?</h2>
                  <p className="mt-1 text-small text-ink-muted">
                    Mínimo {tour.minimo_personas} personas en total.
                  </p>

                  <div className="mt-4 space-y-3">
                    {tour.tarifas
                      .slice()
                      .sort((a, b) => a.orden - b.orden)
                      .map((tarifa) => {
                        const cantidad = conteos[tarifa.id] ?? 0;
                        return (
                          <div
                            key={tarifa.id}
                            className="flex items-center justify-between rounded-r-sm border border-border bg-surface-2 px-4 py-3"
                          >
                            <div>
                              <p className="font-medium text-ink">{labelTarifa(tarifa)}</p>
                              <p className="text-caption text-ink-muted">
                                {formatPrecio(tarifa.rack, tour.moneda)} por persona
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(tarifa.id, -1)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm border border-border bg-surface text-ink hover:bg-surface-2"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-6 text-center tnum">{cantidad}</span>
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(tarifa.id, 1)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm border border-border bg-surface text-ink hover:bg-surface-2"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-caption text-ink-muted">
                    <Users className="h-4 w-4" />
                    {totalPersonas} persona{totalPersonas === 1 ? '' : 's'} seleccionada{totalPersonas === 1 ? '' : 's'}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => irAPaso(1)}
                      className="inline-flex h-10 items-center gap-2 rounded-r-sm px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </button>
                    <button
                      type="button"
                      disabled={totalPersonas < tour.minimo_personas}
                      onClick={() => irAPaso(3)}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-r-sm px-5 text-sm font-semibold text-white',
                        totalPersonas < tour.minimo_personas ? 'cursor-not-allowed bg-ink-faint/60' : 'bg-brand hover:bg-brand-hover',
                      )}
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {paso === 3 && (
                <div>
                  <h2 className="text-h3 text-ink">Resumen de la reserva</h2>

                  <div className="mt-4 space-y-4 rounded-r-md border border-border bg-surface-2 p-4">
                    <div>
                      <p className="text-caption text-ink-muted">Tour</p>
                      <p className="font-medium text-ink">{tour.nombre}</p>
                      <p className="text-small text-ink-muted">{tour.operador.nombre}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-caption text-ink-muted">Fecha</p>
                      <p className="font-medium text-ink">
                        {fecha ? fecha.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-caption text-ink-muted">Personas</p>
                      {lineas.length === 0 ? (
                        <p className="text-small text-ink-muted">No se seleccionaron personas.</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {lineas.map((l) => (
                            <li key={l.edad} className="flex justify-between text-small text-ink">
                              <span>{l.edad}: {l.cantidad} × {formatPrecio(l.rack, tour.moneda)}</span>
                              <span className="tnum font-medium">{formatPrecio(l.totalRack, tour.moneda)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-h3 text-ink">Total estimado</span>
                      <span className="text-h3 text-brand tnum">{formatPrecio(total, tour.moneda)}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="nombre">Nombre del cliente</Label>
                      <Input id="nombre" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Opcional" />
                    </div>
                    <div>
                      <Label htmlFor="hotel">Hotel / alojamiento</Label>
                      <Input id="hotel" value={hotel} onChange={(e) => setHotel(e.target.value)} placeholder="Opcional" />
                    </div>
                    <div>
                      <Label htmlFor="notas">Notas adicionales</Label>
                      <Input id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => irAPaso(2)}
                      className="inline-flex h-10 items-center gap-2 rounded-r-sm px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </button>
                    {hrefWhatsApp ? (
                      <a
                        href={hrefWhatsApp}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-[#25D366] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        <MessageCircle className="h-5 w-5" />
                        Enviar por WhatsApp
                      </a>
                    ) : (
                      <span className="inline-flex h-10 items-center rounded-r-sm bg-ink-faint/60 px-5 text-sm font-semibold text-white">
                        Operador sin teléfono
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
