/**
 * Página de detalle de operador: muestra todos los tours de un operador.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, FileText, MapPin, Package } from 'lucide-react';
import TourCard from '@/components/buscador/TourCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PdfPreview from '@/components/PdfPreview';
import { useCompare } from '@/context/CompareContext';
import { useToursData } from '@/hooks/useToursData';
import { CATEGORIA_META } from '@/lib/tour-meta';
import { cn, polizaPreviewUrl } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function OperadorDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useToursData();
  const { toggle, estaSeleccionado } = useCompare();
  const [previewAbierto, setPreviewAbierto] = useState(false);

  const operadorId = Number(id);
  const operador = useMemo(
    () => data?.operadores.find((o) => o.id === operadorId),
    [data, operadorId],
  );
  const tours = useMemo(
    () => data?.tours.filter((t) => t.operador.id === operadorId) ?? [],
    [data, operadorId],
  );

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!operador) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h2 className="text-h2 text-ink">Operador no encontrado</h2>
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

  const zonas = [...new Set(tours.map((t) => t.zona))].sort((a, b) => a.localeCompare(b, 'es'));
  const categorias = [...new Set(tours.map((t) => t.categoria))];

  return (
    <>
      <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <button
            type="button"
            onClick={() => navigate('/buscar')}
            className="inline-flex items-center gap-1.5 rounded-r-sm px-2 py-1.5 text-caption font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a buscar
          </button>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-display text-ink">{operador.nombre}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-small text-ink-muted">
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-ink-faint" />
                  {tours.length} {tours.length === 1 ? 'tour' : 'tours'}
                </span>
                {zonas.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-ink-faint" />
                    {zonas.join(', ')}
                  </span>
                )}
                {operador.poliza_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewAbierto(true)}
                    className="inline-flex items-center gap-1 rounded-r-sm bg-brand-soft px-2 py-0.5 font-medium text-brand transition-colors duration-fast hover:bg-brand hover:text-white"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Ver póliza
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categorias.map((c) => {
                const meta = CATEGORIA_META[c];
                return (
                  <span
                    key={c}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium',
                      meta.clases,
                    )}
                  >
                    <meta.icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Grid de tours */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
          className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
        >
          <AnimatePresence initial={false}>
            {tours.map((tour, i) => (
              <TourCard
                key={tour.id}
                tour={tour}
                index={i}
                vista="grid"
                seleccionado={estaSeleccionado(tour.id)}
                onToggleComparar={() => toggle(tour.id)}
                onVerDetalle={() => navigate(`/tour/${tour.id}`)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {tours.length === 0 && (
          <div className="mt-12 text-center text-small text-ink-muted">
            Este operador aún no tiene tours cargados.
          </div>
        )}
      </div>
      </div>

      <Dialog open={previewAbierto} onOpenChange={setPreviewAbierto}>
        <DialogContent className="max-w-4xl border-border bg-surface text-ink">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-h3 text-ink">Vista previa de la póliza</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            {operador.poliza_url ? <PdfPreview url={polizaPreviewUrl(operador.poliza_url)} /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
