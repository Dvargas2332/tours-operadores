import { useHotel } from '@/hooks/useHotel';

export const LOGO_MARCA_DEFAULT = './logo/volcan.png';
export const MARCA_DEFAULT = 'Tours Operadores';
export const SITIO_DEFAULT = 'Lavas Tacotal';

/** Identidad visible del sitio: logo, marca y nombre del hotel. */
export function useBrand() {
  const hotel = useHotel();
  return {
    hotel,
    logo: hotel?.logo_url?.trim() || LOGO_MARCA_DEFAULT,
    marca: hotel?.marca?.trim() || MARCA_DEFAULT,
    sitio: hotel?.nombre?.trim() || SITIO_DEFAULT,
  };
}
