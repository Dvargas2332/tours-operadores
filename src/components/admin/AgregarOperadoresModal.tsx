/**
 * Modal "Agregar operadores (Excel)" — tab Operadores de Administración.
 * Flujo de 3 pasos en el mismo modal:
 *   1) Subida: dropzone .xlsx/.xls/.csv, parseo en el cliente con SheetJS.
 *   2) Vista previa: tabla editable mínima con validación por fila.
 *   3) Confirmación: resumen de creados/actualizados (upsert por nombre).
 * Columnas esperadas (primera hoja): nombre (req.), telefono, email, comision (0–100).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Building2, CheckCircle2, Download, Eye, FileSpreadsheet, FileText, ImageIcon, Trash2, UploadCloud, X } from 'lucide-react';
import { parsearArchivo, parseComision, validar } from '@/components/admin/operadores-excel';
import type { FilaExcel } from '@/components/admin/operadores-excel';
import { trpc } from '@/providers/trpc';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Paso = 'subida' | 'preview' | 'exito';


/* ------------------------------------------------------------------ */
/* Plantilla CSV                                                       */
/* ------------------------------------------------------------------ */

function descargarPlantilla() {
  const csv = [
    'nombre,telefono,email,comision',
    'Sunset Tours,+506 2479-9800,reservas@sunset.cr,15',
    'Ecoterra Costa Rica,+506 2479-1234,reservas@ecoterracr.com,',
  ].join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-operadores.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

interface AgregarOperadoresModalProps {
  open: boolean;
  onClose: () => void;
  onGuardado: () => void; // refrescar datos de Admin
}

export default function AgregarOperadoresModal({ open, onClose, onGuardado }: AgregarOperadoresModalProps) {
  const [paso, setPaso] = useState<Paso>('subida');
  const [filas, setFilas] = useState<FilaExcel[]>([]);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number } | null>(null);
  const [dragActivo, setDragActivo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modo manual (uno a uno) vs Excel
  const [modo, setModo] = useState<'manual' | 'excel'>('manual');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaComision, setNuevaComision] = useState('');
  const [nuevaPolitica, setNuevaPolitica] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [polizaFile, setPolizaFile] = useState<File | null>(null);
  const [polizaPreview, setPolizaPreview] = useState<string | null>(null);
  const [subiendoPoliza, setSubiendoPoliza] = useState(false);

  const mutacion = trpc.tours.crearOperadores.useMutation({
    onSuccess: (res) => {
      setResultado(res);
      setPaso('exito');
      onGuardado(); // recargar operadores/tours en Admin
    },
    onError: (err) => setErrorEnvio(err.message),
  });

  // Reset al abrir
  useEffect(() => {
    if (!open) return;
    setPaso('subida');
    setFilas([]);
    setErrorArchivo(null);
    setErrorEnvio(null);
    setResultado(null);
    setDragActivo(false);
    setNuevoNombre('');
    setNuevoTelefono('');
    setNuevoEmail('');
    setNuevaComision('');
    setNuevaPolitica('');
    setLogoFile(null);
    setLogoPreview(null);
    setSubiendoLogo(false);
    setPolizaFile(null);
    setPolizaPreview(null);
    setSubiendoPoliza(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const aceptarArchivo = useCallback(async (file: File) => {
    setErrorArchivo(null);
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setErrorArchivo('Formato no soportado. Sube un .xlsx, .xls o .csv.');
      return;
    }
    try {
      const data: ArrayBuffer | string = file.name.toLowerCase().endsWith('.csv')
        ? await file.text()
        : await file.arrayBuffer();
      const { filas: nuevas, error } = parsearArchivo(data);
      if (error) {
        setErrorArchivo(error);
        return;
      }
      setFilas(nuevas);
      setPaso('preview');
    } catch {
      setErrorArchivo('No pudimos leer el archivo. Verifica que no esté dañado.');
    }
  }, []);

  const validadas = filas.map(validar);
  const validas = validadas.filter((f) => f.errores.length === 0);

  const editarFila = (key: number, campo: 'nombre' | 'telefono' | 'email' | 'comision', valor: string) => {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  };

  const quitarFila = (key: number) => {
    setFilas((prev) => prev.filter((f) => f.key !== key));
  };

  const confirmar = () => {
    if (validas.length === 0 || mutacion.isPending) return;
    setErrorEnvio(null);
    mutacion.mutate({
      operadores: validas.map((f) => ({
        nombre: f.nombre,
        telefono: f.telefono,
        email: f.email || null,
        comision: f.comisionNum,
      })),
    });
  };

  const titulos: Record<Paso, string> = {
    subida: 'Agregar operadores desde Excel',
    preview: 'Revisa los operadores',
    exito: 'Operadores guardados',
  };

  const handleSeleccionarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorEnvio('Seleccioná un archivo de imagen (JPEG, PNG, WebP, GIF o SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorEnvio('La imagen no debe superar los 2 MB.');
      return;
    }
    setErrorEnvio(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleQuitarLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSeleccionarPoliza = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setErrorEnvio('Seleccioná un PDF o una imagen (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorEnvio('La póliza no debe superar los 10 MB.');
      return;
    }
    setErrorEnvio(null);
    setPolizaFile(file);
    setPolizaPreview(URL.createObjectURL(file));
  };

  const handleQuitarPoliza = () => {
    setPolizaFile(null);
    setPolizaPreview(null);
  };

  const crearManual = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) {
      setErrorEnvio('Escribe el nombre del operador');
      return;
    }
    const comision = parseComision(nuevaComision);
    if (comision !== null && (Number.isNaN(comision) || comision < 0 || comision > 100)) {
      setErrorEnvio('Comisión inválida (debe estar entre 0 y 100)');
      return;
    }
    setErrorEnvio(null);

    let logoUrl: string | null = null;
    if (logoFile) {
      setSubiendoLogo(true);
      try {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const res = await fetch('/api/upload/operador-logo', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al subir el logo');
        logoUrl = data.logoUrl;
      } catch (err) {
        setErrorEnvio(err instanceof Error ? err.message : 'Error al subir el logo');
        setSubiendoLogo(false);
        return;
      }
      setSubiendoLogo(false);
    }

    let polizaUrl: string | null = null;
    if (polizaFile) {
      setSubiendoPoliza(true);
      try {
        const formData = new FormData();
        formData.append('poliza', polizaFile);
        const res = await fetch('/api/upload/operador-poliza', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al subir la póliza');
        polizaUrl = data.polizaUrl;
      } catch (err) {
        setErrorEnvio(err instanceof Error ? err.message : 'Error al subir la póliza');
        setSubiendoPoliza(false);
        return;
      }
      setSubiendoPoliza(false);
    }

    mutacion.mutate({
      operadores: [
        {
          nombre,
          telefono: nuevoTelefono.trim(),
          email: nuevoEmail.trim() || null,
          comision: comision !== null && !Number.isNaN(comision) ? comision : null,
          politicaCancelacion: nuevaPolitica.trim(),
          logoUrl,
          polizaUrl,
        },
      ],
    });
  };

  const titulo =
    modo === 'manual' ? (paso === 'exito' ? 'Operador guardado' : 'Agregar operador') : titulos[paso];

  return (
    <AnimatePresence>
      {open && (
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
          <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh]">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Agregar operadores desde Excel"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="pointer-events-auto flex max-h-[80vh] w-full max-w-[680px] flex-col overflow-hidden rounded-r-lg border border-border bg-surface shadow-overlay"
            >
              {/* Encabezado */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-brand" />
                <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{titulo}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Toggle Manual / Excel */}
              <div className="flex gap-1 border-b border-border px-4 py-2">
                {(
                  [
                    { id: 'manual', label: 'Manual', icon: Building2 },
                    { id: 'excel', label: 'Desde Excel', icon: FileSpreadsheet },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setModo(t.id);
                      setPaso('subida');
                      setErrorEnvio(null);
                      setErrorArchivo(null);
                    }}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-caption font-semibold transition-colors duration-fast',
                      modo === t.id ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Modo manual: formulario simple */}
              {paso === 'subida' && modo === 'manual' && (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-label uppercase tracking-wide text-ink-muted">Nombre *</label>
                      <input
                        type="text"
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        placeholder="Ej. Sunset Tours"
                        className="mt-1 h-10 w-full rounded-r-sm border border-border bg-surface px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-label uppercase tracking-wide text-ink-muted">Teléfono</label>
                      <input
                        type="text"
                        value={nuevoTelefono}
                        onChange={(e) => setNuevoTelefono(e.target.value)}
                        placeholder="+506 2479-9800"
                        className="mt-1 h-10 w-full rounded-r-sm border border-border bg-surface px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-label uppercase tracking-wide text-ink-muted">Email</label>
                      <input
                        type="email"
                        value={nuevoEmail}
                        onChange={(e) => setNuevoEmail(e.target.value)}
                        placeholder="reservas@operador.com"
                        className="mt-1 h-10 w-full rounded-r-sm border border-border bg-surface px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-label uppercase tracking-wide text-ink-muted">Comisión %</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={nuevaComision}
                        onChange={(e) => setNuevaComision(e.target.value)}
                        placeholder="Ej. 15"
                        className="mt-1 h-10 w-full rounded-r-sm border border-border bg-surface px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand tnum"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-label uppercase tracking-wide text-ink-muted">Política de cancelación</label>
                      <p className="text-caption text-ink-muted">Se comparte con todos los tours de este operador.</p>
                      <textarea
                        value={nuevaPolitica}
                        onChange={(e) => setNuevaPolitica(e.target.value)}
                        placeholder="Ej: Cancelación gratuita hasta 24 horas antes..."
                        rows={3}
                        className="mt-1 w-full rounded-r-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
                      />
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="text-label uppercase tracking-wide text-ink-muted">Logo</label>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-r-md border border-border bg-surface-2">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Vista previa del logo"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-ink-faint" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand">
                            <ImageIcon className="h-4 w-4" />
                            {logoPreview ? 'Cambiar imagen' : 'Subir logo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleSeleccionarLogo}
                              disabled={mutacion.isPending || subiendoLogo}
                            />
                          </label>
                          {logoPreview && (
                            <button
                              type="button"
                              onClick={handleQuitarLogo}
                              disabled={mutacion.isPending || subiendoLogo}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-r-sm text-caption font-semibold text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Quitar logo
                            </button>
                          )}
                          <p className="text-caption text-ink-faint">JPEG, PNG, WebP, GIF o SVG · máx. 2 MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Póliza */}
                    <div>
                      <label className="text-label uppercase tracking-wide text-ink-muted">Póliza de seguro</label>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-r-md border border-border bg-surface-2">
                          <FileText className="h-8 w-8 text-ink-faint" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          {polizaPreview ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={polizaPreview}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
                              >
                                <Eye className="h-4 w-4" />
                                Ver póliza
                              </a>
                              <button
                                type="button"
                                onClick={handleQuitarPoliza}
                                disabled={mutacion.isPending || subiendoLogo || subiendoPoliza}
                                className="inline-flex h-9 items-center gap-1.5 rounded-r-sm px-2 text-caption font-semibold text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Quitar
                              </button>
                            </div>
                          ) : null}
                          <label className={cn(
                            'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand',
                            polizaPreview ? 'w-fit' : 'w-full',
                          )}>
                            <FileText className="h-4 w-4" />
                            {polizaPreview ? 'Cambiar póliza' : 'Subir póliza'}
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={handleSeleccionarPoliza}
                              disabled={mutacion.isPending || subiendoLogo || subiendoPoliza}
                            />
                          </label>
                          <p className="text-caption text-ink-faint">PDF o imagen · máx. 10 MB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {errorEnvio && (
                    <div className="mt-3 flex items-start gap-2 rounded-r-sm border border-danger/30 bg-danger/[0.08] px-3 py-2.5">
                      <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-danger" />
                      <p className="text-small text-ink">{errorEnvio}</p>
                    </div>
                  )}

                  <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-9 rounded-r-sm px-3 text-caption font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={crearManual}
                      disabled={mutacion.isPending || subiendoLogo || subiendoPoliza}
                      className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-brand px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover disabled:opacity-50"
                    >
                      {mutacion.isPending || subiendoLogo || subiendoPoliza ? 'Guardando…' : 'Guardar operador'}
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 1 (Excel): Subida */}
              {paso === 'subida' && modo === 'excel' && (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div
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
                      'flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-r-lg border-2 border-dashed px-6 py-8 text-center transition-colors duration-med',
                      dragActivo ? 'border-solid border-brand bg-brand-soft' : 'border-border bg-surface',
                    )}
                  >
                    <UploadCloud className="h-8 w-8 text-ink-faint" />
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
                    <p className="mt-1 text-caption text-ink-faint">Excel (.xlsx, .xls) o CSV — primera hoja</p>
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
                  </div>

                  {errorArchivo && (
                    <div className="mt-3 flex items-start gap-2 rounded-r-sm border border-danger/30 bg-danger/[0.08] px-3 py-2.5">
                      <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-danger" />
                      <p className="text-small text-ink">{errorArchivo}</p>
                    </div>
                  )}

                  {/* Formato esperado + plantilla */}
                  <div className="mt-4 rounded-r-sm bg-surface-2 px-4 py-3">
                    <p className="text-caption text-ink-muted">
                      Formato esperado (primera fila = encabezados): <strong className="text-ink">nombre</strong> (requerido),{' '}
                      <strong className="text-ink">telefono</strong>, <strong className="text-ink">email</strong> y{' '}
                      <strong className="text-ink">comision</strong> (opcionales, 0–100). También se acepta la columna legacy{' '}
                      <strong className="text-ink">contacto</strong>. Si un operador ya existe, se actualiza en vez de duplicarse.
                    </p>
                    <button
                      type="button"
                      onClick={descargarPlantilla}
                      className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-r-sm border border-border bg-surface px-2.5 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar plantilla
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Vista previa */}
              {paso === 'preview' && (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <p className="text-small text-ink-muted">
                      <strong className="text-ink">{validas.length}</strong>{' '}
                      {validas.length === 1 ? 'operador válido' : 'operadores válidos'}
                      {validadas.length - validas.length > 0 && (
                        <span className="text-danger"> · {validadas.length - validas.length} con errores (no se guardarán)</span>
                      )}
                      . Puedes editar o quitar filas antes de confirmar.
                    </p>
                    <div className="mt-3 overflow-hidden rounded-r-md border border-border">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border bg-surface">
                            <th className="px-3 py-2 text-label uppercase tracking-wide text-ink-muted">Nombre</th>
                            <th className="w-[140px] px-3 py-2 text-label uppercase tracking-wide text-ink-muted">Teléfono</th>
                            <th className="w-[160px] px-3 py-2 text-label uppercase tracking-wide text-ink-muted">Email</th>
                            <th className="w-[90px] px-3 py-2 text-label uppercase tracking-wide text-ink-muted">Comisión %</th>
                            <th className="w-[44px] px-2 py-2" aria-label="Quitar" />
                          </tr>
                        </thead>
                        <tbody>
                          {validadas.map((f) => (
                            <tr
                              key={f.key}
                              className={cn(
                                'border-b border-border last:border-0',
                                f.errores.length > 0 && 'bg-danger/[0.04]',
                              )}
                            >
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  value={f.nombre}
                                  onChange={(e) => editarFila(f.key, 'nombre', e.target.value)}
                                  placeholder="Nombre del operador"
                                  className="h-8 w-full rounded-r-sm border border-transparent bg-transparent px-1.5 text-[14px] text-ink outline-none transition-colors duration-fast hover:border-border focus:border-brand focus:bg-surface"
                                />
                                {f.errores.map((err) => (
                                  <p key={err} className="px-1.5 text-caption text-danger">
                                    {err}
                                  </p>
                                ))}
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  value={f.telefono}
                                  onChange={(e) => editarFila(f.key, 'telefono', e.target.value)}
                                  placeholder="Teléfono"
                                  className="h-8 w-full rounded-r-sm border border-transparent bg-transparent px-1.5 text-[14px] text-ink outline-none transition-colors duration-fast hover:border-border focus:border-brand focus:bg-surface"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="email"
                                  value={f.email}
                                  onChange={(e) => editarFila(f.key, 'email', e.target.value)}
                                  placeholder="Email"
                                  className="h-8 w-full rounded-r-sm border border-transparent bg-transparent px-1.5 text-[14px] text-ink outline-none transition-colors duration-fast hover:border-border focus:border-brand focus:bg-surface"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={f.comision}
                                  onChange={(e) => editarFila(f.key, 'comision', e.target.value)}
                                  placeholder="—"
                                  className="h-8 w-full rounded-r-sm border border-transparent bg-transparent px-1.5 text-[14px] text-ink outline-none transition-colors duration-fast hover:border-border focus:border-brand focus:bg-surface tnum"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <button
                                  type="button"
                                  onClick={() => quitarFila(f.key)}
                                  aria-label={`Quitar ${f.nombre || 'fila'}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-r-sm text-ink-faint transition-colors duration-fast hover:bg-danger/10 hover:text-danger"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {errorEnvio && (
                      <div className="mt-3 flex items-start gap-2 rounded-r-sm border border-danger/30 bg-danger/[0.08] px-3 py-2.5">
                        <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-danger" />
                        <p className="text-small text-ink">No pudimos guardar: {errorEnvio}</p>
                      </div>
                    )}
                  </div>

                  {/* Pie */}
                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPaso('subida');
                        setErrorEnvio(null);
                      }}
                      className="h-9 rounded-r-sm px-3 text-caption font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={confirmar}
                      disabled={validas.length === 0 || mutacion.isPending}
                      className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-brand px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {mutacion.isPending ? 'Guardando…' : `Confirmar ${validas.length} ${validas.length === 1 ? 'operador' : 'operadores'}`}
                    </button>
                  </div>
                </>
              )}

              {/* Paso 3: Éxito */}
              {paso === 'exito' && resultado && (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ok/10">
                    <CheckCircle2 className="h-7 w-7 text-ok" />
                  </div>
                  <h3 className="mt-4 text-h3 text-ink">
                    {resultado.creados} {resultado.creados === 1 ? 'operador agregado' : 'operadores agregados'}
                    {resultado.actualizados > 0 && (
                      <>
                        , {resultado.actualizados} {resultado.actualizados === 1 ? 'actualizado' : 'actualizados'}
                      </>
                    )}
                  </h3>
                  <p className="mt-2 max-w-[380px] text-small text-ink-muted">
                    Ya puedes cargar sus tarifarios desde «Actualizar» en la tabla de operadores.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 h-10 rounded-r-sm bg-brand px-5 text-[14px] font-semibold text-white transition-all duration-fast hover:-translate-y-px hover:bg-brand-hover"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
