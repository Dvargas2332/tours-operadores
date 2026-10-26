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

insert into storage.buckets (id, name, public)
values ('fondos', 'fondos', true)
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

create policy "fondos_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'fondos');

create policy "fondos_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'fondos');

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
  email varchar(255),
  fondo_url text
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

-- ----------------------------------------------------------------------------
-- 8) Switch de IVA por operador (con IVA = +13% en los precios públicos de sus tours)
-- ----------------------------------------------------------------------------
alter table public.operadores add column if not exists con_iva boolean not null default false;
grant select (con_iva) on public.operadores to anon;

-- ----------------------------------------------------------------------------
-- 9) Activo/inactivo del tour (los desactivados no se muestran en la vista pública)
-- ----------------------------------------------------------------------------
alter table public.tours add column if not exists activo boolean not null default true;
grant select (activo) on public.tours to anon;

-- ----------------------------------------------------------------------------
-- 10) Perfiles y roles (admin = acceso total, vendedor = solo lectura)
-- ----------------------------------------------------------------------------
create table if not exists public.perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'vendedor' check (rol in ('admin', 'vendedor')),
  creado_en timestamptz not null default now()
);

alter table public.perfiles enable row level security;
revoke all on public.perfiles from anon;
grant select, insert, update, delete on public.perfiles to authenticated;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
     where user_id = auth.uid() and rol = 'admin'
  );
$$;

drop policy if exists "perfiles_propio" on public.perfiles;
create policy "perfiles_propio" on public.perfiles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "perfiles_admin" on public.perfiles;
create policy "perfiles_admin" on public.perfiles
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (user_id, rol)
  values (new.id, 'vendedor')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil();

insert into public.perfiles (user_id, rol)
select id, 'admin' from auth.users
on conflict (user_id) do nothing;

-- RLS por rol: vendedor solo lee; admin lee y escribe.
drop policy if exists "tours_acceso" on public.tours;
drop policy if exists "tours_lectura" on public.tours;
drop policy if exists "tours_admin" on public.tours;
create policy "tours_lectura" on public.tours
  for select to authenticated using (activo);
create policy "tours_admin" on public.tours
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "operadores_acceso" on public.operadores;
drop policy if exists "operadores_lectura" on public.operadores;
drop policy if exists "operadores_admin" on public.operadores;
create policy "operadores_lectura" on public.operadores
  for select to authenticated using (true);
create policy "operadores_admin" on public.operadores
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "tour_tarifas_acceso" on public.tour_tarifas;
drop policy if exists "tour_tarifas_lectura" on public.tour_tarifas;
drop policy if exists "tour_tarifas_admin" on public.tour_tarifas;
create policy "tour_tarifas_lectura" on public.tour_tarifas
  for select to authenticated
  using (
    exists (select 1 from public.tours t where t.id = tour_id and t.activo)
  );
create policy "tour_tarifas_admin" on public.tour_tarifas
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "tour_horarios_acceso" on public.tour_horarios;
drop policy if exists "tour_horarios_lectura" on public.tour_horarios;
drop policy if exists "tour_horarios_admin" on public.tour_horarios;
create policy "tour_horarios_lectura" on public.tour_horarios
  for select to authenticated
  using (
    exists (select 1 from public.tours t where t.id = tour_id and t.activo)
  );
create policy "tour_horarios_admin" on public.tour_horarios
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "hotel_acceso" on public.hotel;
drop policy if exists "hotel_lectura" on public.hotel;
drop policy if exists "hotel_admin" on public.hotel;
create policy "hotel_lectura" on public.hotel
  for select to authenticated using (true);
create policy "hotel_admin" on public.hotel
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "usuarios_acceso" on public.usuarios;
drop policy if exists "usuarios_admin" on public.usuarios;
create policy "usuarios_admin" on public.usuarios
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ----------------------------------------------------------------------------
-- 11) Privacidad pública (anon)
-- ----------------------------------------------------------------------------
revoke all on public.hotel from anon;
grant select on public.hotel to anon;

revoke all on public.tour_horarios from anon;
grant select on public.tour_horarios to anon;

revoke all on public.usuarios from anon;

drop policy if exists "operadores_lectura_publica" on public.operadores;
create policy "operadores_lectura_publica" on public.operadores
  for select to anon using (activo);

drop policy if exists "tour_tarifas_lectura_publica" on public.tour_tarifas;
create policy "tour_tarifas_lectura_publica" on public.tour_tarifas
  for select to anon
  using (
    exists (select 1 from public.tours t where t.id = tour_id and t.activo)
  );

drop policy if exists "tour_horarios_lectura_publica" on public.tour_horarios;
create policy "tour_horarios_lectura_publica" on public.tour_horarios
  for select to anon
  using (
    exists (select 1 from public.tours t where t.id = tour_id and t.activo)
  );

-- El sitio público no necesita el contacto ni la póliza del operador.
revoke select (telefono, email, poliza_url, politica_cancelacion) on public.operadores from anon;

-- Storage: subir/borrar solo administradores.
drop policy if exists "logos_upload" on storage.objects;
create policy "logos_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and public.es_admin());
drop policy if exists "logos_delete" on storage.objects;
create policy "logos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and public.es_admin());

drop policy if exists "polizas_upload" on storage.objects;
create policy "polizas_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'polizas' and public.es_admin());
drop policy if exists "polizas_delete" on storage.objects;
create policy "polizas_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'polizas' and public.es_admin());

drop policy if exists "fondos_upload" on storage.objects;
create policy "fondos_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fondos' and public.es_admin());
drop policy if exists "fondos_delete" on storage.objects;
create policy "fondos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fondos' and public.es_admin());

notify pgrst, 'reload schema';
