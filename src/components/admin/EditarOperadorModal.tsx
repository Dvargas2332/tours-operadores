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
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@tanstack/react-query';
import { actualizarOperador, subirLogo, subirPoliza } from '@/data/mutations';
import type { Operador } from '@/data/mock-tours';
import { cn } from '@/lib/utils';
import { abrirPoliza } from '@/lib/polizas';

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
  const [horario, setHorario] = useState('');
  const [conIva, setConIva] = useState(false);
  const [pagoCompraclic, setPagoCompraclic] = useState(false);
  const [pagoSinpe, setPagoSinpe] = useState(false);
  const [pagoTransferencia, setPagoTransferencia] = useState(false);
  const [pagoCxc, setPagoCxc] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [polizaFile, setPolizaFile] = useState<File | null>(null);
  const [polizaUrl, setPolizaUrl] = useState<string | null>(null);
  const [subiendoPoliza, setSubiendoPoliza] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (operador) {
      setNombre(operador.nombre);
      setTelefono(operador.telefono);
      setEmail(operador.email ?? '');
      setComision(operador.comision != null ? String(operador.comision) : '');
      setPolitica(operador.politica_cancelacion || '');
      setHorario(operador.horario || '');
      setConIva(operador.con_iva);
      setPagoCompraclic(operador.pago_compraclic);
      setPagoSinpe(operador.pago_sinpe);
      setPagoTransferencia(operador.pago_transferencia);
      setPagoCxc(operador.pago_cxc);
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
      horario: horario.trim(),
      conIva,
      pagoCompraclic,
      pagoSinpe,
      pagoTransferencia,
      pagoCxc,
      ...(logoUrl !== undefined && { logoUrl }),
      ...(nuevaPolizaUrl !== undefined && { polizaUrl: nuevaPolizaUrl }),
    });
  };

  const isPending = mutacion.isPending || subiendoLogo || subiendoPoliza;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border-border bg-surface text-ink sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-h3 text-ink">Editar operador</DialogTitle>
          <DialogDescription className="text-small text-ink-muted">
            Datos de contacto, comisión, formas de pago y archivos del operador.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
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
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <div className="grid gap-3 sm:grid-cols-[110px_170px_minmax(0,1fr)] sm:items-end">
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
            <div
              className="flex h-9 items-center justify-between gap-2 rounded-r-sm border border-border bg-surface-2 px-2.5"
              title="Suma el 13% de IVA a las tarifas rack y neta"
            >
              <Label htmlFor="op-con-iva" className="cursor-pointer text-small font-medium text-ink">
                Con IVA 13%
              </Label>
              <Switch
                id="op-con-iva"
                checked={conIva}
                onCheckedChange={setConIva}
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="op-horario">Horario del operador</Label>
              <Input
                id="op-horario"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                placeholder="Ej: Todos los días de 7:00 a.m. a 5:00 p.m."
                className="mt-1"
              />
            </div>
          </div>
          <div className="rounded-r-sm border border-border bg-surface-2 px-3.5 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-label uppercase tracking-wide text-ink-muted">Formas de pago</p>
              <p className="text-caption text-ink-muted">Solo para el vendedor</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
              {[
                { id: 'op-pago-compraclic', label: 'Compraclic', checked: pagoCompraclic, onChange: setPagoCompraclic },
                { id: 'op-pago-sinpe', label: 'SINPE Móvil', checked: pagoSinpe, onChange: setPagoSinpe },
                { id: 'op-pago-transferencia', label: 'Transferencia', checked: pagoTransferencia, onChange: setPagoTransferencia },
                { id: 'op-pago-cxc', label: 'CxC (crédito)', checked: pagoCxc, onChange: setPagoCxc },
              ].map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <Label htmlFor={p.id} className="cursor-pointer text-small font-medium text-ink">
                    {p.label}
                  </Label>
                  <Switch
                    id={p.id}
                    checked={p.checked}
                    onCheckedChange={p.onChange}
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Label htmlFor="op-politica">Política de cancelación</Label>
              <p className="text-caption text-ink-muted">Se comparte con todos sus tours.</p>
            </div>
            <textarea
              id="op-politica"
              rows={2}
              value={politica}
              onChange={(e) => setPolitica(e.target.value)}
              placeholder="Ej: Cancelación gratuita hasta 24 horas antes..."
              className="mt-1 w-full rounded-r-sm border border-border bg-surface px-3 py-2 text-small text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 rounded-r-sm border border-border bg-surface-2 px-2.5 py-2"
              title="JPEG, PNG, WebP, GIF o SVG · máx. 2 MB"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-r-sm border border-border bg-surface">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Vista previa del logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-ink-faint" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label uppercase tracking-wide text-ink-faint">Logo</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <label className="inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-r-sm border border-border bg-surface px-2 text-[11px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand">
                    <ImageIcon className="h-3 w-3" />
                    {logoPreview ? 'Cambiar' : 'Subir'}
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
                      aria-label="Quitar logo"
                      title="Quitar logo"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Póliza de seguro */}
            <div
              className="flex items-center gap-2.5 rounded-r-sm border border-border bg-surface-2 px-2.5 py-2"
              title="PDF o imagen · máx. 10 MB"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-r-sm border border-border bg-surface">
                <FileText className="h-5 w-5 text-ink-faint" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label uppercase tracking-wide text-ink-faint">Póliza</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {polizaUrl && (
                    <button
                      type="button"
                      onClick={() => void abrirPoliza(polizaUrl)}
                      aria-label="Ver póliza"
                      title="Ver póliza"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm border border-border bg-surface text-ink transition-colors duration-fast hover:border-brand hover:text-brand"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <label className="inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-r-sm border border-border bg-surface px-2 text-[11px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand">
                    <FileText className="h-3 w-3" />
                    {polizaUrl ? 'Cambiar' : 'Subir'}
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleSeleccionarPoliza}
                      disabled={isPending}
                    />
                  </label>
                  {polizaUrl && (
                    <button
                      type="button"
                      onClick={handleQuitarPoliza}
                      disabled={isPending}
                      aria-label="Quitar póliza"
                      title="Quitar póliza"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-r-sm text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
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
    </>
  );
}
