/**
 * Página de búsqueda de tours (`/buscar`) — buscador.md completo.
 * Barra IA + panel de filtros (sticky, scroll propio) + chips activos +
 * barra de resultados + grid/lista de TourCard + barra flotante de
 * comparación + atajos de teclado. Datos: mock-tours (futuro tRPC).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import ActiveChips, { ContadorResultados } from '@/components/buscador/ActiveChips';
import CompareBar from '@/components/buscador/CompareBar';
import { EstadoInicial, EstadoSinResultados } from '@/components/buscador/EmptyStates';
import FilterPanel from '@/components/buscador/FilterPanel';
import ResultsBar from '@/components/buscador/ResultsBar';
import type { Vista } from '@/components/buscador/ResultsBar';
import SearchBar, { ChipsSugerencias } from '@/components/buscador/SearchBar';
import type { Sugerencia } from '@/components/buscador/SearchBar';
import TourCard, { TourCardSkeleton } from '@/components/buscador/TourCard';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { useToursData } from '@/hooks/useToursData';
import {
  FILTROS_INICIALES,
  aplicarFiltros,
  chipsDeFiltros,
  contarActivos,
  interpretarBusqueda,
  ordenar,
  quitarChip,
} from '@/lib/filtros';
import { cn } from '@/lib/utils';
import { useCompare } from '@/context/CompareContext';
import type { Filtros, Orden } from '@/lib/filtros';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const VISTA_KEY = 'tourhub-vista';

export default function Buscador() {
  const data = useToursData();
  const navigate = useNavigate();


  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>(FILTROS_INICIALES);
  const [interpretando, setInterpretando] = useState(false);
  const [hasBuscado, setHasBuscado] = useState(true);
  const [orden, setOrden] = useState<Orden>('precio-asc');
  const [vista, setVista] = useState<Vista>(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(VISTA_KEY) === 'lista' ? 'lista' : 'grid',
  );
  const [sheetFiltros, setSheetFiltros] = useState(false);
  const esMobile = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
    [],
  );

  // Filtros en vivo con debounce 250ms (buscador.md §2)
  useEffect(() => {
    const id = setTimeout(() => setFiltrosAplicados(filtros), 250);
    return () => clearTimeout(id);
  }, [filtros]);

  // Vista persistida
  useEffect(() => {
    window.localStorage.setItem(VISTA_KEY, vista);
  }, [vista]);

  // Atajo global `/` para enfocar la barra
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const el = document.activeElement;
      const escribiendo =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
      if (escribiendo) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tours = data?.tours ?? [];
  const operadores = data?.operadores ?? [];

  const filtrados = useMemo(() => aplicarFiltros(tours, filtrosAplicados), [tours, filtrosAplicados]);
  const resultados = useMemo(
    () => ordenar(filtrados, orden, filtrosAplicados.texto),
    [filtrados, orden, filtrosAplicados.texto],
  );

  const activos = contarActivos(filtrosAplicados);
  const mostrarResultados = hasBuscado || activos > 0 || filtrosAplicados.texto != null;
  const chips = useMemo(
    () => chipsDeFiltros(filtrosAplicados, operadores),
    [filtrosAplicados, operadores],
  );

  // Al cambiar filtros, el scroll del grid vuelve arriba (instantáneo)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [filtrosAplicados, orden]);

  /* ---------------- búsqueda libre ---------------- */

  const ejecutarBusqueda = (textoParam?: string) => {
    const texto = (textoParam ?? query).trim();
    if (!texto || interpretando) return;
    setInterpretando(true);
    setHasBuscado(true);
    // Simula la llamada IA del backend (texto → filtros)
    setTimeout(() => {
      const interp = interpretarBusqueda(texto);
      setInterpretando(false);
      if (!interp) {
        toast.warning('No pude interpretar la búsqueda, intenta con más detalle', {
          description: 'Prueba con categoría, zona, precio o horario. Ej.: "rafting con almuerzo que salga temprano".',
        });
        return;
      }
      setFiltros((f) => ({ ...f, ...interp.filtros, texto }));
      setOrden('relevancia');
      setQuery('');
    }, 900);
  };

  const elegirSugerencia = (s: Sugerencia) => {
    setQuery(s.texto);
    ejecutarBusqueda(s.texto);
  };

  const editarTextoIA = () => {
    setQuery(filtrosAplicados.texto ?? '');
    setFiltros((f) => ({ ...f, texto: null }));
    inputRef.current?.focus();
  };

  /* ---------------- sugerencia dinámica para estado vacío ---------------- */

  const sugerenciaVacio = useMemo(() => {
    if (!data || resultados.length > 0 || activos === 0) return null;
    const f = filtrosAplicados;
    const candidatos: [string, Filtros][] = [];
    for (const z of f.zonas) candidatos.push([`'${z}'`, { ...f, zonas: f.zonas.filter((x) => x !== z) }]);
    if (f.precioActivo) candidatos.push(['subir el precio máximo', { ...f, precioActivo: false }]);
    for (const c of f.categorias) candidatos.push([`la categoría`, { ...f, categorias: f.categorias.filter((x) => x !== c) }]);
    if (f.duracion !== 'cualquiera') candidatos.push(['la duración', { ...f, duracion: 'cualquiera' }]);
    for (const h of f.horarios) candidatos.push(['el horario', { ...f, horarios: f.horarios.filter((x) => x !== h) }]);
    for (const i of f.incluye) candidatos.push([`'${i}' de "incluye"`, { ...f, incluye: f.incluye.filter((x) => x !== i) }]);
    if (f.aptoNinos) candidatos.push(['"Apto para niños"', { ...f, aptoNinos: false }]);
    let mejor: string | null = null;
    let mejorN = 0;
    for (const [label, ff] of candidatos) {
      const n = aplicarFiltros(tours, ff).length;
      if (n > mejorN) {
        mejorN = n;
        mejor = label;
      }
    }
    if (!mejor) return null;
    return mejor === 'subir el precio máximo'
      ? 'Prueba subir el precio máximo o quitar otro filtro.'
      : `Prueba quitar ${mejor}.`;
  }, [data, resultados.length, activos, filtrosAplicados, tours]);

  const { toggle, estaSeleccionado } = useCompare();
  const mostrarSkeletons = !data || interpretando;

  /* ---------------- render ---------------- */

  const panelFiltros = (
    <FilterPanel
      filtros={filtros}
      onCambio={setFiltros}
      tours={tours}
      operadores={operadores}
      totalFiltrados={filtrados.length}
      onVerResultados={() => {
        setSheetFiltros(false);
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  );

  return (
    <div className="relative flex h-full min-h-0">
      {/* Panel de filtros (desktop, 300px, scroll propio) */}
      <aside className="hidden w-[300px] shrink-0 border-r border-border lg:block">{panelFiltros}</aside>

      {/* Columna de búsqueda + resultados */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado + barra */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="shrink-0 space-y-3 px-5 pt-5"
        >
          <h1 className="hidden text-display text-ink lg:block">Buscar tours</h1>
          <SearchBar ref={inputRef} valor={query} onCambio={setQuery} onBuscar={() => ejecutarBusqueda()} interpretando={interpretando} />
          <ChipsSugerencias onElegir={elegirSugerencia} />
          <ActiveChips
            textoIA={filtrosAplicados.texto}
            chips={chips}
            onQuitar={(id) => setFiltros((f) => quitarChip(f, id))}
            onEditarTexto={editarTextoIA}
            onLimpiarTodo={() => setFiltros(FILTROS_INICIALES)}
            contador={
              mostrarResultados ? (
                <ContadorResultados valor={resultados.length} total={tours.length} hayFiltros={activos > 0 || filtrosAplicados.texto != null} />
              ) : (
                <span />
              )
            }
          />
        </motion.div>

        {/* Área con scroll interno: barra de resultados sticky + grid */}
        <div ref={scrollRef} className="mt-2 min-h-0 flex-1 overflow-y-auto px-5 pb-28">
          {mostrarResultados && !mostrarSkeletons && resultados.length > 0 && (
            <div className="sticky top-0 z-10 -mx-5 bg-bg/90 px-5 py-1 backdrop-blur-[4px]">
              <ResultsBar orden={orden} onCambioOrden={setOrden} vista={vista} onCambioVista={setVista} />
            </div>
          )}

          {mostrarSkeletons ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 pt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TourCardSkeleton key={i} />
              ))}
            </div>
          ) : !mostrarResultados ? (
            <EstadoInicial
              totalTours={tours.length}
              totalOperadores={operadores.length}
              onElegir={elegirSugerencia}
            />
          ) : resultados.length === 0 ? (
            <EstadoSinResultados sugerencia={sugerenciaVacio} onLimpiar={() => setFiltros(FILTROS_INICIALES)} />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={vista}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'pt-3',
                  vista === 'lista' ? 'flex flex-col gap-3' : 'grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4',
                )}
              >
                <AnimatePresence initial={false}>
                  {resultados.map((tour, i) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      index={i}
                      vista={vista}
                      seleccionado={estaSeleccionado(tour.id)}
                      onToggleComparar={() => toggle(tour.id)}
                      onVerDetalle={() => navigate(`/tour/${tour.id}`)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </div>

      {/* Botón flotante de filtros (móvil/tablet) */}
      <button
        type="button"
        onClick={() => setSheetFiltros(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-overlay transition-all duration-fast hover:bg-brand-hover active:scale-[0.98] lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros{activos > 0 ? ` (${activos})` : ''}
      </button>

      {/* Sheet de filtros: bottom-sheet móvil / drawer izquierdo tablet */}
      <Sheet open={sheetFiltros} onOpenChange={setSheetFiltros}>
        <SheetContent
          side={esMobile ? 'bottom' : 'left'}
          className={
            esMobile
              ? 'h-[85dvh] rounded-t-r-lg border-border bg-surface p-0'
              : 'w-[320px] border-border bg-surface p-0'
          }
        >
          {panelFiltros}
        </SheetContent>
      </Sheet>

      {/* Barra flotante de comparación */}
      <CompareBar tours={tours} />
    </div>
  );
}
