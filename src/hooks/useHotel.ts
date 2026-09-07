import { useEffect, useState } from 'react';
import { fetchHotel } from '@/data/mock-tours';
import type { Hotel } from '@/data/mock-tours';

/** Datos de configuración del hotel (destino de reservas públicas). */
export function useHotel(): Hotel | null {
  const [hotel, setHotel] = useState<Hotel | null>(null);

  useEffect(() => {
    let vivo = true;
    fetchHotel()
      .then((h) => {
        if (vivo) setHotel(h);
      })
      .catch(() => {
        if (vivo) setHotel(null);
      });
    return () => {
      vivo = false;
    };
  }, []);

  return hotel;
}
