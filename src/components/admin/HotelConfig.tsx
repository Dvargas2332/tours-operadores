/**
 * Configuración del hotel: destino de las reservas hechas por clientes
 * (sin sesión). Nombre, WhatsApp y email.
 */
import { useEffect, useState } from 'react';
import { Building2, Loader2, Save } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchHotel } from '@/data/mock-tours';
import { actualizarHotel } from '@/data/mutations';

export default function HotelConfig() {
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    fetchHotel()
      .then((h) => {
        if (h) {
          setNombre(h.nombre);
          setWhatsapp(h.whatsapp);
          setEmail(h.email ?? '');
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const mutacion = useMutation({
    mutationFn: () =>
      actualizarHotel({
        nombre: nombre.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim() || null,
      }),
    onSuccess: () => {
      setGuardado(true);
      window.setTimeout(() => setGuardado(false), 2000);
    },
  });

  return (
    <div className="rounded-r-md border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Building2 className="h-[18px] w-[18px] text-brand" />
        <h2 className="text-h3 text-ink">Configuración del hotel</h2>
      </div>
      <p className="mt-1 text-small text-ink-muted">
        Aquí llegan las reservas de los clientes (vista sin sesión).
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
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

      <div className="mt-4 flex items-center gap-3">
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
      </div>
    </div>
  );
}
