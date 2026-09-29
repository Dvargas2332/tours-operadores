/**
 * Catálogo de nacionalidades para la página de bienvenida. El `codigo` (nombre
 * en español canónico) es lo que se persiste y lo que determina si el cliente
 * es costarricense (ver `esCostaRica` en el contexto i18n).
 */
export interface Nacionalidad {
  codigo: string;
  es: string;
  en: string;
  bandera: string;
}

export const NACIONALIDADES: Nacionalidad[] = [
  { codigo: 'Costa Rica', es: 'Costa Rica', en: 'Costa Rica', bandera: '🇨🇷' },
  { codigo: 'Estados Unidos', es: 'Estados Unidos', en: 'United States', bandera: '🇺🇸' },
  { codigo: 'Canadá', es: 'Canadá', en: 'Canada', bandera: '🇨🇦' },
  { codigo: 'México', es: 'México', en: 'Mexico', bandera: '🇲🇽' },
  { codigo: 'Guatemala', es: 'Guatemala', en: 'Guatemala', bandera: '🇬🇹' },
  { codigo: 'Panamá', es: 'Panamá', en: 'Panama', bandera: '🇵🇦' },
  { codigo: 'Colombia', es: 'Colombia', en: 'Colombia', bandera: '🇨🇴' },
  { codigo: 'Venezuela', es: 'Venezuela', en: 'Venezuela', bandera: '🇻🇪' },
  { codigo: 'Ecuador', es: 'Ecuador', en: 'Ecuador', bandera: '🇪🇨' },
  { codigo: 'Perú', es: 'Perú', en: 'Peru', bandera: '🇵🇪' },
  { codigo: 'Brasil', es: 'Brasil', en: 'Brazil', bandera: '🇧🇷' },
  { codigo: 'Argentina', es: 'Argentina', en: 'Argentina', bandera: '🇦🇷' },
  { codigo: 'Chile', es: 'Chile', en: 'Chile', bandera: '🇨🇱' },
  { codigo: 'Uruguay', es: 'Uruguay', en: 'Uruguay', bandera: '🇺🇾' },
  { codigo: 'España', es: 'España', en: 'Spain', bandera: '🇪🇸' },
  { codigo: 'Francia', es: 'Francia', en: 'France', bandera: '🇫🇷' },
  { codigo: 'Alemania', es: 'Alemania', en: 'Germany', bandera: '🇩🇪' },
  { codigo: 'Reino Unido', es: 'Reino Unido', en: 'United Kingdom', bandera: '🇬🇧' },
  { codigo: 'Países Bajos', es: 'Países Bajos', en: 'Netherlands', bandera: '🇳🇱' },
  { codigo: 'Otro', es: 'Otro', en: 'Other', bandera: '🌍' },
];
