/**
 * Fondo global del sitio configurado desde Admin → Info hotel. Se dibuja como
 * capa fija sobre el fondo base y debajo del contenido, con un velo del color
 * de fondo para no comprometer la legibilidad en tema claro ni oscuro.
 */
import { useHotel } from '@/hooks/useHotel';

/** Intensidad del velo: 0 = imagen pura, 100 = fondo sólido. */
const VELO = 50;

export default function SiteBackground() {
  const hotel = useHotel();

  if (!hotel?.fondo_url) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${hotel.fondo_url}")` }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `color-mix(in srgb, var(--bg) ${VELO}%, transparent)` }}
      />
    </div>
  );
}
