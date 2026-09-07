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

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <CompareProvider>
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
