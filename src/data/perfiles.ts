import { supabase } from '@/lib/supabase';

export type Rol = 'admin' | 'vendedor';

/** Rol del usuario autenticado; null si todavía no tiene fila en `perfiles`. */
export async function fetchRol(userId: string): Promise<Rol | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.rol as Rol | undefined) ?? null;
}
