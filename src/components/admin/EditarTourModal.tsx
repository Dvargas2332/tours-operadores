/**
 * Modal para editar un tour existente: datos generales, incluye/no incluye
 * y tarifas por tipo de pasajero (niño, adulto, adulto mayor).
 */
import { useState } from 'react';
import { Check, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/providers/trpc';
import type { Categoria, Moneda, Operador, Tour } from '@/data/mock-tours';
import { CATEGORIA_META, CATEGORIAS, INCLUYE_KEYS, INCLUYE_META } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

interface TarifaForm {
  id?: number;
  nombre: string;
  min_edad: number;
  max_edad: number | null;
  rack: string;
  neta: string;
}

interface HorarioForm {
  id?: number;
  hora_salida: string;
  hora_llegada: string;
}

interface EditarTourModalProps {
  tour: Tour | null;
  operadores?: Operador[];
  open: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

let idTemp = 0;

function tarifasIniciales(tour: Tour | null): TarifaForm[] {
  if (!tour) {
    return [{ nombre: '', min_edad: 12, max_edad: 64, rack: '', neta: '' }];
  }
  if (tour.tarifas.length) {
    return tour.tarifas
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((t) => ({
        id: t.id,
        nombre: t.nombre ?? '',
        min_edad: t.min_edad,
        max_edad: t.max_edad,
        rack: String(t.rack),
        neta: t.neta != null ? String(t.neta) : '',
      }));
  }
  return [{
    nombre: '',
    min_edad: 12,
    max_edad: 64,
    rack: String(tour.precio_adulto),
    neta: tour.precio_neto_adulto != null ? String(tour.precio_neto_adulto) : '',
  }];
}

export default function EditarTourModal({ tour, operadores = [], open, onClose, onGuardado }: EditarTourModalProps) {
  const esCrear = tour === null;

  const [nombre, setNombre] = useState(() => tour?.nombre ?? '');
  const [zona, setZona] = useState(() => tour?.zona ?? '');
  const [categoria, setCategoria] = useState<Categoria>(() => tour?.categoria ?? 'aventura');
  const [moneda, setMoneda] = useState<Moneda>(() => tour?.moneda ?? 'usd');
  const [duracion, setDuracion] = useState(() => (tour ? String(tour.duracion_horas) : ''));
  const [horarios, setHorarios] = useState<HorarioForm[]>(() =>
    tour?.horarios.length
      ? tour.horarios.slice().sort((a, b) => a.orden - b.orden).map((h) => ({ id: h.id, hora_salida: h.hora_salida, hora_llegada: h.hora_llegada }))
      : [{ hora_salida: '08:00', hora_llegada: '12:00' }],
  );
  const [minimoPersonas, setMinimoPersonas] = useState(() => (tour ? String(tour.minimo_personas) : '2'));
  const [aptoNinos, setAptoNinos] = useState(() => tour?.apto_ninos ?? true);
  const [observaciones, setObservaciones] = useState(() => tour?.observaciones ?? '');
  const [incluye, setIncluye] = useState<string[]>(() => tour?.incluye ?? []);
  const [tarifas, setTarifas] = useState<TarifaForm[]>(() => tarifasIniciales(tour));
  const [operadorId, setOperadorId] = useState<number | ''>(() => tour?.operador.id ?? operadores[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutacionActualizar = trpc.tours.actualizarTour.useMutation({
    onSuccess: () => {
      onGuardado();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const mutacionCrear = trpc.tours.crearTour.useMutation({
    onSuccess: () => {
      onGuardado();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const actualizarTarifa = (idx: number, patch: Partial<TarifaForm>) => {
    setTarifas((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const agregarTarifa = () => {
    idTemp -= 1;
    const ultima = tarifas[tarifas.length - 1];
    const siguienteMin = ultima?.max_edad != null ? ultima.max_edad + 1 : (ultima?.min_edad ?? 11) + 1;
    setTarifas((prev) => [...prev, { id: idTemp, nombre: '', min_edad: siguienteMin, max_edad: null, rack: '', neta: '' }]);
  };

  const eliminarTarifa = (idx: number) => {
    setTarifas((prev) => prev.filter((_, i) => i !== idx));
  };

  const actualizarHorario = (idx: number, patch: Partial<HorarioForm>) => {
    setHorarios((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  };

  const agregarHorario = () => {
    idTemp -= 1;
    const ultimo = horarios[horarios.length - 1];
    setHorarios((prev) => [
      ...prev,
      { id: idTemp, hora_salida: ultimo?.hora_salida ?? '08:00', hora_llegada: ultimo?.hora_llegada ?? '12:00' },
    ]);
  };

  const eliminarHorario = (idx: number) => {
    setHorarios((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const toggleIncluye = (key: string) => {
    setIncluye((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const guardar = () => {
    setError(null);

    if (!nombre.trim() || !zona.trim()) {
      setError('Nombre y zona son obligatorios');
      return;
    }

    if (esCrear && operadorId === '') {
      setError('Seleccioná un operador');
      return;
    }

    const duracionNum = Number(duracion);
    if (!Number.isFinite(duracionNum) || duracionNum <= 0) {
      setError('Duración inválida');
      return;
    }

    for (let i = 0; i < horarios.length; i++) {
      const h = horarios[i];
      if (!/^\d{2}:\d{2}$/.test(h.hora_salida) || !/^\d{2}:\d{2}$/.test(h.hora_llegada)) {
        setError(`Horario ${i + 1} inválido (HH:MM)`);
        return;
      }
      if (h.hora_salida >= h.hora_llegada) {
        setError(`En el horario ${i + 1} la salida debe ser antes de la llegada`);
        return;
      }
    }

    const minimoNum = Number(minimoPersonas);
    if (!Number.isFinite(minimoNum) || minimoNum < 1) {
      setError('Mínimo de personas inválido');
      return;
    }

    for (let i = 0; i < tarifas.length; i++) {
      const t = tarifas[i];
      if (!Number.isFinite(t.min_edad) || t.min_edad < 0) {
        setError(`Edad mínima inválida en tarifa ${i + 1}`);
        return;
      }
      if (t.max_edad != null && (t.max_edad < t.min_edad || !Number.isFinite(t.max_edad))) {
        setError(`El rango de edad es inválido en tarifa ${i + 1}`);
        return;
      }
    }

    const tarifasBackend = tarifas
      .map((t, i) => ({
        nombre: t.nombre.trim(),
        minEdad: t.min_edad,
        maxEdad: t.max_edad,
        rack: Number(t.rack.trim()),
        neta: t.neta.trim() === '' ? null : Number(t.neta),
        horaDesde: null as string | null,
        horaHasta: null as string | null,
        orden: i,
      }))
      .filter((t) => Number.isFinite(t.rack) && t.rack > 0)
      .sort((a, b) => a.minEdad - b.minEdad);

    if (tarifasBackend.length === 0) {
      setError('Agregá al menos una tarifa rack válida');
      return;
    }

    const tarifaAdulto = tarifasBackend.find((t) => t.minEdad === 12 && t.maxEdad === 64)
      ?? tarifasBackend.slice().sort((a, b) => a.rack - b.rack)[0];

    const payload = {
      nombre: nombre.trim(),
      zona: zona.trim(),
      categoria,
      moneda,
      precioAdulto: tarifaAdulto.rack,
      precioNetoAdulto: tarifaAdulto.neta,
      tarifas: tarifasBackend,
      duracionHoras: duracionNum,
      horarios: horarios.map((h, i) => ({ horaSalida: h.hora_salida, horaLlegada: h.hora_llegada, orden: i })),
      incluye,
      noIncluye: [] as string[],
      minimoPersonas: minimoNum,
      aptoNinos,
      observaciones,
    };

    if (esCrear) {
      mutacionCrear.mutate({ ...payload, operadorId: Number(operadorId) });
    } else if (tour) {
      mutacionActualizar.mutate({ id: tour.id, operadorId: Number(operadorId), ...payload });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-surface text-ink sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-h3 text-ink">{esCrear ? 'Crear tour' : 'Editar tour'}</DialogTitle>
          <DialogDescription className="text-small text-ink-muted">
            {esCrear
              ? 'Completá los datos del nuevo tour, incluye y tarifas por edad.'
              : 'Modificá los datos del tour, incluye y tarifas por edad.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Datos generales */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="t-operador">Operador</Label>
              <select
                id="t-operador"
                value={operadorId}
                onChange={(e) => setOperadorId(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-r-sm border border-border bg-surface px-2 text-small text-ink focus:border-brand focus:outline-none"
              >
                <option value="" disabled>
                  Elegir operador…
                </option>
                {operadores.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="t-nombre">Nombre del tour</Label>
              <Input id="t-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="t-zona">Zona</Label>
              <Input id="t-zona" value={zona} onChange={(e) => setZona(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="t-categoria">Categoría</Label>
              <select
                id="t-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Categoria)}
                className="mt-1 h-10 w-full rounded-r-sm border border-border bg-surface px-2 text-small text-ink focus:border-brand focus:outline-none"
              >
                {CATEGORIAS.map((c) => {
                  const meta = CATEGORIA_META[c];
                  return (
                    <option key={c} value={c}>
                      {meta.label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <Label htmlFor="t-moneda">Moneda</Label>
              <select
                id="t-moneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as Moneda)}
                className="mt-1 h-10 w-full rounded-r-sm border border-border bg-surface px-2 text-small text-ink focus:border-brand focus:outline-none"
              >
                <option value="usd">USD ($)</option>
                <option value="crc">CRC (₡)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="t-duracion">Duración (horas)</Label>
              <Input id="t-duracion" type="number" min={0.5} step={0.5} value={duracion} onChange={(e) => setDuracion(e.target.value)} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <Label>Horarios de salida / llegada</Label>
                <button
                  type="button"
                  onClick={agregarHorario}
                  className="inline-flex items-center gap-1 rounded-r-sm px-2 py-1 text-caption font-semibold text-brand transition-colors duration-fast hover:bg-brand-soft"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar horario
                </button>
              </div>
              <div className="space-y-2">
                {horarios.map((h, idx) => (
                  <div key={h.id ?? idx} className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-r-sm border border-border bg-surface px-3 py-2">
                      <Input
                        value={h.hora_salida}
                        onChange={(e) => actualizarHorario(idx, { hora_salida: e.target.value })}
                        placeholder="HH:MM"
                        className="w-24 tnum"
                      />
                      <span className="text-ink-muted">→</span>
                      <Input
                        value={h.hora_llegada}
                        onChange={(e) => actualizarHorario(idx, { hora_llegada: e.target.value })}
                        placeholder="HH:MM"
                        className="w-24 tnum"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarHorario(idx)}
                      disabled={horarios.length <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="t-minimo">Mínimo personas</Label>
              <Input id="t-minimo" type="number" min={1} value={minimoPersonas} onChange={(e) => setMinimoPersonas(e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2.5">
                <Switch checked={aptoNinos} onCheckedChange={setAptoNinos} />
                <span className="text-small font-medium text-ink">Apto para niños</span>
              </label>
            </div>
          </div>

          {/* Incluye */}
          <div>
            <Label>Incluye</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INCLUYE_KEYS.map((key) => {
                const meta = INCLUYE_META[key];
                const marcado = incluye.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleIncluye(key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium transition-colors duration-fast',
                      marcado ? 'bg-brand text-white' : 'border border-border bg-surface text-ink-muted hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-[4px] border',
                        marcado ? 'border-white bg-white text-brand' : 'border-ink-muted',
                      )}
                    >
                      {marcado && <Check className="h-3 w-3" />}
                    </span>
                    <meta.icon className="h-3 w-3" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <Label htmlFor="t-observaciones">Observaciones</Label>
            <textarea
              id="t-observaciones"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="mt-1 w-full rounded-r-sm border border-border bg-surface px-3 py-2 text-small text-ink focus:border-brand focus:outline-none"
            />
          </div>

          {/* Tarifas por pasajero */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <Label>Tarifas por pasajero</Label>
                <p className="text-small text-ink-muted">
                  Nombre, rango de edad y precios. Agregá todas las que apliquen.
                </p>
              </div>
              <button
                type="button"
                onClick={agregarTarifa}
                className="inline-flex items-center gap-1 rounded-r-sm px-2 py-1 text-caption font-semibold text-brand transition-colors duration-fast hover:bg-brand-soft"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar tarifa
              </button>
            </div>
            <div className="space-y-2">
              {tarifas.map((t, idx) => (
                <div
                  key={t.id ?? idx}
                  className="grid grid-cols-[1fr_70px_70px_1fr_1fr_auto] items-center gap-2 rounded-r-sm border border-border p-2"
                >
                  <Input
                    type="text"
                    value={t.nombre}
                    onChange={(e) => actualizarTarifa(idx, { nombre: e.target.value })}
                    placeholder="Ej: Niños 5-10"
                    className="text-small"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={t.min_edad}
                    onChange={(e) => actualizarTarifa(idx, { min_edad: Number(e.target.value) })}
                    placeholder="Min"
                    className="tnum"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={t.max_edad ?? ''}
                    onChange={(e) =>
                      actualizarTarifa(idx, { max_edad: e.target.value === '' ? null : Number(e.target.value) })
                    }
                    placeholder="Max"
                    className="tnum"
                  />
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-small text-ink-faint">
                      {moneda === 'crc' ? '₡' : '$'}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={t.rack}
                      onChange={(e) => actualizarTarifa(idx, { rack: e.target.value })}
                      placeholder="Rack"
                      className="pl-5 tnum"
                    />
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-small text-ink-faint">
                      {moneda === 'crc' ? '₡' : '$'}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={t.neta}
                      onChange={(e) => actualizarTarifa(idx, { neta: e.target.value })}
                      placeholder="Neta"
                      className="pl-5 tnum"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarTarifa(idx)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {tarifas.length === 0 && (
                <p className="rounded-r-sm border border-border bg-surface-2 px-3 py-2 text-small text-ink-muted">
                  Este tour no tiene tarifas. Agregá al menos una.
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-caption text-danger">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={mutacionActualizar.isPending || mutacionCrear.isPending}
            className="h-10 rounded-r-sm px-4 text-[14px] font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={mutacionActualizar.isPending || mutacionCrear.isPending}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-r-sm px-4 text-[14px] font-semibold text-white transition-all duration-fast',
              mutacionActualizar.isPending || mutacionCrear.isPending
                ? 'bg-ink-faint/60'
                : 'bg-brand hover:-translate-y-px hover:bg-brand-hover',
            )}
          >
            {mutacionActualizar.isPending || mutacionCrear.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mutacionActualizar.isPending || mutacionCrear.isPending
              ? 'Guardando…'
              : esCrear
                ? 'Crear tour'
                : 'Guardar cambios'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
