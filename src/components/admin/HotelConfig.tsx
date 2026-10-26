/**
 * Configuración del hotel: destino de las reservas hechas por clientes
 * (sin sesión) y fondo del sitio. Nombre, WhatsApp, email e imagen.
 */
import { useEffect, useState } from 'react';
import { Building2, ImagePlus, Loader2, Save, Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchHotel } from '@/data/mock-tours';
import { actualizarHotel, subirFondo } from '@/data/mutations';
import { cn } from '@/lib/utils';

const MAX_FONDO_BYTES = 5 * 1024 * 1024;

export default function HotelConfig({ embedded = false }: { embedded?: boolean }) {
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [fondoUrl, setFondoUrl] = useState<string | null>(null);
  const [fondoFile, setFondoFile] = useState<File | null>(null);
  const [fondoPreview, setFondoPreview] = useState<string | null>(null);
  const [errorFondo, setErrorFondo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardado, setGuardado] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchHotel()
      .then((h) => {
        if (h) {
          setNombre(h.nombre);
          setWhatsapp(h.whatsapp);
          setEmail(h.email ?? '');
          setFondoUrl(h.fondo_url ?? null);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  // Libera la vista previa local al reemplazarla o desmontar
  useEffect(() => () => {
    if (fondoPreview) URL.revokeObjectURL(fondoPreview);
  }, [fondoPreview]);

  const mutacion = useMutation({
    mutationFn: async () => {
      const url = fondoFile ? await subirFondo(fondoFile) : fondoUrl;
      await actualizarHotel({
        nombre: nombre.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim() || null,
        fondo_url: url,
      });
      return url;
    },
    onSuccess: (url) => {
      setFondoUrl(url);
      setFondoFile(null);
      setFondoPreview(null);
      setGuardado(true);
      queryClient.invalidateQueries({ queryKey: ['hotel'] });
      window.setTimeout(() => setGuardado(false), 2000);
    },
  });

  const seleccionarFondo = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorFondo('Elegí una imagen (JPG, PNG o WebP).');
      return;
    }
    if (file.size > MAX_FONDO_BYTES) {
      setErrorFondo('La imagen no puede superar 5 MB.');
      return;
    }
    setErrorFondo(null);
    setFondoFile(file);
    setFondoPreview(URL.createObjectURL(file));
  };

  const quitarFondo = () => {
    setFondoFile(null);
    setFondoPreview(null);
    setFondoUrl(null);
  };

  const mostrarFondo = fondoPreview ?? fondoUrl;

  return (
    <div
      className={cn(
        'rounded-r-md border border-border bg-surface p-4 shadow-card',
        embedded && 'border-0 bg-transparent p-0 shadow-none',
      )}
    >
      {!embedded && (
        <div className="flex items-center gap-2">
          <Building2 className="h-[18px] w-[18px] text-brand" />
          <h2 className="text-h3 text-ink">Configuración del hotel</h2>
        </div>
      )}
      <p className="mt-1 text-small text-ink-muted">
        Aquí llegan las reservas de los clientes (vista sin sesión).
      </p>

      <div className="mt-5 space-y-5">
        <section>
          <h3 className="text-label uppercase tracking-wide text-ink-muted">Datos de contacto</h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="hotel-nombre">Nombre del hotel</Label>
              <Input
                id="hotel-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Hotel ..."
                className="mt-1"
                disabled={cargando}
              />
            </div>
            <div>
              <Label htmlFor="hotel-whatsapp">WhatsApp</Label>
              <Input
                id="hotel-whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+506 8888-8888"
                className="mt-1"
                disabled={cargando}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="hotel-email">Email</Label>
              <Input
                id="hotel-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reservas@hotel.com"
                className="mt-1"
                disabled={cargando}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-border pt-5">
          <h3 className="text-label uppercase tracking-wide text-ink-muted">Apariencia del sitio</h3>
          <p className="mt-1 text-small text-ink-muted">
            Imagen de fondo que se muestra en todas las vistas, con un velo automático para mantener la
            legibilidad en tema claro y oscuro.
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-r-md border border-border bg-surface-2 sm:w-60">
              {mostrarFondo ? (
                <img src={mostrarFondo} alt="Fondo actual del sitio" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-ink-faint">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-caption">Sin imagen</span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={cn(
                    'inline-flex h-10 cursor-pointer items-center gap-2 rounded-r-sm border border-border bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand',
                    (cargando || mutacion.isPending) && 'pointer-events-none opacity-50',
                  )}
                >
                  <Upload className="h-4 w-4" />
                  {mostrarFondo ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    id="hotel-fondo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => seleccionarFondo(e.target.files?.[0] ?? null)}
                    disabled={cargando || mutacion.isPending}
                  />
                </label>
                {mostrarFondo && (
                  <button
                    type="button"
                    onClick={quitarFondo}
                    disabled={mutacion.isPending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-r-sm px-2 text-caption font-semibold text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                )}
              </div>
              <p className="text-caption text-ink-faint">
                JPG, PNG o WebP · máx. 5 MB · recomendado 1920×1080 px.
              </p>
              {errorFondo && <p className="text-caption text-danger">{errorFondo}</p>}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => mutacion.mutate()}
          disabled={mutacion.isPending || cargando}
          className="inline-flex h-10 items-center gap-2 rounded-r-sm bg-brand px-4 text-[14px] font-semibold text-white transition-all duration-fast hover:bg-brand-hover disabled:opacity-60"
        >
          {mutacion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
        {guardado && <span className="text-caption text-ok">Guardado ✓</span>}
        {mutacion.isError && (
          <span className="text-caption text-danger">
            No se pudo guardar: {(mutacion.error as Error).message}
          </span>
        )}
      </div>
    </div>
  );
}
