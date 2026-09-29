/**
 * Formatos de fecha, frescura y horario según el idioma activo.
 * Envuelven las funciones puras de `data/mock-tours` con textos traducidos
 * (meses, etiquetas del semáforo de frescura, "Inicia HH:MM").
 */
import { useMemo } from 'react';
import { horarioTieneLlegada } from '@/data/mock-tours';
import type { Frescura, Horario, InfoFrescura } from '@/data/mock-tours';
import { useI18n } from './context';

export function useFormatos() {
  const { t } = useI18n();
  return useMemo(() => {
    const formatFecha = (iso: string): string => {
      const [y, m, d] = iso.split('-').map(Number);
      return `${d} ${t(`fecha.mes_${m}`)} ${y}`;
    };

    const frescura = (fechaISO: string): InfoFrescura => {
      const ms = Date.now() - new Date(fechaISO + 'T12:00:00').getTime();
      const dias = Math.max(0, Math.floor(ms / 86_400_000));
      const estado: Frescura = dias < 90 ? 'ok' : dias <= 180 ? 'warn' : 'danger';
      const label = t(`buscador.frescura_${estado}`);
      const relativo =
        dias === 0
          ? t('buscador.frescura_hoy')
          : dias === 1
            ? t('buscador.frescura_ayer')
            : t('buscador.frescura_hace_dias', { n: String(dias) });
      return { estado, dias, label, relativo };
    };

    const horarioLabel = (h: Horario): string =>
      horarioTieneLlegada(h)
        ? `${h.hora_salida} - ${h.hora_llegada}`
        : t('fecha.horario_inicia', { hora: h.hora_salida });

    return { formatFecha, frescura, horarioLabel };
  }, [t]);
}
