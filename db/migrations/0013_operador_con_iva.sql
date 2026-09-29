-- Switch de IVA por operador: cuando está activo, los precios públicos de
-- todos sus tours se muestran con un 13% adicional (solo suma, nunca resta).
alter table "public"."operadores" add column if not exists "con_iva" boolean not null default false;--> statement-breakpoint

-- El rol anon (sitio público) debe poder leer la columna para armar los select.
grant select (con_iva) on "public"."operadores" to anon;--> statement-breakpoint

-- Recarga el schema cache de PostgREST (sin esto, supabase-js falla con
-- "column con_iva does not exist" hasta que se reinicia/reconfigura el pool).
notify pgrst, 'reload schema';
