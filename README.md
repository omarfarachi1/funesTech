
-- aca hacemos la estructura de la tabla de ofertas
-- =====================================================================
-- Funestrabajo · Áreas (categorías) para las ofertas
-- Supabase > SQL Editor > New query > pegar > Run
-- Se puede ejecutar más de una vez sin problemas.
-- =====================================================================

alter table public.ofertas
  add column if not exists categoria text not null default 'General';

create index if not exists ofertas_categoria_idx on public.ofertas (categoria);

-- Asignar un área a las ofertas que ya cargaste (solo si todavía están en "General").
-- Ajustá los nombres o agregá líneas para tus otras ofertas.
update public.ofertas set categoria = 'Comercio'       where categoria = 'General' and titulo ilike 'Cajero%';
update public.ofertas set categoria = 'Gastronomía'    where categoria = 'General' and titulo ilike '%cocina%';
update public.ofertas set categoria = 'Administración' where categoria = 'General' and titulo ilike 'Administrativo%';
update public.ofertas set categoria = 'Construcción'   where categoria = 'General' and titulo ilike 'Pañolero%';

-- Ver cómo quedó
select titulo, categoria from public.ofertas order by creada_en desc;




--aca realizamos la estructura para poder cambiar la foto de perfil



-- =====================================================================
-- Funestrabajo · Foto de perfil
-- Supabase > SQL Editor > New query > pegar > Run
-- Se puede ejecutar más de una vez sin problemas.
-- =====================================================================

alter table public.cuentas
  add column if not exists foto_path           text,
  add column if not exists foto_actualizada_en timestamptz;

-- Espacio privado para las fotos (solo JPEG, hasta 1 MB).
-- La app recorta y comprime la imagen antes de subirla.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

-- Verificación: tiene que mostrar las dos columnas nuevas y el espacio "fotos"
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'cuentas'
  and column_name in ('foto_path', 'foto_actualizada_en');
select id, public, file_size_limit from storage.buckets where id = 'fotos';




-- =====================================================================
-- Funestrabajo · Recuperación de contraseña por correo
-- =====================================================================

-- ANTES de ejecutar: revisá que no haya correos repetidos entre cuentas.
-- Si esta consulta devuelve filas, hay que corregirlos (cada cuenta necesita un correo propio):
--   select lower(btrim(email)) as email, count(*) from public.cuentas
--   where email is not null group by 1 having count(*) > 1;

-- 1. Correo en minúsculas, con formato válido y único por cuenta
alter table public.cuentas add column if not exists email text;

update public.cuentas set email = lower(btrim(email)) where email is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cuentas_email_formato') then
    alter table public.cuentas add constraint cuentas_email_formato
      check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
  end if;
end $$;

create unique index if not exists cuentas_email_unico
  on public.cuentas (email) where email is not null;

-- 2. Pedidos de recuperación (se guarda solo el hash del enlace, nunca el enlace)
create table if not exists public.recuperaciones (
  id         uuid primary key default gen_random_uuid(),
  cuenta_id  uuid not null references public.cuentas(id) on delete cascade,
  token_hash text not null unique,
  expira_en  timestamptz not null,
  usada_en   timestamptz,
  creada_en  timestamptz not null default now()
);

create index if not exists recuperaciones_cuenta_idx
  on public.recuperaciones (cuenta_id, creada_en desc);

-- 3. Seguridad: solo el servidor accede
alter table public.recuperaciones enable row level security;
revoke all on public.recuperaciones from anon, authenticated;

-- Verificación
select
  (select count(*) from pg_indexes where indexname = 'cuentas_email_unico')       as indice_email,
  (select count(*) from information_schema.tables where table_name = 'recuperaciones') as tabla_recuperaciones;
-- Esperado: 1 y 1