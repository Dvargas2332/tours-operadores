import { Navigate, Route, Routes } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import RequireAuth from '@/components/RequireAuth';
import { CompareProvider } from '@/context/CompareContext';
import Buscador from '@/pages/Buscador';
import TourDetalle from '@/pages/TourDetalle';
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
          {/* Rutas protegidas: RequireAuth redirige a /login sin sesión */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Buscador />} />
            <Route path="tour/:id" element={<TourDetalle />} />
            <Route path="comparar" element={<Comparador />} />
            <Route path="admin" element={<Admin />} />
            <Route path="admin/cargar" element={<CargarTarifario />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" />
      </CompareProvider>
    </TooltipProvider>
  );
}
