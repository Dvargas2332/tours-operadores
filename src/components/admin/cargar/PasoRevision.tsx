/**
 * Paso 3 del wizard: revisión editable del lote extraído
 * (cargar-tarifario.md §Paso 3). Tabla densa con inputs inline,
 * validaciones en vivo, panel expandible por fila (campos largos),
 * exclusión reversible, búsqueda dentro del lote, alta manual y
 * footer sticky con confirmación.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Plus, Search, Trash2, Undo2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Categoria } from '@/data/mock-tours';
import type { FilaRevision, TarifaRevision } from '@/components/admin/cargar/tipos';
import { ZONAS_BASE, advertenciasNeta, filaVacia, validarFila } from '@/components/admin/cargar/tipos';
import { CATEGORIA_META, CATEGORIAS, INCLUYE_META, INCLUYE_KEYS } from '@/lib/tour-meta';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const INPUT_BASE =
  'h-8 w-full rounded-r-sm border bg-surface px-2 text-small text-ink transition-colors duration-fast focus:outline-none focus:ring-[3px]';
const INPUT_OK = 'border-transparent hover:border-border focus:border-brand focus:ring-brand/15';
const INPUT_ERR = 'border-danger focus:border-danger focus:ring-danger/15';

interface PasoRevisionProps {
  filas: FilaRevision[];
  onFilasChange: (filas: FilaRevision[]) => void;
  totalOperadores: number;
  onVolver: () => void;
  onConfirmar: () => void;
  confirmando: boolean;
  errorConfirmacion: string | null;
}

export default function PasoRevision({
  filas,
  onFilasChange,
  totalOperadores,
  onVolver,
  onConfirmar,
  confirmando,
  errorConfirmacion,
}: PasoRevisionProps) {
  const [zonas, setZonas] = useState<string[]>(() => {
    const delLote = [...new Set(filas.map((f) => f.zona).filter(Boolean))];
    return [...new Set([...ZONAS_BASE, ...delLote])].sort((a, b) => a.localeCompare(b, 'es'));
  });
  const [zonasNuevas, setZonasNuevas] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [intentoInvalido, setIntentoInvalido] = useState(0);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const actualizar = (key: string, campo: string, patch: Partial<FilaRevision>) => {
    onFilasChange(filas.map((f) => (f.key === key ? { ...f, ...patch } : f)));
    setFlash(`${key}:${campo}`);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 600);
  };

  const actualizarTarifa = (key: string, index: number, patch: Partial<TarifaRevision>) => {
    const f = filas.find((x) => x.key === key);
    if (!f) return;
    const nuevas = [...f.tarifas];
    nuevas[index] = { ...nuevas[index], ...patch };
    actualizar(key, 'tarifas', { tarifas: nuevas });
  };

  const agregarTarifa = (key: string) => {
    const f = filas.find((x) => x.key === key);
    if (!f) return;
    const ultima = f.tarifas[f.tarifas.length - 1];
    const siguienteMin = ultima?.maxEdad != null ? ultima.maxEdad + 1 : (ultima?.minEdad ?? 0) + 1;
    actualizar(key, 'tarifas', {
      tarifas: [...f.tarifas, { minEdad: siguienteMin, maxEdad: null, rack: '', neta: '' }],
    });
  };

  const eliminarTarifa = (key: string, index: number) => {
    const f = filas.find((x) => x.key === key);
    if (!f) return;
    actualizar(key, 'tarifas', { tarifas: f.tarifas.filter((_, i) => i !== index) });
  };

  const erroresPorFila = useMemo(() => {
    const mapa = new Map<string, ReturnType<typeof validarFila>>();
    for (const f of filas) mapa.set(f.key, validarFila(f));
    return mapa;
  }, [filas]);

  const activas = filas.filter((f) => !f.excluida);
  const conError = activas.filter((f) => Object.keys(erroresPorFila.get(f.key)!).length > 0);
  const conAdvertencias = activas.filter((f) => f.advertencias.length > 0 || advertenciasNeta(f).length > 0);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const base = q ? filas.filter((f) => f.nombre.toLowerCase().includes(q)) : filas;
    return [...base].sort(
      (a, b) => a.operador.localeCompare(b.operador, 'es') || filas.indexOf(a) - filas.indexOf(b),
    );
  }, [filas, busqueda]);

  const toggleExpandir = (key: string) =>
    setExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const agregarFila = () => {
    onFilasChange([...filas, filaVacia(filas[0]?.operador ?? '', filas[0]?.moneda ?? 'usd')]);
  };

  const seleccionarTodas = (incluir: boolean) => {
    onFilasChange(filas.map((f) => ({ ...f, excluida: !incluir })));
  };

  const intentarConfirmarInvalido = () => {
    setIntentoInvalido((s) => s + 1);
    const primera = conError[0];
    if (primera) {
      document
        .querySelector(`[data-fila="${primera.key}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const flashClase = (key: string, campo: string) =>
    flash === `${key}:${campo}` ? 'bg-brand-soft' : 'bg-transparent';

  return (
    <div>
      <h2 className="text-h2 text-ink">Revisa antes de guardar</h2>

      {/* Resumen en pills */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-ink tnum">
          {filas.length} tours detectados
        </span>
        {conAdvertencias.length > 0 && (
          <span className="rounded-full bg-volcan-soft px-3 py-1.5 text-caption font-medium text-warn tnum">
            {conAdvertencias.length} con advertencias
          </span>
        )}
        {conError.length > 0 && (
          <span className="rounded-full bg-danger/15 px-3 py-1.5 text-caption font-medium text-danger tnum">
            {conError.length} con errores
          </span>
        )}
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-ink tnum">
          {totalOperadores} operadores
        </span>
      </div>

      {/* Banner persistente */}
      <div
        className={cn(
          'mt-3 rounded-r-sm px-4 py-3 text-small',
          conError.length > 0
            ? 'border border-danger/30 bg-danger/[0.08] text-danger'
            : 'bg-volcan-soft text-ink',
        )}
      >
        {conError.length > 0 ? (
          <>
            Corregí {conError.length} {conError.length === 1 ? 'fila' : 'filas'} con errores antes de
            confirmar. Las advertencias (⚠) no bloquean el guardado.
          </>
        ) : conAdvertencias.length > 0 ? (
          <>
            Las advertencias (⚠) son solo informativas: podés confirmar y guardar el tarifario.
          </>
        ) : (
          <>Nada se guarda hasta que confirmes abajo. Corregí cualquier dato directamente en la tabla.</>
        )}
      </div>

      {/* Listado de errores */}
      {conError.length > 0 && (
        <div className="mt-3 rounded-r-sm border border-danger/30 bg-danger/[0.04] px-4 py-3">
          <p className="mb-2 text-caption font-semibold text-danger">Errores por corregir:</p>
          <ul className="max-h-[180px] space-y-1.5 overflow-y-auto text-small text-ink">
            {conError.map((f) => {
              const err = erroresPorFila.get(f.key) ?? {};
              return (
                <li key={f.key} className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .querySelector(`[data-fila="${f.key}"]`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                    className="text-left font-medium text-danger hover:underline"
                  >
                    {f.nombre || 'Sin nombre'}
                  </button>
                  <span className="text-ink-muted">
                    {Object.values(err).join(' · ')}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Toolbar de tabla */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => seleccionarTodas(true)}
          className="rounded-r-sm px-2 py-1.5 text-caption font-semibold text-brand transition-colors duration-fast hover:bg-brand-soft"
        >
          Seleccionar todas
        </button>
        <button
          type="button"
          onClick={() => seleccionarTodas(false)}
          className="rounded-r-sm px-2 py-1.5 text-caption font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-2"
        >
          Ninguna
        </button>
        <span className="text-caption text-ink-muted tnum" aria-live="polite">
          {activas.length} de {filas.length} se guardarán
        </span>
        <div className="relative ml-auto min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en el lote…"
            className="h-8 w-full rounded-r-sm border border-border bg-surface pl-8 pr-2 text-small text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla editable */}
      <div className="mt-3 overflow-hidden rounded-r-md border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1340px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="w-[52px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">#</th>
                <th className="min-w-[180px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Nombre del tour</th>
                <th className="w-[150px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Zona</th>
                <th className="w-[140px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Categoría</th>
                <th className="w-[160px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Tarifas por edad</th>
                <th className="w-[80px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Durac. (h)</th>
                <th className="w-[96px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Salida</th>
                <th className="w-[96px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Llegada</th>
                <th className="w-[120px] px-2 py-2.5 text-label uppercase tracking-wide text-ink-muted">Incluye</th>
                <th className="w-[76px] px-2 py-2.5 text-center text-label uppercase tracking-wide text-ink-muted">Apto niños</th>
                <th className="w-[56px] px-2 py-2.5 text-center text-label uppercase tracking-wide text-ink-muted">Adv.</th>
                <th className="w-[56px] px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visibles.map((fila) => {
                  const idx = filas.indexOf(fila);
                  const errores = erroresPorFila.get(fila.key) ?? {};
                  const expandida = expandidas.has(fila.key);
                  const cat = CATEGORIA_META[fila.categoria];
                  return [
                    <motion.tr
                      key={fila.key}
                      data-fila={fila.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.3), ease: EASE }}
                      className={cn(
                        'border-b border-border align-top transition-colors duration-med hover:bg-surface-2/60',
                        fila.excluida && 'opacity-50',
                      )}
                    >
                      {/* # + expand */}
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => toggleExpandir(fila.key)}
                            title="Editar campos largos"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-r-sm text-ink-faint transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                          >
                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-med', expandida && 'rotate-180')} />
                          </button>
                          <span className="text-caption text-ink-faint tnum">{idx + 1}</span>
                        </div>
                      </td>

                      {/* Nombre */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'nombre'))}>
                        <input
                          type="text"
                          value={fila.nombre}
                          disabled={fila.excluida}
                          onChange={(e) => actualizar(fila.key, 'nombre', { nombre: e.target.value })}
                          className={cn(INPUT_BASE, errores.nombre ? INPUT_ERR : INPUT_OK, fila.excluida && 'line-through')}
                        />
                        {errores.nombre && <p className="mt-0.5 text-caption text-danger">{errores.nombre}</p>}
                        {fila.excluida && <p className="mt-0.5 text-caption text-ink-faint">no se guardará</p>}
                        {!fila.excluida && (
                          <p className="mt-0.5 truncate text-caption text-ink-faint">
                            {fila.operador}
                            {fila.moneda === 'crc' ? ' · ₡' : ''}
                          </p>
                        )}
                      </td>

                      {/* Zona */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'zona'))}>
                        {zonasNuevas.has(fila.key) ? (
                          <input
                            type="text"
                            autoFocus
                            defaultValue={fila.zona}
                            disabled={fila.excluida}
                            placeholder="Nueva zona…"
                            onBlur={(e) => {
                              const valor = e.target.value.trim();
                              if (valor) {
                                setZonas((prev) => [...new Set([...prev, valor])].sort((a, b) => a.localeCompare(b, 'es')));
                                actualizar(fila.key, 'zona', { zona: valor });
                              }
                              setZonasNuevas((prev) => {
                                const next = new Set(prev);
                                next.delete(fila.key);
                                return next;
                              });
                            }}
                            className={cn(INPUT_BASE, INPUT_OK)}
                          />
                        ) : (
                          <select
                            value={fila.zona}
                            disabled={fila.excluida}
                            onChange={(e) => {
                              if (e.target.value === '__nueva') {
                                setZonasNuevas((prev) => new Set(prev).add(fila.key));
                                actualizar(fila.key, 'zona', { zona: '' });
                              } else {
                                actualizar(fila.key, 'zona', { zona: e.target.value });
                              }
                            }}
                            className={cn(INPUT_BASE, errores.zona ? INPUT_ERR : INPUT_OK)}
                          >
                            <option value="" disabled>
                              Elegir…
                            </option>
                            {zonas.map((z) => (
                              <option key={z} value={z}>
                                {z}
                              </option>
                            ))}
                            <option value="__nueva">+ nueva zona</option>
                          </select>
                        )}
                        {errores.zona && <p className="mt-0.5 text-caption text-danger">{errores.zona}</p>}
                      </td>

                      {/* Categoría */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'categoria'))}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              disabled={fila.excluida}
                              className={cn(
                                'inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium',
                                cat.clases,
                              )}
                            >
                              <cat.icon className="h-3 w-3" />
                              {cat.label}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[190px] p-1.5">
                            {CATEGORIAS.map((c: Categoria) => {
                              const meta = CATEGORIA_META[c];
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => actualizar(fila.key, 'categoria', { categoria: c })}
                                  className="flex w-full items-center gap-2 rounded-r-sm px-2 py-1.5 text-left transition-colors duration-fast hover:bg-surface-2"
                                >
                                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium', meta.clases)}>
                                    <meta.icon className="h-3 w-3" />
                                    {meta.label}
                                  </span>
                                </button>
                              );
                            })}
                          </PopoverContent>
                        </Popover>
                      </td>

                      {/* Tarifas por edad */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'tarifas'))}>
                        <button
                          type="button"
                          onClick={() => toggleExpandir(fila.key)}
                          disabled={fila.excluida}
                          className={cn(
                            'flex h-8 w-full items-center justify-between rounded-r-sm border px-2 text-small transition-colors duration-fast',
                            errores.tarifas ? 'border-danger text-danger' : 'border-transparent text-ink-muted hover:border-border',
                            fila.excluida && 'line-through',
                          )}
                        >
                          <span className="tnum">
                            {fila.tarifas.length === 0
                              ? 'Sin tarifas'
                              : `${fila.tarifas.length} rango${fila.tarifas.length === 1 ? '' : 's'}`}
                          </span>
                          <ChevronDown className={cn('h-3 w-3 transition-transform duration-med', expandida && 'rotate-180')} />
                        </button>
                        {errores.tarifas && <p className="mt-0.5 text-caption text-danger">{errores.tarifas}</p>}
                      </td>

                      {/* Duración */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'duracion'))}>
                        <input
                          type="number"
                          min={0.5}
                          max={24}
                          step="0.5"
                          value={fila.duracionHoras}
                          disabled={fila.excluida}
                          onChange={(e) => actualizar(fila.key, 'duracion', { duracionHoras: e.target.value })}
                          className={cn(INPUT_BASE, 'tnum', errores.duracion ? INPUT_ERR : INPUT_OK)}
                        />
                        {errores.duracion && <p className="mt-0.5 text-caption text-danger">Inválida</p>}
                      </td>

                      {/* Salida */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'horarios'))}>
                        <input
                          type="time"
                          value={fila.horarios[0]?.salida ?? '08:00'}
                          disabled={fila.excluida}
                          onChange={(e) =>
                            actualizar(fila.key, 'horarios', {
                              horarios: [{ salida: e.target.value, llegada: fila.horarios[0]?.llegada ?? '12:00' }],
                            })
                          }
                          className={cn(INPUT_BASE, 'tnum', errores.horarios ? INPUT_ERR : INPUT_OK)}
                        />
                      </td>

                      {/* Llegada */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'horarios'))}>
                        <input
                          type="time"
                          value={fila.horarios[0]?.llegada ?? '12:00'}
                          disabled={fila.excluida}
                          onChange={(e) =>
                            actualizar(fila.key, 'horarios', {
                              horarios: [{ salida: fila.horarios[0]?.salida ?? '08:00', llegada: e.target.value }],
                            })
                          }
                          className={cn(INPUT_BASE, 'tnum', errores.horarios ? INPUT_ERR : INPUT_OK)}
                        />
                      </td>

                      {/* Incluye */}
                      <td className={cn('px-2 py-2.5 transition-colors duration-500', flashClase(fila.key, 'incluye'))}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              disabled={fila.excluida}
                              className="flex h-8 w-full items-center justify-between gap-1 rounded-r-sm border border-transparent px-2 text-caption text-ink-muted transition-colors duration-fast hover:border-border"
                            >
                              <span className="tnum">{fila.incluye.length} incluye</span>
                              <ChevronDown className="h-3 w-3 text-ink-faint" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[210px] p-1.5">
                            {INCLUYE_KEYS.map((k) => {
                              const meta = INCLUYE_META[k];
                              const marcado = fila.incluye.includes(k);
                              return (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() =>
                                    actualizar(fila.key, 'incluye', {
                                      incluye: marcado
                                        ? fila.incluye.filter((x) => x !== k)
                                        : [...fila.incluye, k],
                                    })
                                  }
                                  className="flex w-full items-center gap-2 rounded-r-sm px-2 py-1.5 text-small text-ink transition-colors duration-fast hover:bg-surface-2"
                                >
                                  <span
                                    className={cn(
                                      'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors duration-fast',
                                      marcado ? 'border-brand bg-brand text-white' : 'border-border bg-surface',
                                    )}
                                  >
                                    {marcado && <CheckCircle2 className="h-3 w-3" />}
                                  </span>
                                  <meta.icon className="h-3.5 w-3.5 text-ink-faint" />
                                  {meta.label}
                                </button>
                              );
                            })}
                          </PopoverContent>
                        </Popover>
                      </td>

                      {/* Apto niños */}
                      <td className="px-2 py-2.5 text-center">
                        <Switch
                          checked={fila.aptoNinos}
                          disabled={fila.excluida}
                          onCheckedChange={(v) => actualizar(fila.key, 'apto', { aptoNinos: v })}
                          aria-label="Apto para niños"
                        />
                      </td>

                      {/* Advertencias */}
                      <td className="px-2 py-2.5 text-center">
                        {[...fila.advertencias, ...advertenciasNeta(fila)].length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex h-6 w-6 cursor-default items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-warn" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {[...fila.advertencias, ...advertenciasNeta(fila)].map((a) => (
                                <p key={a} className="text-[12px]">
                                  {a}
                                </p>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </td>

                      {/* Acciones de fila */}
                      <td className="px-2 py-2.5 text-center">
                        {fila.excluida ? (
                          <button
                            type="button"
                            onClick={() => actualizar(fila.key, 'excluir', { excluida: false })}
                            title="Volver a incluir"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => actualizar(fila.key, 'excluir', { excluida: true })}
                            title="Excluir del guardado"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>,

                    /* Panel expandible: campos largos */
                    expandida && (
                      <tr key={`${fila.key}-exp`} className="border-b border-border bg-surface-2/40">
                        <td colSpan={12} className="px-4 py-3">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="grid gap-4 overflow-hidden md:grid-cols-2"
                          >
                            {/* Tarifas por rango de edad */}
                            <div className="md:col-span-2">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-label uppercase tracking-wide text-ink-muted">Tarifas por rango de edad</span>
                                <button
                                  type="button"
                                  onClick={() => agregarTarifa(fila.key)}
                                  disabled={fila.excluida}
                                  className="inline-flex items-center gap-1 rounded-r-sm px-2 py-1 text-caption font-semibold text-brand transition-colors duration-fast hover:bg-brand-soft disabled:opacity-50"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Agregar rango
                                </button>
                              </div>
                              <div className="space-y-2">
                                {fila.tarifas.map((t, i) => (
                                  <div key={i} className="grid grid-cols-[80px_80px_1fr_1fr_auto] items-center gap-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={t.minEdad}
                                      disabled={fila.excluida}
                                      onChange={(e) => actualizarTarifa(fila.key, i, { minEdad: Number(e.target.value) })}
                                      className={cn(INPUT_BASE, 'tnum')}
                                      placeholder="Min"
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      value={t.maxEdad ?? ''}
                                      disabled={fila.excluida}
                                      onChange={(e) =>
                                        actualizarTarifa(fila.key, i, {
                                          maxEdad: e.target.value === '' ? null : Number(e.target.value),
                                        })
                                      }
                                      className={cn(INPUT_BASE, 'tnum')}
                                      placeholder="Max"
                                    />
                                    <div className="relative">
                                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-small text-ink-faint">{fila.moneda === 'crc' ? '₡' : '$'}</span>
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.5"
                                        value={t.rack}
                                        disabled={fila.excluida}
                                        placeholder="Rack"
                                        onChange={(e) => actualizarTarifa(fila.key, i, { rack: e.target.value })}
                                        className={cn(INPUT_BASE, 'pl-5 tnum')}
                                      />
                                    </div>
                                    <div className="relative">
                                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-small text-ink-faint">{fila.moneda === 'crc' ? '₡' : '$'}</span>
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.5"
                                        value={t.neta}
                                        disabled={fila.excluida}
                                        placeholder="Neta"
                                        onChange={(e) => actualizarTarifa(fila.key, i, { neta: e.target.value })}
                                        className={cn(INPUT_BASE, 'pl-5 tnum')}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => eliminarTarifa(fila.key, i)}
                                      disabled={fila.excluida || fila.tarifas.length <= 1}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                                {fila.tarifas.length === 0 && (
                                  <p className="text-small text-ink-muted">Agregá al menos un rango de edad con precio rack.</p>
                                )}
                              </div>
                            </div>

                            <label className="block">
                              <span className="text-label uppercase tracking-wide text-ink-muted">Política de cancelación</span>
                              <textarea
                                rows={2}
                                value={fila.politicaCancelacion}
                                disabled={fila.excluida}
                                onChange={(e) => actualizar(fila.key, 'politica', { politicaCancelacion: e.target.value })}
                                className="mt-1 w-full rounded-r-sm border border-border bg-surface px-2 py-1.5 text-small text-ink focus:border-brand focus:outline-none"
                              />
                            </label>
                            <label className="block">
                              <span className="text-label uppercase tracking-wide text-ink-muted">Observaciones</span>
                              <textarea
                                rows={2}
                                value={fila.observaciones}
                                disabled={fila.excluida}
                                onChange={(e) => actualizar(fila.key, 'observaciones', { observaciones: e.target.value })}
                                className="mt-1 w-full rounded-r-sm border border-border bg-surface px-2 py-1.5 text-small text-ink focus:border-brand focus:outline-none"
                              />
                            </label>
                            <label className="block md:col-span-2">
                              <span className="text-label uppercase tracking-wide text-ink-muted">No incluye (separado por comas)</span>
                              <textarea
                                rows={2}
                                value={fila.noIncluye.join(', ')}
                                disabled={fila.excluida}
                                onChange={(e) =>
                                  actualizar(fila.key, 'noIncluye', {
                                    noIncluye: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="mt-1 w-full rounded-r-sm border border-border bg-surface px-2 py-1.5 text-small text-ink focus:border-brand focus:outline-none"
                              />
                            </label>
                          </motion.div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </AnimatePresence>
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-small text-ink-muted">
                    Ningún tour del lote coincide con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Agregar tour manualmente */}
        <button
          type="button"
          onClick={agregarFila}
          className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-caption font-semibold text-brand transition-colors duration-fast hover:bg-brand-soft"
        >
          <Plus className="h-4 w-4" />
          Agregar tour manualmente
        </button>
      </div>

      {/* Error de confirmación */}
      {errorConfirmacion && (
        <div className="mt-3 flex items-center gap-3 rounded-r-sm border border-danger/30 bg-danger/[0.08] px-4 py-3">
          <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-danger" />
          <p className="flex-1 text-small text-ink">
            No pudimos guardar el tarifario: {errorConfirmacion}
          </p>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-r-sm border border-border bg-surface px-3 py-1.5 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Footer sticky */}
      <div className="sticky bottom-0 -mx-1 mt-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-1 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={onVolver}
          className="rounded-r-sm px-3 py-2 text-caption font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
        >
          ← Volver
        </button>
        <p className="flex-1 text-caption text-ink-muted">
          {conError.length > 0 ? (
            <span className="text-danger">
              Faltan corregir {conError.length} {conError.length === 1 ? 'fila' : 'filas'} para guardar
            </span>
          ) : activas.length === 0 ? (
            <span className="text-danger">No hay tours seleccionados para guardar</span>
          ) : confirmando ? (
            'Guardando el tarifario…'
          ) : (
            `Se importará el catálogo completo (${totalOperadores} operadores)`
          )}
        </p>
        <motion.span
          key={intentoInvalido}
          animate={intentoInvalido > 0 ? { x: [0, -3, 3, -3, 3, 0] } : undefined}
          transition={{ duration: 0.3 }}
          onClick={conError.length > 0 ? intentarConfirmarInvalido : undefined}
          title={
            conError.length > 0
              ? `Corrige ${conError.length} ${conError.length === 1 ? 'fila' : 'filas'} con errores para confirmar`
              : activas.length === 0
                ? 'No hay tours seleccionados para guardar'
                : confirmando
                  ? 'Guardando…'
                  : 'Confirmar y guardar'
          }
        >
          <button
            type="button"
            onClick={onConfirmar}
            disabled={conError.length > 0 || activas.length === 0 || confirmando}
            className={cn(
              'inline-flex h-11 min-w-[240px] items-center justify-center gap-2 rounded-r-sm px-5 text-[14px] font-semibold text-white transition-all duration-fast',
              conError.length > 0 || activas.length === 0
                ? 'cursor-not-allowed bg-ink-faint/60'
                : 'bg-brand hover:-translate-y-px hover:bg-brand-hover',
            )}
          >
            {confirmando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {confirmando ? 'Guardando…' : `Confirmar y guardar ${activas.length} tours`}
          </button>
        </motion.span>
      </div>
    </div>
  );
}
