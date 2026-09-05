-- ============================================================================
-- Supabase: seguridad (RLS) y buckets de Storage
-- Ejecutar en Supabase Dashboard → SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) RLS: solo los usuarios autenticados (Supabase Auth) acceden a las tablas
-- ----------------------------------------------------------------------------
alter table public.operadores    enable row level security;
alter table public.tours         enable row level security;
alter table public.tour_horarios enable row level security;
alter table public.tour_tarifas  enable row level security;
alter table public.usuarios      enable row level security;

create policy "operadores_acceso" on public.operadores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "tours_acceso" on public.tours
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "tour_horarios_acceso" on public.tour_horarios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "tour_tarifas_acceso" on public.tour_tarifas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "usuarios_acceso" on public.usuarios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 2) Storage: buckets públicos para logos y pólizas
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('polizas', 'polizas', true)
on conflict (id) do nothing;

-- Los buckets son públicos para lectura; solo autenticados pueden subir/borrar.
create policy "logos_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'logos');

create policy "logos_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'logos');

create policy "polizas_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'polizas');

create policy "polizas_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'polizas');
