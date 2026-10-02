/**
 * Página Detalle de Tour (`/tour/:id`) — tour-detalle.md.
 * Columna central de 760px con miga de pan, todo el contenido del tour
 * (componente compartido con el drawer de escritorio) y estados de carga /
 * no encontrado.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import TourDetalleContenido, { TourDetalleSkeleton } from '@/components/detalle/TourDetalleContenido';
import { fetchTourById } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function TourDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tourId = Number(id);
  const idValido = Number.isInteger(tourId) && tourId > 0;

  const [tour, setTour] = useState<Tour | null>(null);
  const [cargando, setCargando] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!idValido) {
      setCargando(false);
      setTour(null);
      return;
    }
    let vivo = true;
    setCargando(true);
    scrollRef.current?.scrollTo({ top: 0 });
    fetchTourById(tourId).then((t) => {
      if (!vivo) return;
      setTour(t ?? null);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, [tourId, idValido]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
      className="h-full overflow-y-auto"
    >
      <div className="mx-auto min-h-full max-w-[760px] bg-surface shadow-card xl:border-x xl:border-border">
        {/* Miga de pan + volver (página completa, tour-detalle.md §1) */}
        <div className="flex items-center gap-3 px-5 pt-4">
          <button
            type="button"
            onClick={() => (tour ? navigate(`/operador/${tour.operador.id}`) : navigate('/buscar'))}
            className="flex h-9 items-center gap-1.5 rounded-r-sm border border-border bg-surface px-3 text-sm font-medium text-ink transition-colors duration-fast hover:border-brand hover:text-brand md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <nav aria-label="breadcrumb" className="hidden min-w-0 items-center gap-1 text-caption md:flex">
            <Link
              to={tour ? `/operador/${tour.operador.id}` : '/buscar'}
              className="shrink-0 font-medium text-brand hover:underline"
            >
              {tour ? tour.operador.nombre : 'Buscar'}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-ink-faint" />
            <span className="truncate text-ink-muted">{tour?.nombre ?? 'Detalle de tour'}</span>
          </nav>
        </div>

        {cargando ? (
          <TourDetalleSkeleton />
        ) : !tour ? (
          /* Tour no encontrado / ID inválido (tour-detalle.md §9) */
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <motion.img
              src="./empty-search.svg"
              alt="Binoculares sobre un mapa con ruta punteada"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="w-[280px] max-w-full"
            />
            <h1 className="mt-6 text-h3 text-ink">Este tour ya no está en la base de datos</h1>
            <p className="mt-2 max-w-md text-small text-ink-muted">
              Puede haber sido reemplazado por una carga más reciente del operador.
            </p>
            <Link
              to="/buscar"
              className="mt-5 flex h-10 items-center rounded-r-sm bg-brand px-5 text-sm font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]"
            >
              Volver a buscar
            </Link>
          </div>
        ) : (
          <TourDetalleContenido key={tour.id} tour={tour} variante="pagina" scrolled={scrolled} />
        )}
      </div>
    </div>
  );
}
