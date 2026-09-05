/**
 * Modal para editar un operador existente: nombre, teléfono, email, comisión y logo.
 */
import { useEffect, useState } from 'react';
import { Eye, FileText, ImageIcon, Loader2, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PdfPreview from '@/components/PdfPreview';
import { useMutation } from '@tanstack/react-query';
import { actualizarOperador, subirLogo, subirPoliza } from '@/data/mutations';
import type { Operador } from '@/data/mock-tours';
import { cn } from '@/lib/utils';

interface EditarOperadorModalProps {
  operador: Operador | null;
  open: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

export default function EditarOperadorModal({ operador, open, onClose, onGuardado }: EditarOperadorModalProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [comision, setComision] = useState('');
  const [politica, setPolitica] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [polizaFile, setPolizaFile] = useState<File | null>(null);
  const [polizaUrl, setPolizaUrl] = useState<string | null>(null);
  const [subiendoPoliza, setSubiendoPoliza] = useState(false);
  const [previewAbierto, setPreviewAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (operador) {
      setNombre(operador.nombre);
      setTelefono(operador.telefono);
      setEmail(operador.email ?? '');
      setComision(operador.comision != null ? String(operador.comision) : '');
      setPolitica(operador.politica_cancelacion || '');
      setLogoPreview(operador.logo_url || null);
      setPolizaUrl(operador.poliza_url || null);
    }
    setPolitica('');
    setLogoFile(null);
    setSubiendoLogo(false);
    setPolizaFile(null);
    setPolizaUrl(null);
    setSubiendoPoliza(false);
    setError(null);
  }, [operador, open]);

  const mutacion = useMutation({
    mutationFn: (input: Parameters<typeof actualizarOperador>[0]) => actualizarOperador(input),
    onSuccess: () => {
      onGuardado();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const handleSeleccionarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Seleccioná un archivo de imagen (JPEG, PNG, WebP, GIF o SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2 MB.');
      return;
    }
    setError(null);
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
      setError('Seleccioná un PDF o una imagen (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La póliza no debe superar los 10 MB.');
      return;
    }
    setError(null);
    setPolizaFile(file);
    setPolizaUrl(URL.createObjectURL(file));
  };

  const handleQuitarPoliza = () => {
    setPolizaFile(null);
    setPolizaUrl(null);
  };

  const guardar = async () => {
    if (!operador) return;
    setError(null);
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('El nombre es obligatorio');
      return;
    }
    const comisionNum = comision.trim() === '' ? null : Number(comision);

    let logoUrl: string | null | undefined;
    if (logoFile) {
      setSubiendoLogo(true);
      try {
        logoUrl = await subirLogo(logoFile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir el logo');
        setSubiendoLogo(false);
        return;
      }
      setSubiendoLogo(false);
    } else if (logoPreview === null) {
      logoUrl = null;
    }

    let nuevaPolizaUrl: string | null | undefined;
    if (polizaFile) {
      setSubiendoPoliza(true);
      try {
        nuevaPolizaUrl = await subirPoliza(polizaFile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir la póliza');
        setSubiendoPoliza(false);
        return;
      }
      setSubiendoPoliza(false);
    } else if (polizaUrl === null) {
      nuevaPolizaUrl = null;
    }

    const emailLimpio = email.trim();
    mutacion.mutate({
      id: operador.id,
      nombre: nombreLimpio,
      telefono: telefono.trim(),
      email: emailLimpio ? emailLimpio : null,
      comision: comisionNum,
      politicaCancelacion: politica.trim(),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(nuevaPolizaUrl !== undefined && { polizaUrl: nuevaPolizaUrl }),
    });
  };

  const isPending = mutacion.isPending || subiendoLogo || subiendoPoliza;

  const previewUrl = polizaUrl;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border-border bg-surface text-ink sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-h3 text-ink">Editar operador</DialogTitle>
          <DialogDescription className="text-small text-ink-muted">
            Actualizá el teléfono, el email, la comisión de uso interno y el logo.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
          <div>
            <Label htmlFor="op-nombre">Nombre</Label>
            <Input
              id="op-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del operador"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="op-telefono">Teléfono</Label>
            <Input
              id="op-telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+506 2479-9800"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="op-email">Email</Label>
            <Input
              id="op-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reservas@operador.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="op-comision">Comisión (%)</Label>
            <Input
              id="op-comision"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={comision}
              onChange={(e) => setComision(e.target.value)}
              placeholder="Opcional"
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="op-politica">Política de cancelación</Label>
            <p className="text-small text-ink-muted">
              Se comparte automáticamente con todos los tours de este operador.
            </p>
            <textarea
              id="op-politica"
              rows={3}
              value={politica}
              onChange={(e) => setPolitica(e.target.value)}
              placeholder="Ej: Cancelación gratuita hasta 24 horas antes..."
              className="mt-1 w-full rounded-r-sm border border-border bg-surface px-3 py-2 text-small text-ink focus:border-brand focus:outline-none"
            />
          </div>

          {/* Logo */}
          <div>
            <Label>Logo del operador</Label>
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
                    disabled={isPending}
                  />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleQuitarLogo}
                    disabled={isPending}
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

          {/* Póliza de seguro */}
          <div>
            <Label>Póliza de seguro</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-r-md border border-border bg-surface-2">
                <FileText className="h-8 w-8 text-ink-faint" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {polizaUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewAbierto(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
                    >
                      <Eye className="h-4 w-4" />
                      Ver póliza
                    </button>
                    <button
                      type="button"
                      onClick={handleQuitarPoliza}
                      disabled={isPending}
                      className="inline-flex h-9 items-center gap-1.5 rounded-r-sm px-2 text-caption font-semibold text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  </div>
                ) : null}
                <label className={cn(
                  'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand',
                  polizaUrl ? 'w-fit' : 'w-full',
                )}>
                  <FileText className="h-4 w-4" />
                  {polizaUrl ? 'Cambiar póliza' : 'Subir póliza'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleSeleccionarPoliza}
                    disabled={isPending}
                  />
                </label>
                <p className="text-caption text-ink-faint">PDF o imagen · máx. 10 MB</p>
              </div>
            </div>
          </div>

          {error && <p className="text-caption text-danger">{error}</p>}
        </div>

        <DialogFooter className="shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-10 rounded-r-sm px-4 text-[14px] font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={isPending}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-r-sm px-4 text-[14px] font-semibold text-white transition-all duration-fast',
              isPending ? 'bg-ink-faint/60' : 'bg-brand hover:-translate-y-px hover:bg-brand-hover',
            )}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Vista previa de la póliza */}
      <Dialog open={previewAbierto} onOpenChange={setPreviewAbierto}>
        <DialogContent className="max-w-4xl border-border bg-surface text-ink">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-h3 text-ink">Vista previa de la póliza</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            {previewUrl ? (
              <PdfPreview url={previewUrl} />
            ) : (
              <p className="text-small text-ink-muted">No hay póliza para mostrar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
