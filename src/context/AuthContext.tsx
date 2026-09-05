/**
 * Estado de sesión global basado en Supabase Auth.
 * Expone `iniciarSesion` / `cerrarSesion` y el estado actual de la sesión.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  autenticado: boolean;
  usuario: string | null;
  cargando: boolean;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const sesion = data.session;
        setAutenticado(sesion != null);
        setUsuario(sesion?.user?.email ?? null);
        setCargando(false);
      })
      .catch(() => setCargando(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sesion) => {
      setAutenticado(sesion != null);
      setUsuario(sesion?.user?.email ?? null);
      setCargando(false);
    });

    return () => sub.subscription.unsubscribe();
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
