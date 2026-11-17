/**
 * Pantalla de inicio de sesión (`/login`). Valida contra Supabase Auth y al
 * entrar redirige a la ruta de origen (o al buscador por defecto).
 * Incluye recuperación de contraseña por correo con Supabase.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, Loader2, LogIn, Mail } from 'lucide-react';
import SiteBackground from '@/components/SiteBackground';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/hooks/useBrand';
import { useI18n } from '@/i18n';

export default function Login() {
  const { iniciarSesion, recuperarContrasena } = useAuth();
  const { t } = useI18n();
  const brand = useBrand();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [recuperarAbierto, setRecuperarAbierto] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false);
  const [mensajeRecuperar, setMensajeRecuperar] = useState<string | null>(null);
  const [errorRecuperar, setErrorRecuperar] = useState<string | null>(null);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(email, contrasena);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error)?.message ?? t('shell.login.error_generico'));
    } finally {
      setEnviando(false);
    }
  };

  const abrirRecuperar = () => {
    setEmailRecuperar(email);
    setMensajeRecuperar(null);
    setErrorRecuperar(null);
    setRecuperarAbierto(true);
  };

  const onRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRecuperar(null);
    setMensajeRecuperar(null);
    if (!emailRecuperar.trim()) {
      setErrorRecuperar('Escribí el correo de tu cuenta.');
      return;
    }
    setEnviandoRecuperar(true);
    try {
      await recuperarContrasena(emailRecuperar);
      setMensajeRecuperar(
        'Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña. Revisá también el spam.',
      );
    } catch (err) {
      setErrorRecuperar((err as Error)?.message ?? 'No se pudo enviar el enlace.');
    } finally {
      setEnviandoRecuperar(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-[100dvh] items-center justify-center bg-bg px-4">
        <SiteBackground />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <img src={brand.logo} alt={brand.marca} className="h-24 w-24 object-contain" />
            <div>
              <h1 className="font-display text-2xl font-bold text-[#6F4E37]">{brand.marca}</h1>
              <p className="text-small text-[#8B7355]">{brand.sitio}</p>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-r-lg border border-border bg-surface p-6 shadow-card"
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-label text-ink">
                {t('shell.login.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={t('shell.login.email_placeholder')}
                required
                className="h-10 w-full rounded-r-sm border border-border bg-bg px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contrasena" className="text-label text-ink">
                {t('shell.login.contrasena')}
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  type={verContrasena ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-10 w-full rounded-r-sm border border-border bg-bg px-3 pr-10 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  tabIndex={-1}
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-r-sm text-ink-muted hover:bg-surface-2 hover:text-ink"
                >
                  {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={abrirRecuperar}
                  className="text-caption font-medium text-brand hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {error && <p className="text-caption text-danger">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-r-sm bg-brand text-sm font-semibold text-white transition-all duration-fast hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {enviando ? t('shell.login.entrando') : t('shell.login.entrar')}
            </button>
          </form>

          <p className="mt-6 text-center text-caption text-ink-faint">
            © {new Date().getFullYear()} {brand.marca} · by Kazehana Cloud
          </p>
        </motion.div>
      </div>

      <Dialog open={recuperarAbierto} onOpenChange={setRecuperarAbierto}>
        <DialogContent className="border-border bg-surface text-ink sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-h3 text-ink">Recuperar contraseña</DialogTitle>
            <DialogDescription className="text-small text-ink-muted">
              Escribí el correo de tu cuenta y te enviaremos un enlace para crear una nueva.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onRecuperar} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email-recuperar" className="text-label text-ink">
                Email
              </label>
              <input
                id="email-recuperar"
                type="email"
                value={emailRecuperar}
                onChange={(e) => setEmailRecuperar(e.target.value)}
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                required
                className="h-10 w-full rounded-r-sm border border-border bg-bg px-3 text-sm text-ink outline-none transition-colors duration-fast focus:border-brand"
              />
            </div>

            {mensajeRecuperar && (
              <p className="rounded-r-sm bg-brand-soft px-3 py-2 text-caption text-brand">
                {mensajeRecuperar}
              </p>
            )}
            {errorRecuperar && <p className="text-caption text-danger">{errorRecuperar}</p>}

            <button
              type="submit"
              disabled={enviandoRecuperar}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-r-sm bg-brand text-sm font-semibold text-white transition-all duration-fast hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
            >
              {enviandoRecuperar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {enviandoRecuperar ? 'Enviando…' : 'Enviar enlace'}
            </button>

            <button
              type="button"
              onClick={() => setRecuperarAbierto(false)}
              className="flex w-full items-center justify-center gap-1.5 text-caption font-medium text-ink-muted hover:text-ink"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
