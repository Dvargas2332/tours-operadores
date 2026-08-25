/**
 * Paso 2 del wizard: lectura real del archivo con tarifario-excel.ts.
 * Muestra el resultado (operadores y tours encontrados) y avanza a revisión.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, FileSpreadsheet } from 'lucide-react';
import type { ArchivoSubido } from '@/components/admin/cargar/tipos';
import { parsearCatalogo } from '@/components/admin/cargar/tarifario-excel';
import type { OperadorCatalogo } from '@/components/admin/cargar/tarifario-excel';
import { cn } from '@/lib/utils';

interface LineaLog {
  texto: string;
  tipo: 'ok' | 'warn';
}

interface PasoExtraccionProps {
  archivo: ArchivoSubido;
  file: File;
  onTerminado: (operadores: OperadorCatalogo[]) => void;
  onCancelar: () => void;
}

export default function PasoExtraccion({ archivo, file, onTerminado, onCancelar }: PasoExtraccionProps) {
  const [estado, setEstado] = useState<'leyendo' | 'listo' | 'error'>('leyendo');
  const [lineas, setLineas] = useState<LineaLog[]>([]);
  const [detalleAbierto, setDetalleAbierto] = useState(true);
  const avanzadoRef = useRef(false);

  useEffect(() => {
    let vivo = true;

    if (archivo.ext !== 'xlsx' && archivo.ext !== 'xls' && archivo.ext !== 'csv') {
      setEstado('error');
      setLineas([{ texto: 'Por ahora solo se soporta Excel (.xlsx, .xls, .csv).', tipo: 'warn' }]);
      return;
    }

    (async () => {
      try {
        const data = archivo.ext === 'csv' ? await file.text() : await file.arrayBuffer();
        const resultado = parsearCatalogo(data);
        if (!vivo) return;

        if (resultado.error || resultado.operadores.length === 0) {
          setEstado('error');
          setLineas([{ texto: resultado.error ?? 'No se encontraron operadores.', tipo: 'warn' }]);
          return;
        }

        const totalTours = resultado.operadores.reduce((n, op) => n + op.tours.length, 0);
        const enColones = resultado.operadores.filter((op) => op.moneda === 'crc').length;

        const logs: LineaLog[] = [
          { texto: `${resultado.operadores.length} operadores encontrados`, tipo: 'ok' },
          { texto: `${totalTours} productos con precio`, tipo: 'ok' },
          { texto: 'Columnas mapeadas a los campos del tour', tipo: 'ok' },
        ];
        if (enColones > 0) logs.push({ texto: `${enColones} operador(es) en colones (₡)`, tipo: 'warn' });
        setLineas(logs);
        setEstado('listo');

        const t = window.setTimeout(() => {
          if (!avanzadoRef.current) {
            avanzadoRef.current = true;
            onTerminado(resultado.operadores);
          }
        }, 900);
        return () => window.clearTimeout(t);
      } catch {
        if (vivo) {
          setEstado('error');
          setLineas([{ texto: 'No pudimos leer el archivo.', tipo: 'warn' }]);
        }
      }
    })();

    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titulo =
    estado === 'error'
      ? 'No pudimos leer el archivo'
      : estado === 'listo'
        ? 'Extracción completa'
        : 'Leyendo el catálogo…';

  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-r-lg border border-border bg-surface shadow-card">
        <FileSpreadsheet className={cn('h-7 w-7', estado === 'error' ? 'text-danger' : 'text-ok')} />
        {estado === 'leyendo' && (
          <motion.span
            className="absolute inset-x-2 h-[2px] rounded-full bg-brand/60"
            animate={{ top: ['15%', '85%', '15%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      <h2 className="mt-4 text-h3 text-ink" aria-live="polite">
        {titulo}
      </h2>
      <p className="mt-1 text-caption text-ink-muted">{archivo.nombre}</p>

      <div className="relative mt-5 h-1 w-full max-w-[420px] overflow-hidden rounded-full bg-brand/15">
        {estado === 'leyendo' ? (
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-brand"
            animate={{ x: ['-110%', '330%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <motion.div
            className={cn('h-full rounded-full', estado === 'error' ? 'bg-danger' : 'bg-ok')}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </div>

      <div className="mt-6 w-full max-w-[560px] rounded-r-md border border-border bg-surface text-left shadow-card">
        <button
          type="button"
          onClick={() => setDetalleAbierto((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-caption font-semibold text-ink-muted transition-colors duration-fast hover:text-ink"
        >
          Ver detalle
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-fast', detalleAbierto && 'rotate-180')} />
        </button>
        <AnimatePresence initial={false}>
          {detalleAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="max-h-[180px] space-y-1.5 overflow-y-auto border-t border-border px-4 py-3">
                {lineas.map((linea) => (
                  <p key={linea.texto} className="text-mono text-ink-muted">
                    <span className={linea.tipo === 'ok' ? 'text-ok' : 'text-warn'}>
                      {linea.tipo === 'ok' ? '✓' : '⚠'}
                    </span>{' '}
                    {linea.texto}
                  </p>
                ))}
                {estado === 'listo' && (
                  <p className="flex items-center gap-1.5 pt-1 text-mono font-semibold text-ok">
                    <CheckCircle2 className="h-4 w-4" />
                    Listo — abriendo la revisión…
                  </p>
                )}
                {estado === 'error' && (
                  <p className="flex items-center gap-1.5 pt-1 text-mono font-semibold text-danger">
                    <AlertTriangle className="h-4 w-4" />
                    Revisa el archivo e inténtalo de nuevo
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={onCancelar}
        className="mt-6 rounded-r-sm px-4 py-2 text-caption font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
      >
        {estado === 'error' ? 'Volver' : 'Cancelar'}
      </button>
    </div>
  );
}
