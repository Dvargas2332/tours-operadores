import { supabase } from '@/lib/supabase';

export type Rol = 'admin' | 'vendedor';

/** Rol del usuario autenticado; null si todavía no tiene fila en `perfiles`. */
export async function fetchRol(userId: string): Promise<Rol | null> {
  // RPC security definer: no depende de la RLS de `perfiles`.
  const { data: rpc, error: rpcError } = await supabase.rpc('mi_rol');
  if (!rpcError && (rpc === 'admin' || rpc === 'vendedor')) return rpc;

  // Fallback: lectura directa de la fila propia.
  const { data, error } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.rol as Rol | undefined) ?? null;
}
