/**
 * Integración API por operador. Solo admin: la clave nunca se expone al
 * vendedor ni al sitio público (RLS de la tabla).
 */
import { supabase } from '@/lib/supabase';

export interface IntegracionOperador {
  operador_id: number;
  proveedor: string;
  api_url: string;
  api_key: string;
  activa: boolean;
  ultima_sync: string | null;
  estado: string;
  actualizado_en: string;
}

export async function fetchIntegracion(operadorId: number): Promise<IntegracionOperador | null> {
  const { data, error } = await supabase
    .from('operador_integraciones')
    .select('*')
    .eq('operador_id', operadorId)
    .maybeSingle();
  if (error) throw error;
  return (data as IntegracionOperador | null) ?? null;
}

export async function guardarIntegracion(input: IntegracionOperador): Promise<void> {
  const { error } = await supabase.from('operador_integraciones').upsert({
    ...input,
    actualizado_en: new Date().toISOString(),
  });
  if (error) throw error;
}
