/**
 * Sidebar del App Shell (design.md §6.1) — se llama Navbar por contrato del proyecto.
 *
 * - 232px expandida / 64px colapsada (solo íconos), animación 250ms.
 * - Estado activo: fondo --brand-soft, texto --brand, barra indicadora 3px
 *   que se desliza entre ítems con layoutId (spring).
 * - Badges: conteo de tours (Buscador), seleccionados (Comparador),
 *   tarifarios por revisar (Administración).
 */
import { NavLink } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Columns3, Home, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';
import { useToursData } from '@/hooks/useToursData';
import { freshness } from '@/data/mock-tours';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge: number | null;
  badgeTono: 'neutro' | 'brand' | 'alerta';
  end?: boolean;
}

interface NavbarProps {
  collapsed: boolean;
  onNavigate?: () => void;
  /** Prefijo único para layoutId cuando hay dos instancias (desktop + móvil) */
  idPrefix?: string;
}

const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const;

export default function Navbar({ collapsed, onNavigate, idPrefix = 'nav' }: NavbarProps) {
  const data = useToursData();
  const { seleccionados } = useCompare();

  const desactualizados = data
    ? data.tours.filter((t) => freshness(t.fecha_actualizacion).estado !== 'ok').length
    : 0;

  const items: NavItem[] = [
    {
      to: '/',
      label: 'Inicio',
      icon: Home,
      badge: null,
      badgeTono: 'neutro',
      end: true,
    },
    {
      to: '/buscar',
      label: 'Buscar',
      icon: Search,
      badge: data ? data.tours.length : null,
      badgeTono: 'neutro',
    },
    {
      to: '/comparar',
      label: 'Comparador',
      icon: Columns3,
      badge: seleccionados.length > 0 ? seleccionados.length : null,
      badgeTono: 'brand',
    },
    {
      to: '/admin',
      label: 'Administración',
      icon: Building2,
      badge: desactualizados > 0 ? desactualizados : null,
      badgeTono: 'alerta',
      end: true,
    },
  ];

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Logo */}
      <div className={cn('flex h-16 shrink-0 items-center gap-3 border-b border-border', collapsed ? 'justify-center px-2' : 'px-4')}>
        <img src="/logo/logo.png" alt="Tours Operadores" className="h-8 w-8 shrink-0" />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="min-w-0"
            >
              <div className="font-display text-[17px] font-bold leading-tight text-ink">Tours Operadores</div>
              <div className="text-caption text-ink-faint">La Fortuna</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center gap-3 rounded-r-sm px-3 text-sm font-medium transition-colors duration-fast',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-brand-soft text-brand'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={`${idPrefix}-activo`}
                    transition={SPRING}
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand"
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge != null && !collapsed && (
                <motion.span
                  key={item.badge}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={SPRING}
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-caption tnum leading-none',
                    item.badgeTono === 'alerta'
                      ? 'bg-volcan-soft text-warn'
                      : item.badgeTono === 'brand'
                        ? 'bg-brand-soft text-brand'
                        : 'bg-surface-2 text-ink-muted',
                  )}
                >
                  {item.badge}
                </motion.span>
                )}
                {item.badge != null && collapsed && (
                  <span
                    className={cn(
                      'absolute right-1 top-1 h-2 w-2 rounded-full',
                      item.badgeTono === 'alerta' ? 'bg-warn' : 'bg-brand',
                    )}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
