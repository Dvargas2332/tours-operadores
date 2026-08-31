/**
 * Drawer de reserva que se abre dentro del detalle del tour.
 * El usuario elige fecha y horario, luego indica cuántos pasajeros
 * van de cada tipo (niño, adulto, adulto mayor) y se arma el
 * mensaje de WhatsApp con el desglose y totales.
 */
import { useMemo, useState } from 'react';
import { CalendarIcon, ChevronDown, Clock, MessageCircle, Minus, Plus, Users } from 'lucide-react';
import { buildMensajeReserva, calcularLineasPorTarifas, calcularTotal, labelTarifa, type ConteoTarifas } from '@/components/reserva/mensaje-reserva';
import { telefonoDeContacto, urlWhatsApp } from '@/components/detalle/resumen';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { formatPrecio, horarioRepresentativo } from '@/data/mock-tours';
import type { Tour, Horario } from '@/data/mock-tours';
import { cn } from '@/lib/utils';

interface ReservaDrawerProps {
  tour: Tour;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReservaDrawer({ tour, open, onOpenChange }: ReservaDrawerProps) {
  const [fecha, setFecha] = useState<Date | undefined>();
  const [horario, setHorario] = useState<Horario | undefined>(() => horarioRepresentativo(tour));
  const [conteos, setConteos] = useState<ConteoTarifas>(() => Object.fromEntries(tour.tarifas.map((t) => [t.id, 0])));
  const [nombreCliente, setNombreCliente] = useState('');
  const [hotel, setHotel] = useState('');
  const [notas, setNotas] = useState('');

  const lineas = useMemo(() => calcularLineasPorTarifas(tour, conteos), [tour, conteos]);
  const total = useMemo(() => calcularTotal(lineas), [lineas]);
  const totalPersonas = Object.values(conteos).reduce((s, n) => s + n, 0);

  const telefono = useMemo(
    () => (tour.operador.telefono ? telefonoDeContacto(tour.operador.telefono) : null),
    [tour],
  );
  const hrefWhatsApp = useMemo(() => {
    if (!fecha || !horario || !telefono) return null;
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

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const cambiarCantidad = (tarifaId: number, delta: number) => {
    setConteos((prev) => ({ ...prev, [tarifaId]: Math.max(0, (prev[tarifaId] ?? 0) + delta) }));
  };

  const puedeEnviar = fecha != null && horario != null && totalPersonas >= tour.minimo_personas && hrefWhatsApp != null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-border bg-surface p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-h3 text-ink">Reservar tour</SheetTitle>
              <SheetDescription className="mt-1 text-small text-ink-muted">
                {tour.nombre} · {tour.operador.nombre}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex h-[calc(100%-76px)] flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {/* Fecha */}
            <section>
              <h3 className="flex items-center gap-2 text-h3 text-ink">
                <CalendarIcon className="h-5 w-5 text-brand" />
                Fecha y horario
              </h3>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="mt-3 flex h-11 w-full max-w-[340px] items-center justify-between rounded-r-md border border-border bg-surface px-3 text-left text-small text-ink transition-colors duration-fast hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                  >
                    <span className={cn(fecha ? 'text-ink' : 'text-ink-muted')}>
                      {fecha
                        ? fecha.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                        : 'Seleccionar fecha'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-ink-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-border bg-surface p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={setFecha}
                    disabled={(date) => date < hoy}
                    className="rounded-r-md border-0 bg-bg p-3 text-base"
                    classNames={{
                      day: 'h-10 w-10 text-sm rounded-r-sm',
                      head_cell: 'w-10 text-xs',
                      cell: 'w-10',
                      caption: 'text-base font-semibold mb-3',
                      nav_button: 'h-8 w-8',
                    }}
                  />
                </PopoverContent>
              </Popover>

              {tour.horarios.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-small font-medium text-ink">Horario de salida</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tour.horarios.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHorario(h)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-r-sm border px-3 py-1.5 text-small font-medium transition-colors duration-fast',
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
            </section>

            {/* Pasajeros */}
            <section>
              <h3 className="flex items-center gap-2 text-h3 text-ink">
                <Users className="h-5 w-5 text-brand" />
                Pasajeros
              </h3>
              <p className="mt-1 text-small text-ink-muted">
                Mínimo {tour.minimo_personas} personas en total.
              </p>

              <div className="mt-3 space-y-2">
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

              <div className="mt-3 flex items-center gap-2 text-small font-medium text-ink">
                <Users className="h-4 w-4 text-ink-muted" />
                {totalPersonas} persona{totalPersonas === 1 ? '' : 's'}
                {totalPersonas > 0 && totalPersonas < tour.minimo_personas && (
                  <span className="text-caption text-danger">
                    (mín. {tour.minimo_personas})
                  </span>
                )}
              </div>
            </section>

            {/* Datos del huésped */}
            <section className="space-y-3">
              <h3 className="text-h3 text-ink">Datos de la reserva</h3>
              <div>
                <Label htmlFor="nombre-reserva">Nombre del cliente</Label>
                <Input
                  id="nombre-reserva"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Opcional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hotel-reserva">Hotel / alojamiento</Label>
                <Input
                  id="hotel-reserva"
                  value={hotel}
                  onChange={(e) => setHotel(e.target.value)}
                  placeholder="Opcional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notas-reserva">Notas adicionales</Label>
                <Input
                  id="notas-reserva"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Opcional"
                  className="mt-1"
                />
              </div>
            </section>

            {/* Resumen */}
            <section className="rounded-r-md border border-border bg-surface-2 p-4">
              <h3 className="text-h3 text-ink">Resumen</h3>
              {lineas.length === 0 ? (
                <p className="mt-2 text-small text-ink-muted">No se han agregado pasajeros.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {lineas.map((l) => (
                    <li key={l.edad} className="flex justify-between text-small text-ink">
                      <span>
                        {l.edad}: {l.cantidad} × {formatPrecio(l.rack, tour.moneda)}
                      </span>
                      <span className="tnum font-medium">{formatPrecio(l.totalRack, tour.moneda)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-h3 text-ink">Total estimado</span>
                <span className="text-h3 text-brand tnum">{formatPrecio(total, tour.moneda)}</span>
              </div>
            </section>
          </div>

          {/* Footer fijo */}
          <div className="border-t border-border bg-surface p-4">
            {hrefWhatsApp ? (
              <a
                href={hrefWhatsApp}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'flex h-12 w-full items-center justify-center gap-2 rounded-r-sm text-sm font-semibold text-white transition-opacity',
                  puedeEnviar ? 'bg-[#25D366] hover:opacity-90' : 'cursor-not-allowed bg-ink-faint/60',
                )}
                onClick={(e) => {
                  if (!puedeEnviar) e.preventDefault();
                }}
              >
                <MessageCircle className="h-5 w-5" />
                {puedeEnviar ? 'Enviar por WhatsApp' : 'Completar fecha y pasajeros'}
              </a>
            ) : (
              <span className="flex h-12 w-full items-center justify-center rounded-r-sm bg-ink-faint/60 text-sm font-semibold text-white">
                Operador sin teléfono
              </span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
