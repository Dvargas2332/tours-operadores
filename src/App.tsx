import { Navigate, Route, Routes } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import RequireAuth from '@/components/RequireAuth';
import { CompareProvider } from '@/context/CompareContext';
import Buscador from '@/pages/Buscador';
import Dashboard from '@/pages/Dashboard';
import TourDetalle from '@/pages/TourDetalle';
import OperadorDetalle from '@/pages/OperadorDetalle';
import Reservar from '@/pages/Reservar';
import Comparador from '@/pages/Comparador';
import Admin from '@/pages/Admin';
import CargarTarifario from '@/pages/CargarTarifario';
import Login from '@/pages/Login';
import Welcome from '@/pages/Welcome';
import RequierePreferencias from '@/components/RequierePreferencias';

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <CompareProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/bienvenida" element={<Welcome />} />
          <Route element={<Layout />}>
            {/* Vistas públicas (sin sesión) */}
            <Route index element={<RequierePreferencias><Dashboard /></RequierePreferencias>} />
            <Route path="buscar" element={<RequierePreferencias><Buscador /></RequierePreferencias>} />
            <Route path="tour/:id" element={<RequierePreferencias><TourDetalle /></RequierePreferencias>} />
            <Route path="operador/:id" element={<RequierePreferencias><OperadorDetalle /></RequierePreferencias>} />
            <Route path="reservar/:id" element={<RequierePreferencias><Reservar /></RequierePreferencias>} />
            <Route path="comparar" element={<RequierePreferencias><Comparador /></RequierePreferencias>} />
            {/* Administración (requiere sesión) */}
            <Route path="admin" element={<RequireAuth><Admin /></RequireAuth>} />
            <Route path="admin/cargar" element={<RequireAuth><CargarTarifario /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" />
      </CompareProvider>
    </TooltipProvider>
  );
}
