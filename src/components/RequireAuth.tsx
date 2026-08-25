/**
 * Guard de rutas: mientras se resuelve la sesión muestra un spinner; si no
 * hay sesión válida redirige a /login recordando la ruta de origen.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { autenticado, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
