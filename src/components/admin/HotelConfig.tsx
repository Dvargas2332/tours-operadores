/**
 * Configuración del hotel: identidad de marca (logo y nombres), destino de
 * las reservas hechas por clientes, contacto y fondo del sitio.
 */
import { useEffect, useState } from 'react';
import { Building2, ImagePlus, Loader2, Mail, Palette, Save, Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchHotel } from '@/data/mock-tours';
import { actualizarHotel, subirFondo, subirLogo } from '@/data/mutations';
import { LOGO_MARCA_DEFAULT, MARCA_DEFAULT } from '@/hooks/useBrand';
import { cn } from '@/lib/utils';

const MAX_FONDO_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function HotelConfig({ embedded = false }: { embedded?: boolean }) {
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState(MARCA_DEFAULT);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errorLogo, setErrorLogo] = useState<string | null>(null);
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
          setMarca(h.marca || MARCA_DEFAULT);
          setWhatsapp(h.whatsapp);
          setEmail(h.email ?? '');
          setLogoUrl(h.logo_url ?? null);
          setFondoUrl(h.fondo_url ?? null);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  // Libera las vistas previas locales al reemplazarlas o desmontar.
  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);
  useEffect(() => () => {
    if (fondoPreview) URL.revokeObjectURL(fondoPreview);
  }, [fondoPreview]);

  const mutacion = useMutation({
    mutationFn: async () => {
      const logo = logoFile ? await subirLogo(logoFile) : logoUrl;
      const url = fondoFile ? await subirFondo(fondoFile) : fondoUrl;
      await actualizarHotel({
        nombre: nombre.trim(),
        marca: marca.trim() || MARCA_DEFAULT,
        whatsapp: whatsapp.trim(),
        email: email.trim() || null,
        logo_url: logo,
        fondo_url: url,
      });
      return { logo, url };
    },
    onSuccess: ({ logo, url }) => {
      setLogoUrl(logo);
      setLogoFile(null);
      setLogoPreview(null);
      setFondoUrl(url);
      setFondoFile(null);
      setFondoPreview(null);
      setGuardado(true);
      queryClient.invalidateQueries({ queryKey: ['hotel'] });
      window.setTimeout(() => setGuardado(false), 2000);
    },
  });

  const seleccionarLogo = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorLogo('Elegí una imagen (JPG, PNG o WebP).');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setErrorLogo('El logo no puede superar 2 MB.');
      return;
    }
    setErrorLogo(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const quitarLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
  };

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

  const mostrarLogo = logoPreview ?? logoUrl ?? LOGO_MARCA_DEFAULT;
  const mostrarFondo = fondoPreview ?? fondoUrl;
  const logoPersonalizado = Boolean(logoPreview || logoUrl);

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
        Identidad del sitio, datos de contacto y apariencia. Aquí llegan las reservas de los clientes.
      </p>

      <div className="mt-5 space-y-4">
        {/* Identidad de marca */}
        <section className="rounded-r-md border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-r-sm bg-brand-soft text-brand">
              <Building2 className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-h3 text-ink">Identidad de marca</h3>
              <p className="mt-0.5 text-small text-ink-muted">
                Este logo y estos nombres se usan en la cabecera, el login y los PDFs de políticas.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <div className="w-full shrink-0 sm:w-32">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-r-md border border-border bg-surface-2">
                <img src={mostrarLogo} alt={marca || MARCA_DEFAULT} className="h-full w-full object-contain" />
              </div>
              <label
                className={cn(
                  'mt-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-r-sm border border-border bg-surface px-2.5 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand',
                  (cargando || mutacion.isPending) && 'pointer-events-none opacity-50',
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                {logoPersonalizado ? 'Cambiar' : 'Subir logo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => seleccionarLogo(e.target.files?.[0] ?? null)}
                  disabled={cargando || mutacion.isPending}
                />
              </label>
              {logoPersonalizado && (
                <button
                  type="button"
                  onClick={quitarLogo}
                  disabled={mutacion.isPending}
                  className="mt-1.5 inline-flex h-7 items-center gap-1 rounded-r-sm px-1.5 text-caption font-semibold text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              )}
              <p className="mt-1 text-caption text-ink-faint">JPG, PNG o WebP · máx. 2 MB.</p>
              {errorLogo && <p className="text-caption text-danger">{errorLogo}</p>}
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="hotel-marca">Marca</Label>
                <Input
                  id="hotel-marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder={MARCA_DEFAULT}
                  className="mt-1"
                  disabled={cargando}
                />
              </div>
              <div>
                <Label htmlFor="hotel-nombre">Nombre del sitio / hotel</Label>
                <Input
                  id="hotel-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Lavas Tacotal"
                  className="mt-1"
                  disabled={cargando}
                />
              </div>
              <p className="text-caption text-ink-muted sm:col-span-2">
                Si dejás el logo vacío, se usa el volcán de Lavas Tacotal.
              </p>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="rounded-r-md border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-r-sm bg-brand-soft text-brand">
              <Mail className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-h3 text-ink">Datos de contacto</h3>
              <p className="mt-0.5 text-small text-ink-muted">
                Destino de las reservas que hacen los clientes sin sesión.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            <div>
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

        {/* Apariencia */}
        <section className="rounded-r-md border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-r-sm bg-brand-soft text-brand">
              <Palette className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-h3 text-ink">Apariencia del sitio</h3>
              <p className="mt-0.5 text-small text-ink-muted">
                Imagen de fondo global, con un velo automático para mantener la legibilidad.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
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
                    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-r-sm border border-border bg-surface px-3 text-caption font-semibold text-ink transition-colors duration-fast hover:border-brand hover:text-brand',
                    (cargando || mutacion.isPending) && 'pointer-events-none opacity-50',
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
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
                    className="inline-flex h-8 items-center gap-1.5 rounded-r-sm px-2 text-caption font-semibold text-danger transition-colors duration-fast hover:bg-danger/10 disabled:opacity-50"
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
          Guardar cambios
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
