/**
 * App Shell completo (design.md §6): sidebar fija + topbar 56px + slot de
 * contenido con scroll interno propio por vista. En móvil la sidebar se
 * vuelve drawer con hamburguesa.
 *
 * Contrato de rutas: este Layout renderiza <Outlet/> ⇒ App.tsx usa
 * <Route> anidados (react-dev.md "Layout + routing contract", patrón B).
 */
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SiteBackground from '@/components/SiteBackground';
import TopNav from '@/components/TopNav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';

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

export default function Layout() {
  const { tema, toggle } = useTheme();
  const { t } = useI18n();
  const { cerrarSesion, autenticado, rol } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ahora = useReloj();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Cierra el drawer móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const salir = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-bg text-ink">
      <SiteBackground />

      {/* Sidebar móvil/tablet: drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] border-border bg-surface p-0">
          <Navbar collapsed={false} onNavigate={() => setMobileOpen(false)} idPrefix="mov" />
        </SheetContent>
      </Sheet>

      {/* Columna principal */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Barra superior con navegación horizontal (estilo Booking) */}
        <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-nav px-4 backdrop-blur-[8px]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t('shell.topbar.abrir_menu')}
            className="flex h-9 w-9 items-center justify-center rounded-r-sm text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Inicio">
            <img src="./logo/volcan.png" alt="" className="h-9 w-9 object-contain" />
            <span className="hidden min-w-0 sm:block">
              <span className="block font-display text-[15px] font-bold leading-tight text-[#6F4E37]">
                Tours Operadores
              </span>
              <span className="block text-[10px] leading-tight text-[#8B7355]">Lavas Tacotal</span>
            </span>
          </Link>

          <TopNav />

          <div className="flex-1" />

          {/* Búsqueda rápida: escribir + Enter abre /buscar con la consulta */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const texto = busqueda.trim();
              navigate(texto ? `/buscar?q=${encodeURIComponent(texto)}` : '/buscar');
              setBusqueda('');
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t('shell.topbar.placeholder_buscar')}
              aria-label={t('shell.topbar.aria_buscar')}
              className="h-9 w-32 rounded-r-sm border border-border bg-surface-2 pl-8 pr-2 text-sm text-ink outline-none transition-[width,border-color,box-shadow] duration-fast placeholder:text-ink-faint focus:w-52 focus:border-brand focus:ring-[3px] focus:ring-brand/15 sm:w-48"
            />
          </form>

          {/* Reloj de recepción */}
          <div className="hidden text-caption text-ink-muted tnum xl:block">
            {FMT_FECHA.format(ahora)} · {FMT_HORA.format(ahora)}
          </div>

          {/* Rol resuelto de la sesión */}
          {autenticado && rol && (
            <span className="hidden rounded-full bg-surface-2 px-2 py-0.5 text-caption font-medium text-ink-muted xl:inline">
              {rol === 'admin' ? 'Admin' : rol === 'vendedor' ? 'Vendedor' : 'Reservas'}
            </span>
          )}

          {/* Toggle de tema */}
          <button
            type="button"
            onClick={toggle}
            aria-label={tema === 'dark' ? t('shell.topbar.tema_claro') : t('shell.topbar.tema_oscuro')}
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

          {autenticado ? (
            <button
              type="button"
              onClick={salir}
              aria-label={t('shell.topbar.cerrar_sesion')}
              className="flex h-9 items-center gap-1.5 rounded-r-sm px-2 text-sm font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">{t('shell.topbar.salir')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              aria-label={t('shell.topbar.iniciar_sesion')}
              className="flex h-9 items-center gap-1.5 rounded-r-sm px-2 text-sm font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
            >
              <LogIn className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">{t('shell.topbar.ingresar')}</span>
            </button>
          )}
        </header>

        {/* Slot de contenido: cada vista maneja su scroll interno */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>

        <footer className="flex h-8 shrink-0 items-center justify-center gap-1 border-t border-border bg-surface px-4 text-caption text-ink-faint">
          © {new Date().getFullYear()} {t('footer.derechos')}
        </footer>
      </div>
    </div>
  );
}
