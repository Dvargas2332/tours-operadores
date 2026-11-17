/**
 * Pantalla de nueva contraseña a la que llega el enlace de recuperación de
 * Supabase. AuthContext ya procesó los tokens del hash antes de montarla.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SiteBackground from '@/components/SiteBackground';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/hooks/useBrand';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function ResetPassword() {
  const { usuario, cargando, cambiarContrasena, cerrarSesion, limpiarRecuperacion } = useAuth();
  const brand = useBrand();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      await cambiarContrasena(password);
      toast.success('Contraseña actualizada');
      limpiarRecuperacion();
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error)?.message ?? 'No se pudo actualizar la contraseña.');
    } finally {
      setEnviando(false);
    }
  };

  const volverAlLogin = async () => {
    await cerrarSesion();
    limpiarRecuperacion();
    navigate('/login', { replace: true });
  };

  const irAlLogin = () => {
    limpiarRecuperacion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-bg px-4">
      <SiteBackground />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <img src={brand.logo} alt={brand.marca} className="h-20 w-20 object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold text-[#6F4E37]">{brand.marca}</h1>
            <p className="text-small text-[#8B7355]">{brand.sitio}</p>
          </div>
        </div>

        <div className="rounded-r-lg border border-border bg-surface p-6 shadow-card">
          {cargando ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : !usuario ? (
            <div className="space-y-4 text-center">
              <KeyRound className="mx-auto h-8 w-8 text-ink-faint" />
              <h2 className="text-h3 text-ink">El enlace no es válido</h2>
              <p className="text-small text-ink-muted">
                Puede haber vencido o ya haberse usado. Pedí un enlace nuevo desde el inicio de sesión.
              </p>
              <button
                type="button"
                onClick={irAlLogin}
                className="inline-flex h-10 items-center justify-center rounded-r-sm bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <h2 className="text-h2 text-ink">Nueva contraseña</h2>
                <p className="mt-1 text-small text-ink-muted">
                  Para <span className="font-medium text-ink">{usuario}</span>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="nueva-password" className="text-label text-ink">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="nueva-password"
                    type={ver ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="h-10 w-full rounded-r-sm border border-border bg-bg px-3 pr-10 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setVer((v) => !v)}
                    tabIndex={-1}
                    aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-r-sm text-ink-muted hover:bg-surface-2 hover:text-ink"
                  >
                    {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmar-password" className="text-label text-ink">
                  Repetir contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmar-password"
                    type={ver ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="h-10 w-full rounded-r-sm border border-border bg-bg px-3 pr-10 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setVer((v) => !v)}
                    tabIndex={-1}
                    aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-r-sm text-ink-muted hover:bg-surface-2 hover:text-ink"
                  >
                    {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-caption text-danger">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-r-sm bg-brand text-sm font-semibold text-white transition-all duration-fast hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {enviando ? 'Guardando…' : 'Guardar contraseña'}
              </button>

              <button
                type="button"
                onClick={volverAlLogin}
                className="w-full text-center text-caption font-medium text-ink-muted hover:text-ink"
              >
                Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-caption text-ink-faint">
          © {new Date().getFullYear()} {brand.marca} · {brand.sitio}
        </p>
      </motion.div>
    </div>
  );
}
