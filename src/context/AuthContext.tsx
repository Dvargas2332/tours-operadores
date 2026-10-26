/**
 * Estado de sesión global basado en Supabase Auth.
 * Expone `iniciarSesion` / `cerrarSesion`, el usuario y su rol
 * (`admin` | `vendedor`). El rol se lee de `public.perfiles`.
 */
import { createContext, useContext, useEffect, useState } from 'react';
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
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState<string | null>(null);
  const [rol, setRol] = useState<Rol | null>(null);
  const [cargando, setCargando] = useState(true);

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
      } catch {
        if (!vivo) return;
        setRol('vendedor');
      } finally {
        if (vivo) setCargando(false);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => aplicarSesion(data.session))
      .catch(() => {
        if (vivo) setCargando(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sesion) => {
      clearToursCache();
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
      throw new Error(error.message);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    autenticado,
    usuario,
    rol,
    esAdmin: rol === 'admin',
    cargando,
    iniciarSesion,
    cerrarSesion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
