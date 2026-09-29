/**
 * Barra de chips de filtros activos + contador de resultados (buscador.md §3).
 * Chip IA primero (--accent-soft), luego chips del panel en orden, "Limpiar
 * todo" si hay ≥2, y contador con tween numérico GSAP 400ms.
 */
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { Sparkles, X } from 'lucide-react';
import type { ChipFiltro } from '@/lib/filtros';
import { useI18n } from '@/i18n';

const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const;

/** Contador con tween GSAP ("24 tours") */
export function ContadorResultados({ valor, total, hayFiltros }: { valor: number; total: number; hayFiltros: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(valor);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const estado = { n: prev.current };
    const tween = gsap.to(estado, {
      n: valor,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        const n = Math.round(estado.n);
        nodo.textContent = t(n === 1 ? 'buscador.contador_tours_uno' : 'buscador.contador_tours_varios', { n: String(n) });
      },
    });
    prev.current = valor;
    return () => {
      tween.kill();
    };
  }, [valor, t]);

  return (
    <div className="ml-auto shrink-0 pl-3 text-right">
      <span ref={ref} className="text-[15px] font-semibold text-ink tnum">
        {t(valor === 1 ? 'buscador.contador_tours_uno' : 'buscador.contador_tours_varios', { n: String(valor) })}
      </span>
      {hayFiltros && (
        <div className="text-caption text-ink-faint tnum">{t('buscador.contador_total', { total: String(total) })}</div>
      )}
    </div>
  );
}

interface ActiveChipsProps {
  textoIA: string | null;
  chips: ChipFiltro[];
  onQuitar: (chipId: string) => void;
  onEditarTexto: () => void;
  onLimpiarTodo: () => void;
  contador: React.ReactNode;
}

export default function ActiveChips({ textoIA, chips, onQuitar, onEditarTexto, onLimpiarTodo, contador }: ActiveChipsProps) {
  const { t } = useI18n();
  const hayChips = textoIA != null || chips.length > 0;

  return (
    <div className="flex items-center gap-2">
      <motion.div layout className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none]">
        <AnimatePresence initial={false}>
          {textoIA && (
            <motion.button
              key="chip-ia"
              layout
              type="button"
              onClick={onEditarTexto}
              title={t('buscador.editar_busqueda')}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={SPRING}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-volcan-soft px-3 py-1 text-caption font-medium text-volcan transition-colors duration-fast hover:brightness-95"
            >
              <Sparkles className="h-3 w-3" />
              <span className="max-w-[220px] truncate">'{textoIA}'</span>
            </motion.button>
          )}
          {chips.map((chip) => (
            <motion.span
              key={chip.id}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.15 } }}
              transition={SPRING}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-caption font-medium text-brand"
            >
              {chip.label}
              <button
                type="button"
                aria-label={t('buscador.quitar_filtro', { filtro: chip.label })}
                onClick={() => onQuitar(chip.id)}
                className="rounded-full transition-colors duration-fast hover:text-brand-hover"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
          {chips.length >= 2 && (
            <motion.button
              key="limpiar-todo"
              layout
              type="button"
              onClick={onLimpiarTodo}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={SPRING}
              className="shrink-0 rounded-full px-2.5 py-1 text-caption font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-2 hover:text-brand"
            >
              {t('buscador.limpiar_todo')}
            </motion.button>
          )}
        </AnimatePresence>
        {!hayChips && <span className="text-caption text-ink-faint">{t('buscador.sin_filtros')}</span>}
      </motion.div>
      {contador}
    </div>
  );
}
