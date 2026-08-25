/**
 * Panel de filtros (buscador.md §2): 8 secciones en acordeones (los 3
 * primeros abiertos por defecto), conteos dinámicos por zona, slider dual
 * de precio, multi-select de operador con búsqueda interna y footer sticky
 * "Ver N resultados" cuando hay filtros activos.
 */
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { Operador, Tour } from '@/data/mock-tours';
import {
  DURACION_OPCIONES,
  FILTROS_INICIALES,
  PRECIO_MAX,
  PRECIO_MIN,
  aplicarFiltros,
  contarActivos,
  sinSeccion,
} from '@/lib/filtros';
import type { Filtros } from '@/lib/filtros';
import { CATEGORIA_META, CATEGORIAS, HORARIO_KEYS, HORARIO_META, INCLUYE_KEYS, INCLUYE_META } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ---------------------------------------------------------------- */

function Seccion({
  titulo,
  abiertoDefault = false,
  children,
}: {
  titulo: string;
  abiertoDefault?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(abiertoDefault);
  return (
    <div className="border-b border-border py-5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-label text-ink">{titulo}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-ink-faint" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pt-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Checkbox con check animado (draw 180ms) */
function CheckboxFila({
  checked,
  onChange,
  label,
  extra,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  extra?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center gap-2.5 rounded-r-sm px-1 py-1.5 text-left transition-colors duration-fast hover:bg-surface-2"
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-fast',
          checked ? 'border-brand bg-brand' : 'border-border bg-surface group-hover:border-brand/50',
        )}
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3">
          <motion.path
            d="M2 6.2 4.8 9 10 3.2"
            fill="none"
            stroke="#fff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.18 }}
          />
        </svg>
      </span>
      <span className="flex-1 text-small text-ink">{label}</span>
      {extra}
    </button>
  );
}

/* ---------------------------------------------------------------- */

interface FilterPanelProps {
  filtros: Filtros;
  onCambio: (f: Filtros) => void;
  tours: Tour[];
  operadores: Operador[];
  totalFiltrados: number;
  onVerResultados?: () => void;
}

export default function FilterPanel({
  filtros,
  onCambio,
  tours,
  operadores,
  totalFiltrados,
  onVerResultados,
}: FilterPanelProps) {
  const activos = contarActivos(filtros);
  const [buscaOp, setBuscaOp] = useState('');
  const [opOpen, setOpOpen] = useState(false);

  // Conteos dinámicos por zona (respetan el resto de filtros)
  const conteosZona = useMemo(() => {
    const base = aplicarFiltros(tours, sinSeccion(filtros, 'zonas'));
    const mapa = new Map<string, number>();
    for (const t of base) mapa.set(t.zona, (mapa.get(t.zona) ?? 0) + 1);
    return mapa;
  }, [tours, filtros]);

  const zonas = useMemo(() => {
    const set = new Map<string, number>();
    for (const t of tours) set.set(t.zona, (set.get(t.zona) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => b[1] - a[1]).map(([z]) => z);
  }, [tours]);

  const operadoresFiltrados = useMemo(
    () => operadores.filter((o) => o.nombre.toLowerCase().includes(buscaOp.toLowerCase())),
    [operadores, buscaOp],
  );

  const set = (parcial: Partial<Filtros>) => onCambio({ ...filtros, ...parcial });

  const toggleLista = <T,>(lista: T[], valor: T): T[] =>
    lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor];

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h2 className="text-h3 text-ink">Filtros</h2>
        <button
          type="button"
          disabled={activos === 0}
          onClick={() => onCambio({ ...FILTROS_INICIALES, texto: filtros.texto })}
          className={cn(
            'flex items-center gap-1.5 rounded-r-sm px-2 py-1 text-caption font-medium transition-colors duration-fast',
            activos === 0 ? 'cursor-default text-ink-faint opacity-50' : 'text-ink-muted hover:bg-surface-2 hover:text-brand',
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {activos > 0 ? `Limpiar (${activos})` : 'Limpiar'}
        </button>
      </div>

      {/* Secciones */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* 1. Precio adulto */}
        <Seccion titulo="Precio adulto" abiertoDefault>
          <div className="px-1 pt-2">
            <Slider
              min={PRECIO_MIN}
              max={PRECIO_MAX}
              step={5}
              value={filtros.precio}
              onValueChange={(v) => set({ precio: [v[0] ?? PRECIO_MIN, v[1] ?? PRECIO_MAX], precioActivo: true })}
              className="[&_[data-slot=slider-range]]:bg-brand [&_[data-slot=slider-thumb]]:border-brand"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {([0, 1] as const).map((i) => (
              <label key={i} className="flex w-[90px] items-center gap-1 rounded-r-sm border border-border bg-surface px-2 py-1.5 text-small tnum focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15">
                <span className="text-ink-faint">$</span>
                <input
                  type="number"
                  min={PRECIO_MIN}
                  max={PRECIO_MAX}
                  value={filtros.precio[i]}
                  onChange={(e) => {
                    const v = Math.max(PRECIO_MIN, Math.min(PRECIO_MAX, Number(e.target.value) || 0));
                    const nuevo: [number, number] = [...filtros.precio] as [number, number];
                    nuevo[i] = v;
                    if (nuevo[0] > nuevo[1]) nuevo[i === 0 ? 1 : 0] = v;
                    set({ precio: nuevo, precioActivo: true });
                  }}
                  className="w-full bg-transparent text-ink outline-none"
                  aria-label={i === 0 ? 'Precio mínimo' : 'Precio máximo'}
                />
              </label>
            ))}
            <span className="text-caption text-ink-faint">por persona</span>
          </div>
        </Seccion>

        {/* 2. Zona */}
        <Seccion titulo="Zona" abiertoDefault>
          <div className="-mx-1">
            {zonas.map((z) => (
              <CheckboxFila
                key={z}
                checked={filtros.zonas.includes(z)}
                onChange={() => set({ zonas: toggleLista(filtros.zonas, z) })}
                label={z}
                extra={
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={conteosZona.get(z) ?? 0}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-caption text-ink-faint tnum"
                    >
                      ({conteosZona.get(z) ?? 0})
                    </motion.span>
                  </AnimatePresence>
                }
              />
            ))}
          </div>
        </Seccion>

        {/* 3. Categoría */}
        <Seccion titulo="Categoría" abiertoDefault>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map((c) => {
              const meta = CATEGORIA_META[c];
              const activa = filtros.categorias.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => set({ categorias: toggleLista(filtros.categorias, c) })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-r-sm border px-2.5 py-2 text-caption font-medium transition-all duration-fast',
                    activa
                      ? cn('border-transparent', meta.clases)
                      : 'border-border bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <meta.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </Seccion>

        {/* 4. Duración */}
        <Seccion titulo="Duración">
          <div className="space-y-0.5">
            {DURACION_OPCIONES.map((op) => {
              const activa = filtros.duracion === op.key;
              return (
                <button
                  key={op.key}
                  type="button"
                  role="radio"
                  aria-checked={activa}
                  onClick={() => set({ duracion: op.key })}
                  className="flex w-full items-center gap-2.5 rounded-r-sm px-1 py-1.5 text-left transition-colors duration-fast hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      'flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-colors duration-fast',
                      activa ? 'border-brand' : 'border-border',
                    )}
                  >
                    {activa && <motion.span layoutId={undefined} className="h-2.5 w-2.5 rounded-full bg-brand" />}
                  </span>
                  <span className="text-small text-ink">{op.label}</span>
                </button>
              );
            })}
          </div>
        </Seccion>

        {/* 5. Horario de salida */}
        <Seccion titulo="Horario de salida">
          <div className="flex flex-wrap gap-2">
            {HORARIO_KEYS.map((h) => {
              const meta = HORARIO_META[h];
              const activo = filtros.horarios.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => set({ horarios: toggleLista(filtros.horarios, h) })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-caption font-medium transition-all duration-fast',
                    activo
                      ? 'border-transparent bg-brand-soft text-brand'
                      : 'border-border bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <meta.icon className="h-3.5 w-3.5" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </Seccion>

        {/* 6. Qué incluye */}
        <Seccion titulo="Qué incluye">
          <div className="-mx-1">
            {INCLUYE_KEYS.map((k) => (
              <CheckboxFila
                key={k}
                checked={filtros.incluye.includes(k)}
                onChange={() => set({ incluye: toggleLista(filtros.incluye, k) })}
                label={INCLUYE_META[k].label}
              />
            ))}
          </div>
          <p className="mt-2 px-1 text-caption text-ink-faint">El tour debe incluir todos los marcados.</p>
        </Seccion>

        {/* 7. Apto para niños */}
        <Seccion titulo="Apto para niños">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <div className="text-small font-medium text-ink">Apto para niños</div>
              <div className="text-caption text-ink-faint">Muestra solo tours que aceptan menores</div>
            </div>
            <Switch
              checked={filtros.aptoNinos}
              onCheckedChange={(v) => set({ aptoNinos: v, edadNino: v ? filtros.edadNino : null })}
              aria-label="Apto para niños"
              className="data-[state=checked]:bg-brand"
            />
          </div>
          <AnimatePresence initial={false}>
            {filtros.aptoNinos && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="overflow-hidden"
              >
                <label className="mt-3 flex items-center gap-2 px-1 text-small text-ink-muted">
                  Edad del niño
                  <input
                    type="number"
                    min={0}
                    max={17}
                    value={filtros.edadNino ?? ''}
                    onChange={(e) => set({ edadNino: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="Opcional"
                    className="h-9 w-24 rounded-r-sm border border-border bg-surface px-2 text-ink tnum outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15"
                  />
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </Seccion>

        {/* 8. Operador */}
        <Seccion titulo="Operador">
          <Popover open={opOpen} onOpenChange={setOpOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-between rounded-r-sm border border-border bg-surface px-3 text-small text-ink-muted transition-colors duration-fast hover:border-brand"
              >
                {filtros.operadores.length > 0
                  ? `${filtros.operadores.length} seleccionado${filtros.operadores.length > 1 ? 's' : ''}`
                  : 'Todos los operadores'}
                <ChevronDown className="h-4 w-4 text-ink-faint" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[260px] border-border bg-surface p-2 shadow-overlay">
              <div className="flex items-center gap-2 rounded-r-sm border border-border px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-ink-faint" />
                <input
                  value={buscaOp}
                  onChange={(e) => setBuscaOp(e.target.value)}
                  placeholder="Buscar operador…"
                  className="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-faint"
                />
              </div>
              <div className="mt-1 max-h-56 overflow-y-auto">
                {operadoresFiltrados.map((op) => {
                  const activo = filtros.operadores.includes(op.id);
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => set({ operadores: toggleLista(filtros.operadores, op.id) })}
                      className="flex w-full items-center gap-2 rounded-r-sm px-2 py-1.5 text-left text-small text-ink transition-colors duration-fast hover:bg-surface-2"
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          activo ? 'border-brand bg-brand text-white' : 'border-border',
                        )}
                      >
                        {activo && <Check className="h-3 w-3" />}
                      </span>
                      {op.nombre}
                    </button>
                  );
                })}
                {operadoresFiltrados.length === 0 && (
                  <div className="px-2 py-3 text-small text-ink-faint">Sin coincidencias</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {filtros.operadores.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {filtros.operadores.map((id) => {
                const op = operadores.find((o) => o.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-caption font-medium text-brand">
                    {op?.nombre ?? id}
                    <button
                      type="button"
                      aria-label={`Quitar ${op?.nombre}`}
                      onClick={() => set({ operadores: filtros.operadores.filter((x) => x !== id) })}
                      className="rounded-full hover:text-brand-hover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </Seccion>
      </div>

      {/* Footer sticky: Ver N resultados */}
      <AnimatePresence initial={false}>
        {activos > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4">
              <button
                type="button"
                onClick={onVerResultados}
                className="h-10 w-full rounded-r-sm bg-brand text-sm font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]"
              >
                Ver {totalFiltrados} resultado{totalFiltrados === 1 ? '' : 's'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
