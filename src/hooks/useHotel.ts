import { useQuery } from '@tanstack/react-query';
import { fetchHotel } from '@/data/mock-tours';
import type { Hotel } from '@/data/mock-tours';

/** Datos de configuración del hotel (destino de reservas públicas y fondo). */
export function useHotel(): Hotel | null {
  const { data } = useQuery({
    queryKey: ['hotel'],
    queryFn: fetchHotel,
    staleTime: 5 * 60 * 1000,
  });

  return data ?? null;
}
