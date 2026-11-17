/**
 * Envío de la ficha del tour al cliente desde la vista del vendedor.
 * Permite elegir fecha, horario y cantidad de pasajeros; el mensaje y los
 * totales usan siempre la tarifa rack (nunca la neta interna).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Mail,
  MessageCircle,
  Minus,
  Plus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { buildMensajeCliente, calcularLineasPorTarifas, calcularTotal, labelTarifa, type ConteoTarifas } from '@/components/reserva/mensaje-reserva';
import { telefonoDeContacto } from '@/components/detalle/resumen';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatPrecio, horarioLabel, horarioRepresentativo } from '@/data/mock-tours';
import type { Horario, Tour } from '@/data/mock-tours';
import { cn } from '@/lib/utils';
import { precioUnitarioTarifa } from '@/lib/tarifas';
import { tarifasSegunNacionalidad, useI18n } from '@/i18n';

interface EnviarClienteDialogProps {
  tour: Tour;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EnviarClienteDialog({ tour, open, onOpenChange }: EnviarClienteDialogProps) {
  const { esCostaRica } = useI18n();
  const tarifasVisibles = tarifasSegunNacionalidad(tour.tarifas, esCostaRica);
  const [fecha, setFecha] = useState<Date | undefined>();
  const [horario, setHorario] = useState<Horario | undefined>(() => horarioRepresentativo(tour));
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [conteos, setConteos] = useState<ConteoTarifas>(() =>
    Object.fromEntries(tarifasVisibles.map((t) => [t.id, 0])),
  );
  const [nombreCliente, setNombreCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [whatsappCliente, setWhatsappCliente] = useState('');

  useEffect(() => {
    if (!open) return;
    setFecha(undefined);
    setHorario(horarioRepresentativo(tour));
    setConteos(Object.fromEntries(tarifasVisibles.map((t) => [t.id, 0])));
    setNombreCliente('');
    setEmailCliente('');
    setWhatsappCliente('');
    setCalendarioAbierto(false);
  }, [open, tour.id, esCostaRica]);

  const fechaISO = useMemo(() => {
    if (!fecha) return undefined;
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [fecha]);

  const lineas = useMemo(
    () => calcularLineasPorTarifas(tour, conteos, false, fechaISO),
    [tour, conteos, fechaISO],
  );
  const total = useMemo(() => calcularTotal(lineas), [lineas]);
  const totalPersonas = Object.values(conteos).reduce((s, n) => s + n, 0);
  const puedeEnviar = totalPersonas > 0;

  const mensaje = useMemo(
    () =>
      buildMensajeCliente({
        tour,
        fecha,
        horario,
        lineas,
        total,
        nombreCliente: nombreCliente || undefined,
      }),
    [tour, fecha, horario, lineas, total, nombreCliente],
  );

  const hrefEmail = useMemo(() => {
    const email = emailCliente.trim();
    const destino = email.includes('@') ? email : '';
    return `mailto:${destino}?subject=${encodeURIComponent(`Tour: ${tour.nombre}`)}&body=${encodeURIComponent(mensaje)}`;
  }, [emailCliente, mensaje, tour.nombre]);

  const hrefWhatsApp = useMemo(() => {
    const digitos = whatsappCliente.replace(/\D/g, '');
    const telefono = digitos.length >= 8 ? telefonoDeContacto(whatsappCliente) : null;
    return telefono
      ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  }, [whatsappCliente, mensaje]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const cambiarCantidad = (tarifaId: number, delta: number) => {
    setConteos((prev) => ({ ...prev, [tarifaId]: Math.max(0, (prev[tarifaId] ?? 0) + delta) }));
  };

  const avisar = () => {
    if (puedeEnviar) toast.success('Resumen listo para enviar');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border-border bg-surface text-ink sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-h3 text-ink">Enviar al cliente</DialogTitle>
          <DialogDescription className="text-small text-ink-muted">
            Resumen con precios de venta (rack), sin tarifas internas.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="env-nombre">Nombre del cliente</Label>
              <Input
                id="env-nombre"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="env-whatsapp">WhatsApp del cliente</Label>
              <Input
                id="env-whatsapp"
                type="tel"
                value={whatsappCliente}
                onChange={(e) => setWhatsappCliente(e.target.value)}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="env-email">Correo del cliente</Label>
              <Input
                id="env-email"
                type="email"
                value={emailCliente}
                onChange={(e) => setEmailCliente(e.target.value)}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
          </div>

          <section>
            <h3 className="flex items-center gap-2 text-h3 text-ink">
              <CalendarIcon className="h-[18px] w-[18px] text-brand" />
              Fecha y horario
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Popover open={calendarioAbierto} onOpenChange={setCalendarioAbierto}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 items-center gap-2 rounded-r-sm border border-border bg-surface px-3 text-small text-ink transition-colors duration-fast hover:border-brand"
                  >
                    {fecha
                      ? fecha.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Fecha (opcional)'}
                    <ChevronDown className="h-4 w-4 text-ink-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-border bg-surface p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(d) => {
                      setFecha(d);
                      if (d) setCalendarioAbierto(false);
                    }}
                    disabled={(date) => date < hoy}
                    className="rounded-r-md border-0 bg-bg p-3 text-base"
                  />
                </PopoverContent>
              </Popover>
              {fecha && (
                <button
                  type="button"
                  onClick={() => setFecha(undefined)}
                  className="text-caption font-medium text-ink-muted hover:text-ink"
                >
                  Quitar fecha
                </button>
              )}
            </div>
            {tour.horarios.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tour.horarios
                  .slice()
                  .sort((a, b) => a.orden - b.orden)
                  .map((h) => (
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
                      <span className="tnum">{horarioLabel(h)}</span>
                    </button>
                  ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-h3 text-ink">
              <Users className="h-[18px] w-[18px] text-brand" />
              Pasajeros
            </h3>
            <p className="mt-1 text-caption text-ink-muted">Mínimo {tour.minimo_personas} personas para reservar.</p>
            <div className="mt-2 space-y-2">
              {tarifasVisibles
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .map((tarifa) => {
                  const cantidad = conteos[tarifa.id] ?? 0;
                  return (
                    <div
                      key={tarifa.id}
                      className="flex items-center justify-between rounded-r-sm border border-border bg-surface-2 px-3 py-2"
                    >
                      <div>
                        <p className="text-small font-medium text-ink">{labelTarifa(tarifa)}</p>
                        <p className="text-caption text-ink-muted">
                          {formatPrecio(precioUnitarioTarifa(tour, tarifa, false, fechaISO), tour.moneda)} por persona
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(tarifa.id, -1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm border border-border bg-surface text-ink hover:bg-surface-2"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-small tnum">{cantidad}</span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(tarifa.id, 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm border border-border bg-surface text-ink hover:bg-surface-2"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="text-small text-ink-muted">{totalPersonas} persona{totalPersonas === 1 ? '' : 's'}</span>
              <span className="text-h3 text-brand tnum">{formatPrecio(total, tour.moneda)}</span>
            </div>
          </section>
        </div>

        <DialogFooter className="shrink-0 gap-2">
          <a
            href={hrefEmail}
            onClick={avisar}
            aria-disabled={!puedeEnviar}
            className={cn(
              'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-r-sm border border-border bg-surface px-3 text-sm font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand',
              !puedeEnviar && 'pointer-events-none opacity-50',
            )}
          >
            <Mail className="h-4 w-4" />
            Correo
          </a>
          <a
            href={hrefWhatsApp}
            onClick={avisar}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!puedeEnviar}
            className={cn(
              'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-r-sm bg-[#25D366] px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90',
              !puedeEnviar && 'pointer-events-none opacity-50',
            )}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
