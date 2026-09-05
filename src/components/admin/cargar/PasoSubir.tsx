/**
 * Paso 1 del wizard: subir el archivo del catálogo (una hoja por operador).
 * Dropzone con drag&drop, barra de subida simulada y avance automático.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { metaDeFuente } from '@/components/admin/FuenteCell';
import type { ArchivoSubido } from '@/components/admin/cargar/tipos';
import { EXTENSIONES_OK, MAX_BYTES, formatBytes } from '@/components/admin/cargar/tipos';
import { cn } from '@/lib/utils';

interface PasoSubirProps {
  onArchivoListo: (archivo: ArchivoSubido, file: File) => void;
  hayBorrador: boolean;
  onContinuarBorrador: () => void;
  onDescartarBorrador: () => void;
}

export default function PasoSubir({
  onArchivoListo,
  hayBorrador,
  onContinuarBorrador,
  onDescartarBorrador,
}: PasoSubirProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActivo, setDragActivo] = useState(false);
  const [sacudir, setSacudir] = useState(0);
  const [archivo, setArchivo] = useState<ArchivoSubido | null>(null);
  const [progreso, setProgreso] = useState(0);
  const fileRef = useRef<File | null>(null);

  useEffect(() => {
    if (!archivo) return;
    if (progreso >= 100) {
      const t = window.setTimeout(() => onArchivoListo(archivo, fileRef.current!), 350);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setProgreso((p) => Math.min(100, p + 20)), 130);
    return () => window.clearTimeout(t);
  }, [archivo, progreso, onArchivoListo]);

  const aceptarArchivo = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_OK.includes(ext)) {
      setSacudir((s) => s + 1);
      toast.error(`Formato no soportado: .${ext || 'desconocido'}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setSacudir((s) => s + 1);
      toast.error('El archivo supera el máximo de 20 MB');
      return;
    }
    setProgreso(0);
    setArchivo({ nombre: file.name, tamano: file.size, ext });
    fileRef.current = file;
  };

  const metaArchivo = archivo ? metaDeFuente(archivo.nombre) : null;

  return (
    <div>
      <h2 className="text-h2 text-ink">Cargar catálogo</h2>
      <p className="mt-1 text-small text-ink-muted">
        Sube el archivo Excel del catálogo. Cada hoja se importa como un operador con sus tours y
        precios.
      </p>

      {/* Borrador pendiente */}
      {hayBorrador && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-r-sm border-l-[3px] border-brand bg-brand-soft/60 px-4 py-3">
          <p className="flex-1 text-small font-medium text-ink">Tienes una revisión pendiente sin confirmar.</p>
          <button
            type="button"
            onClick={onContinuarBorrador}
            className="rounded-r-sm bg-brand px-3 py-1.5 text-caption font-semibold text-white transition-colors duration-fast hover:bg-brand-hover"
          >
            Continuar revisión pendiente
          </button>
          <button
            type="button"
            onClick={onDescartarBorrador}
            className="rounded-r-sm px-3 py-1.5 text-caption font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
          >
            Descartar
          </button>
        </div>
      )}

      {/* Dropzone */}
      <motion.div
        key={sacudir}
        animate={sacudir > 0 ? { x: [0, -4, 4, -4, 4, 0] } : undefined}
        transition={{ duration: 0.3 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActivo(true);
        }}
        onDragLeave={() => setDragActivo(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActivo(false);
          const file = e.dataTransfer.files?.[0];
          if (file) aceptarArchivo(file);
        }}
        className={cn(
          'mt-6 flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-r-lg border-2 border-dashed px-6 py-8 text-center transition-colors duration-med',
          dragActivo ? 'border-solid border-brand bg-brand-soft' : 'border-border bg-surface',
        )}
      >
        {!archivo ? (
          <>
            <motion.img
              src="./upload-drop.svg"
              alt=""
              animate={{ scale: dragActivo ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="h-[150px] w-[200px] object-contain"
            />
            <p className="text-[15px] font-semibold text-ink">
              {dragActivo ? 'Suelta para cargar' : 'Arrastra el archivo aquí'}
            </p>
            <p className="text-small text-ink-muted">o</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-r-sm border border-border bg-surface px-4 py-2 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
            >
              Elegir archivo
            </button>
            <p className="mt-1 text-caption text-ink-faint">
              Excel (.xlsx, .xls, .csv) — máx. 20 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) aceptarArchivo(file);
                e.target.value = '';
              }}
            />
          </>
        ) : (
          metaArchivo && (
            <div className="w-full max-w-[420px]">
              <div className="flex items-center gap-3 rounded-r-md border border-border bg-surface-2/60 px-4 py-3">
                <metaArchivo.icon className={cn('h-6 w-6 shrink-0', metaArchivo.clases)} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-mono text-ink">{archivo.nombre}</p>
                  <p className="text-caption text-ink-faint">{formatBytes(archivo.tamano)}</p>
                </div>
                <span className="text-caption font-semibold text-brand tnum">{progreso}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-fast"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )
        )}
      </motion.div>

      {/* Formato soportado */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption text-ink-muted">
          <FileSpreadsheet className="h-3.5 w-3.5 text-ink-faint" />
          Excel — lectura directa, instantánea
        </span>
      </div>
    </div>
  );
}
