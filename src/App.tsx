import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import RequireAdmin from '@/components/RequireAdmin';
import { CompareProvider } from '@/context/CompareContext';
import Dashboard from '@/pages/Dashboard';

const Buscador = lazy(() => import('@/pages/Buscador'));
const TourDetalle = lazy(() => import('@/pages/TourDetalle'));
const OperadorDetalle = lazy(() => import('@/pages/OperadorDetalle'));
const Reservar = lazy(() => import('@/pages/Reservar'));
const Comparador = lazy(() => import('@/pages/Comparador'));
const Admin = lazy(() => import('@/pages/Admin'));
const CargarTarifario = lazy(() => import('@/pages/CargarTarifario'));
const Login = lazy(() => import('@/pages/Login'));

function CargandoPantalla() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-bg text-small text-ink-muted">
      Cargando…
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <CompareProvider>
        <Suspense fallback={<CargandoPantalla />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              {/* Vistas públicas (sin sesión) */}
              <Route index element={<Dashboard />} />
              <Route path="buscar" element={<Buscador />} />
              <Route path="tour/:id" element={<TourDetalle />} />
              <Route path="operador/:id" element={<OperadorDetalle />} />
              <Route path="reservar/:id" element={<Reservar />} />
              <Route path="comparar" element={<Comparador />} />
              {/* Administración (requiere sesión y rol admin) */}
              <Route path="admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
              <Route path="admin/cargar" element={<RequireAdmin><CargarTarifario /></RequireAdmin>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="bottom-right" />
      </CompareProvider>
    </TooltipProvider>
  );
}
