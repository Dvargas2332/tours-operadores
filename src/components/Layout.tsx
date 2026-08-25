/**
 * App Shell completo (design.md §6): sidebar fija + topbar 56px + slot de
 * contenido con scroll interno propio por vista. En móvil la sidebar se
 * vuelve drawer con hamburguesa.
 *
 * Contrato de rutas: este Layout renderiza <Outlet/> ⇒ App.tsx usa
 * <Route> anidados (react-dev.md "Layout + routing contract", patrón B).
 */
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

function useReloj(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

const FMT_FECHA = new Intl.DateTimeFormat('es-CR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const FMT_HORA = new Intl.DateTimeFormat('es-CR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function breadcrumb(pathname: string): string[] {
  if (pathname === '/') return ['Buscador'];
  if (pathname.startsWith('/tour/')) return ['Buscador', 'Detalle de tour'];
  if (pathname.startsWith('/comparar')) return ['Comparador'];
  if (pathname === '/admin') return ['Administración'];
  if (pathname.startsWith('/admin/cargar')) return ['Administración', 'Cargar tarifario'];
  return ['Tours Operadores'];
}

export default function Layout() {
  const { tema, toggle } = useTheme();
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ahora = useReloj();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = false;

  // Cierra el drawer móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const migas = breadcrumb(location.pathname);

  const salir = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg text-ink">
      {/* Sidebar escritorio (≥1024px) */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 232 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="hidden h-full shrink-0 overflow-hidden border-r border-border lg:block"
      >
        <div style={{ width: collapsed ? 64 : 232 }} className="h-full">
          <Navbar collapsed={collapsed} idPrefix="desk" />
        </div>
      </motion.aside>

      {/* Sidebar móvil/tablet: drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] border-border bg-surface p-0">
          <Navbar collapsed={false} onNavigate={() => setMobileOpen(false)} idPrefix="mov" />
        </SheetContent>
      </Sheet>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar 56px */}
        <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-[8px]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-caption text-ink-muted">
            {migas.map((miga, i) => (
              <span key={miga} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-ink-faint">/</span>}
                <span className={i === migas.length - 1 ? 'font-medium text-ink' : undefined}>{miga}</span>
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Reloj de recepción */}
          <div className="hidden text-caption text-ink-muted tnum sm:block">
            {FMT_FECHA.format(ahora)} · {FMT_HORA.format(ahora)}
          </div>

          {/* Toggle de tema */}
          <button
            type="button"
            onClick={toggle}
            aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            className="flex h-9 w-9 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={tema}
                initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex"
              >
                {tema === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Cerrar sesión */}
          <button
            type="button"
            onClick={salir}
            aria-label="Cerrar sesión"
            className="flex h-9 items-center gap-1.5 rounded-r-sm px-2 text-sm font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Salir</span>
          </button>

          {/* Badge USO INTERNO */}
          <span className="hidden rounded-full border border-border bg-surface-2 px-2.5 py-1 text-caption font-semibold uppercase tracking-wider text-ink-muted md:inline-block">
            Uso interno
          </span>
        </header>

        {/* Slot de contenido: cada vista maneja su scroll interno */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
