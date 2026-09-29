/**
 * Página de bienvenida pública: el cliente elige idioma y nacionalidad antes
 * de entrar al sitio. Guarda ambas preferencias y continúa al inicio.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { NACIONALIDADES, useI18n, type Idioma } from '@/i18n';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const IDIOMAS: { codigo: Idioma; bandera: string }[] = [
  { codigo: 'es', bandera: '🇨🇷' },
  { codigo: 'en', bandera: '🇺🇸' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { idioma, setIdioma, nacionalidad, setNacionalidad, t } = useI18n();
  const [pais, setPais] = useState<string | null>(nacionalidad);

  const continuar = () => {
    if (!pais) return;
    setNacionalidad(pais);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 py-8 text-ink">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-[460px] rounded-r-lg border border-border bg-surface p-6 shadow-card"
      >
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <img src="./logo/volcan.png" alt="Lavas Tacotal" className="h-16 w-16 object-contain" />
          <h1 className="mt-3 text-h2 text-ink">{t('welcome.titulo')}</h1>
          <p className="mt-1 text-small text-ink-muted">{t('welcome.subtitulo')}</p>
        </div>

        {/* Idioma */}
        <div className="mt-6">
          <p className="text-label uppercase tracking-wide text-ink-muted">{t('welcome.idioma')}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {IDIOMAS.map(({ codigo, bandera }) => (
              <button
                key={codigo}
                type="button"
                onClick={() => setIdioma(codigo)}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-2 rounded-r-sm text-[14px] font-semibold transition-colors duration-fast',
                  idioma === codigo
                    ? 'bg-brand text-white'
                    : 'border border-border bg-surface text-ink-muted hover:text-ink',
                )}
              >
                <span>{bandera}</span>
                {t(`welcome.${codigo}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Nacionalidad */}
        <div className="mt-5">
          <p className="text-label uppercase tracking-wide text-ink-muted">{t('welcome.nacionalidad')}</p>
          <div className="mt-2 grid max-h-[240px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {NACIONALIDADES.map((n) => (
              <button
                key={n.codigo}
                type="button"
                onClick={() => setPais(n.codigo)}
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-1.5 rounded-r-sm px-1 text-caption font-medium transition-colors duration-fast',
                  pais === n.codigo
                    ? 'bg-brand text-white'
                    : 'border border-border bg-surface text-ink-muted hover:text-ink',
                )}
              >
                <span>{n.bandera}</span>
                <span className="truncate">{idioma === 'en' ? n.en : n.es}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Continuar */}
        <motion.button
          type="button"
          onClick={continuar}
          disabled={!pais}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-r-sm text-[14px] font-semibold text-white transition-all duration-fast',
            pais ? 'bg-volcan hover:brightness-105' : 'bg-ink-faint/50 cursor-not-allowed',
          )}
        >
          {t('welcome.continuar')}
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
