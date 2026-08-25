/**
 * Página Detalle de Tour (`/tour/:id`) — tour-detalle.md.
 * Columna central de 760px con miga de pan, todo el contenido del tour
 * (componente compartido con el drawer de escritorio), tours similares
 * al final y estados de carga / no encontrado.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { BadgeCategoria } from '@/components/detalle/DetalleUI';
import TourDetalleContenido, { TourDetalleSkeleton } from '@/components/detalle/TourDetalleContenido';
import { useToursData } from '@/hooks/useToursData';
import { fetchTourById, formatPrecio } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';
import { formatDuracion } from '@/lib/tour-meta';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Tarjeta compacta de tour similar (versión densa: sin fila incluye) */
function TarjetaRelacionada({ tour, index, onClick }: { tour: Tour; index: number; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25, ease: EASE, delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      className="flex flex-col rounded-r-md border border-border bg-surface p-4 text-left shadow-card transition-[box-shadow,border-color] duration-fast hover:border-brand/30 hover:shadow-hover"
    >
      <div className="flex items-center justify-between gap-2">
        <BadgeCategoria tour={tour} />
        <span className="text-caption text-ink-faint tnum">{tour.zona}</span>
      </div>
      <div className="mt-2 line-clamp-2 min-h-[2.6em] text-h3 text-ink">{tour.nombre}</div>
      <div className="truncate text-small text-ink-muted">{tour.operador.nombre}</div>
      <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
        <div>
          <span className="text-precio text-ink">{formatPrecio(tour.precio_adulto, tour.moneda)}</span>
          <span className="ml-1 text-caption text-ink-faint">adulto</span>
        </div>
        <span className="flex items-center gap-1 text-small text-ink-muted tnum">
          <Clock className="h-3.5 w-3.5" />
          {formatDuracion(tour.duracion_horas)}
        </span>
      </div>
    </motion.button>
  );
}

export default function TourDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useToursData();
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

  // Tours similares: misma categoría o zona, máx. 3 (tour-detalle.md §8)
  const relacionados =
    tour && data
      ? data.tours
          .filter((t) => t.id !== tour.id && (t.categoria === tour.categoria || t.zona === tour.zona))
          .slice(0, 3)
      : [];

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
            onClick={() => navigate(-1)}
            className="flex h-9 items-center gap-1.5 rounded-r-sm border border-border bg-surface px-3 text-sm font-medium text-ink transition-colors duration-fast hover:border-brand hover:text-brand md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <nav aria-label="breadcrumb" className="hidden min-w-0 items-center gap-1 text-caption md:flex">
            <Link to="/" className="shrink-0 font-medium text-brand hover:underline">
              Buscador
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
              src="/empty-search.svg"
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
              to="/"
              className="mt-5 flex h-10 items-center rounded-r-sm bg-brand px-5 text-sm font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]"
            >
              Volver al buscador
            </Link>
          </div>
        ) : (
          <>
            <TourDetalleContenido key={tour.id} tour={tour} variante="pagina" scrolled={scrolled} />

            {/* Tours similares (solo página completa) */}
            {relacionados.length > 0 && (
              <section className="border-t border-border px-5 py-6" aria-label="Tours similares">
                <h2 className="text-h2 text-ink">Tours similares</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relacionados.map((t, i) => (
                    <TarjetaRelacionada key={t.id} tour={t} index={i} onClick={() => navigate(`/tour/${t.id}`)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
