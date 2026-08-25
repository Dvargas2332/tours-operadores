/**
 * Drawer de detalle de tour para escritorio (design.md §7.5, tour-detalle.md).
 * Panel derecho 560px (480px entre 1024–1279px) con spring, backdrop, cierre
 * con Esc/backdrop, scroll-lock del fondo y foco restaurado al cerrar.
 *
 * Pensado para montarse sobre el buscador (≥1024px); en pantallas menores
 * toda navegación a detalle es la página completa /tour/:id.
 *
 * Uso:
 *   const [detalleId, setDetalleId] = useState<number | null>(null);
 *   <TourDetalleDrawer tourId={detalleId} onClose={() => setDetalleId(null)} />
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import TourDetalleContenido, { TourDetalleSkeleton } from '@/components/detalle/TourDetalleContenido';
import { fetchTourById } from '@/data/mock-tours';
import type { Tour } from '@/data/mock-tours';

const SPRING_DRAWER = { type: 'spring', stiffness: 300, damping: 34 } as const;

interface TourDetalleDrawerProps {
  tourId: number | null;
  onClose: () => void;
}

export default function TourDetalleDrawer({ tourId, onClose }: TourDetalleDrawerProps) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [cargando, setCargando] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focoPrevioRef = useRef<HTMLElement | null>(null);

  // Carga del tour al abrir / cambiar de id
  useEffect(() => {
    if (tourId == null) return;
    let vivo = true;
    setCargando(true);
    setTour(null);
    setScrolled(false);
    scrollRef.current?.scrollTo({ top: 0 });
    fetchTourById(tourId).then((t) => {
      if (!vivo) return;
      setTour(t ?? null);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, [tourId]);

  // Esc cierra + scroll-lock + recuerda el foco de origen
  useEffect(() => {
    if (tourId == null) return;
    focoPrevioRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      focoPrevioRef.current?.focus();
    };
  }, [tourId, onClose]);

  return (
    <AnimatePresence>
      {tourId != null && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[rgba(27,36,30,0.35)]"
            aria-hidden
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={tour ? `Detalle de ${tour.nombre}` : 'Detalle de tour'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING_DRAWER}
            className="fixed inset-y-0 right-0 z-50 flex w-[480px] max-w-full flex-col border-l border-border bg-surface shadow-overlay xl:w-[560px]"
          >
            <div
              ref={scrollRef}
              onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {cargando || !tour ? (
                cargando ? (
                  <TourDetalleSkeleton />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <p className="text-h3 text-ink">Este tour ya no está en la base de datos</p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-5 h-10 rounded-r-sm bg-brand px-5 text-sm font-semibold text-white transition-colors duration-fast hover:bg-brand-hover"
                    >
                      Cerrar
                    </button>
                  </div>
                )
              ) : (
                <TourDetalleContenido tour={tour} variante="drawer" scrolled={scrolled} onCerrar={onClose} />
              )}
            </div>
            {tour && (
              <div className="shrink-0 border-t border-border bg-surface px-5 py-3">
                <Link
                  to={`/tour/${tour.id}`}
                  className="inline-flex items-center gap-1.5 text-small font-medium text-brand hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir página completa
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
