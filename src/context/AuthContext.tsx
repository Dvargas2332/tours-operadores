/**
 * Estado de sesión global basado en Supabase Auth.
 * Expone inicio/cierre, el rol de `public.perfiles` y el flujo de
 * recuperación de contraseña (enlace por correo + nueva contraseña).
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchRol, type Rol } from '@/data/perfiles';
import { clearToursCache } from '@/hooks/useToursData';

interface AuthContextValue {
  autenticado: boolean;
  usuario: string | null;
  rol: Rol | null;
  esAdmin: boolean;
  cargando: boolean;
  /** true cuando el usuario llegó desde un enlace de recuperación de Supabase. */
  recuperacion: boolean;
  limpiarRecuperacion: () => void;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  recuperarContrasena: (email: string) => Promise<void>;
  cambiarContrasena: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Los tokens de recuperación llegan en el hash. Se capturan al cargar el
 * módulo, antes de que HashRouter procese esa URL como una ruta.
 */
const RECUPERACION_URL = (() => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (params.get('type') !== 'recovery') return null;
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  return access_token && refresh_token ? { access_token, refresh_token } : null;
})();

function mensajeAuth(mensaje: string): string {
  if (/at least|password should be/i.test(mensaje)) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  return mensaje;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState<string | null>(null);
  const [rol, setRol] = useState<Rol | null>(null);
  const [cargando, setCargando] = useState(true);
  const [recuperacion, setRecuperacion] = useState(() => RECUPERACION_URL != null);

  useEffect(() => {
    let vivo = true;

    const aplicarSesion = async (sesion: Session | null) => {
      const user = sesion?.user ?? null;
      if (!vivo) return;

      setAutenticado(user != null);
      setUsuario(user?.email ?? null);

      if (!user) {
        setRol(null);
        setCargando(false);
        return;
      }

      try {
        const r = await fetchRol(user.id);
        if (!vivo) return;
        // Sin fila en perfiles se asume el rol de menor privilegio.
        setRol(r ?? 'vendedor');
      } catch (error) {
        console.error('No se pudo leer el rol del usuario', error);
        if (!vivo) return;
        setRol('vendedor');
      } finally {
        if (vivo) setCargando(false);
      }
    };

    /**
     * Supabase redirige el enlace de recuperación con los tokens en el hash.
     * HashRouter también usa el hash, así que se procesa a mano antes de
     * dejar que el router vea la URL y luego se limpia.
     */
    const detectarRecuperacion = async () => {
      if (!RECUPERACION_URL) return;
      try {
        const { error } = await supabase.auth.setSession(RECUPERACION_URL);
        if (error) return;
        if (!vivo) return;
        setRecuperacion(true);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        // Enlace vencido o inválido: se sigue con el login normal.
      }
    };

    const iniciar = async () => {
      await detectarRecuperacion();
      try {
        const { data } = await supabase.auth.getSession();
        await aplicarSesion(data.session);
      } catch {
        if (vivo) setCargando(false);
      }
    };
    void iniciar();

    const { data: sub } = supabase.auth.onAuthStateChange((event, sesion) => {
      clearToursCache();
      if (event === 'PASSWORD_RECOVERY' && vivo) setRecuperacion(true);
      void aplicarSesion(sesion);
    });

    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const iniciarSesion = async (email: string, contrasena: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: contrasena,
    });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Credenciales inválidas');
      }
      throw new Error(mensajeAuth(error.message));
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  const recuperarContrasena = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(mensajeAuth(error.message));
  };

  const cambiarContrasena = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(mensajeAuth(error.message));
  };

  const limpiarRecuperacion = useCallback(() => setRecuperacion(false), []);

  const value: AuthContextValue = {
    autenticado,
    usuario,
    rol,
    esAdmin: rol === 'admin',
    cargando,
    recuperacion,
    limpiarRecuperacion,
    iniciarSesion,
    cerrarSesion,
    recuperarContrasena,
    cambiarContrasena,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
