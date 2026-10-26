/**
 * Navegación horizontal del shell (desktop). Reemplaza la barra lateral y se
 * integra con la barra superior, estilo Booking.
 */
import { NavLink } from 'react-router';
import { Building2, Columns3, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { freshness } from '@/data/mock-tours';
import { useAuth } from '@/context/AuthContext';
import { useCompare } from '@/context/CompareContext';
import { useToursData } from '@/hooks/useToursData';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

interface TopNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge: number | null;
  tono: 'neutro' | 'brand' | 'alerta';
}

export default function TopNav() {
  const data = useToursData();
  const { seleccionados } = useCompare();
  const { esAdmin } = useAuth();
  const { t } = useI18n();

  const desactualizados = data
    ? data.tours.filter((tour) => freshness(tour.fecha_actualizacion).estado !== 'ok').length
    : 0;

  const items: TopNavItem[] = [
    {
      to: '/',
      label: t('shell.nav.inicio'),
      icon: Home,
      end: true,
      badge: null,
      tono: 'neutro',
    },
    {
      to: '/comparar',
      label: t('shell.nav.comparador'),
      icon: Columns3,
      badge: seleccionados.length > 0 ? seleccionados.length : null,
      tono: 'brand',
    },
    ...(esAdmin
      ? [
          {
            to: '/admin',
            label: t('shell.nav.administracion'),
            icon: Building2,
            end: true,
            badge: desactualizados > 0 ? desactualizados : null,
            tono: 'alerta' as const,
          },
        ]
      : []),
  ];

  return (
    <nav className="hidden h-full items-end gap-0.5 lg:flex" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex h-10 -mb-px items-center gap-2 rounded-t-lg border border-b-0 px-4 text-sm font-medium transition-colors duration-fast',
              isActive
                ? 'border-border bg-nav-active text-brand'
                : 'border-transparent text-ink-muted hover:bg-nav-hover hover:text-ink',
            )
          }
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
          {item.badge != null && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-caption tnum leading-none',
                item.tono === 'alerta'
                  ? 'bg-volcan-soft text-warn'
                  : item.tono === 'brand'
                    ? 'bg-brand-soft text-brand'
                    : 'bg-surface-2 text-ink-muted',
              )}
            >
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
