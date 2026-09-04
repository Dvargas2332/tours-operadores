/**
 * Pantalla de inicio de sesión (`/login`). Valida contra el backend y al
 * entrar redirige a la ruta de origen (o al buscador por defecto).
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(usuario, contrasena);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error)?.message ?? 'No pudimos iniciar sesión');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo/volcan.png" alt="Tours Operadores" className="h-24 w-24 object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold text-[#6F4E37]">Tours Operadores</h1>
            <p className="text-small text-[#8B7355]">Lavas Tacotal</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-r-lg border border-border bg-surface p-6 shadow-card"
        >
          <div className="space-y-1.5">
            <label htmlFor="usuario" className="text-label text-ink">
              Usuario
            </label>
            <input
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
              className="h-10 w-full rounded-r-sm border border-border bg-bg px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contrasena" className="text-label text-ink">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
              className="h-10 w-full rounded-r-sm border border-border bg-bg px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
            />
          </div>

          {error && <p className="text-caption text-danger">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-r-sm bg-brand text-sm font-semibold text-white transition-all duration-fast hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
