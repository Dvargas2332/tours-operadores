import { createClient } from '@supabase/supabase-js';

// Valores públicos de Supabase (la anon key es pública por diseño, no es un secreto).
const url = 'https://ssmnjrofhkfaklbftdbl.supabase.co';
const anonKey = 'sb_publishable_EqGwwEth1OJaxeJCmVLOdg_W4nq4Tz7';

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
