/**
 * Guard de rutas públicas: los visitantes sin sesión deben pasar primero por
 * la página de bienvenida (idioma + nacionalidad). Los usuarios autenticados
 * (admin) entran directo.
 */
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';

export default function RequierePreferencias({ children }: { children: ReactNode }) {
  const { autenticado } = useAuth();
  const { preferenciasListas } = useI18n();

  if (!autenticado && !preferenciasListas) return <Navigate to="/bienvenida" replace />;
  return <>{children}</>;
}
