/**
 * Pie compacto de la sidebar — tarjeta "Estado de datos" (design.md §6.1).
 * N tours · N operadores · última carga con dot de frescura. Click → /admin.
 */
import { Link } from 'react-router';
import { useToursData } from '@/hooks/useToursData';
import { freshness, formatDateEs } from '@/data/mock-tours';

const DOT_COLOR: Record<string, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

export default function Footer({ collapsed = false }: { collapsed?: boolean }) {
  const data = useToursData();

  const ultimaCarga = data
    ? data.tours.reduce((max, t) => (t.fecha_actualizacion > max ? t.fecha_actualizacion : max), '')
    : null;
  const frescura = ultimaCarga ? freshness(ultimaCarga) : null;

  if (collapsed) {
    return (
      <div className="px-2 pb-3">
        <Link
          to="/admin"
          title="Estado de datos"
          className="flex h-10 items-center justify-center rounded-r-sm border border-border bg-surface-2 transition-colors duration-fast hover:border-brand"
        >
          <span className={`h-2 w-2 rounded-full ${frescura ? DOT_COLOR[frescura.estado] : 'bg-ink-faint'}`} />
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3">
      <Link
        to="/admin"
        className="block rounded-r-md border border-border bg-surface-2/60 p-3 transition-colors duration-fast hover:border-brand/40"
      >
        <div className="text-caption uppercase tracking-wide text-ink-faint">Estado de datos</div>
        <div className="mt-1 text-small font-medium text-ink tnum">
          {data ? `${data.tours.length} tours · ${data.operadores.length} operadores` : 'Cargando…'}
        </div>
        {ultimaCarga && frescura && (
          <div className="mt-1 flex items-center gap-1.5 text-caption text-ink-muted">
            <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[frescura.estado]}`} />
            Última carga: {formatDateEs(ultimaCarga)}
          </div>
        )}
      </Link>
    </div>
  );
}
