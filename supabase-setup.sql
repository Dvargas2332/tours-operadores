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

-- ----------------------------------------------------------------------------
-- 3) Blindado de columnas internas: anon NO lee comisión / neta / precios netos
-- ----------------------------------------------------------------------------
revoke all on public.tours from anon;
revoke all on public.operadores from anon;
revoke all on public.tour_tarifas from anon;

grant select (id, operador_id, nombre, zona, categoria, precio_adulto, precio_nino, duracion_horas, incluye, minimo_personas, apto_ninos, politica_cancelacion, observaciones, fecha_actualizacion, moneda) on public.tours to anon;

grant select (id, nombre, telefono, email, logo_url, poliza_url, politica_cancelacion, horario) on public.operadores to anon;

grant select (id, tour_id, nombre, min_edad, max_edad, rack, orden) on public.tour_tarifas to anon;

-- ----------------------------------------------------------------------------
-- 4) Configuración del hotel (destino de reservas públicas)
-- ----------------------------------------------------------------------------
create table if not exists public.hotel (
  id serial primary key,
  nombre varchar(255) not null default '',
  whatsapp varchar(50) not null default '',
  email varchar(255)
);

insert into public.hotel (id, nombre, whatsapp, email) values (1, '', '', null)
on conflict (id) do nothing;

alter table public.hotel enable row level security;

-- ----------------------------------------------------------------------------
-- 5) Horario del operador (para tours que heredan su horario)
-- ----------------------------------------------------------------------------
alter table public.operadores add column if not exists horario varchar(255) not null default '';
grant select (horario) on public.operadores to anon;

create policy "hotel_lectura_publica" on public.hotel
  for select to anon using (true);

create policy "hotel_acceso" on public.hotel
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 6) Duración opcional (ya no se pide al crear tours)
-- ----------------------------------------------------------------------------
alter table public.tours alter column duracion_horas set default 0;

-- ----------------------------------------------------------------------------
-- 7) Activo/inactivo del operador (oculta sus tours en la vista pública)
-- ----------------------------------------------------------------------------
alter table public.operadores add column if not exists activo boolean not null default true;
grant select (activo) on public.operadores to anon;
