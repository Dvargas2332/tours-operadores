/**
 * Guard de rutas de administración: exige sesión y rol `admin`.
 * Un vendedor autenticado es redirigido al inicio.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/context/AuthContext';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { autenticado, esAdmin, cargando } = useAuth();
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

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
