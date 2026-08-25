/**
 * Estado de sesión global. Consulta `auth.session` (público) para saber si
 * hay una cookie válida y expone `iniciarSesion` / `cerrarSesion`.
 */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { trpc } from '@/providers/trpc';

interface AuthContextValue {
  autenticado: boolean;
  usuario: string | null;
  cargando: boolean;
  iniciarSesion: (usuario: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const sesion = trpc.auth.session.useQuery();
  const login = trpc.auth.login.useMutation();
  const logout = trpc.auth.logout.useMutation();

  const iniciarSesion = async (usuario: string, contrasena: string) => {
    await login.mutateAsync({ usuario, contrasena });
    await utils.auth.session.invalidate();
  };

  const cerrarSesion = async () => {
    await logout.mutateAsync();
    await utils.auth.session.invalidate();
  };

  const value: AuthContextValue = {
    autenticado: sesion.data?.autenticado ?? false,
    usuario: sesion.data?.usuario ?? null,
    cargando: sesion.isLoading,
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
