-- =====================================================================
-- Funestrabajo · Municipalidad de Funes
-- Estructura de base de datos para registrar postulantes y empresas
-- Pegar y ejecutar en Supabase: SQL Editor > New query > Run
-- =====================================================================

-- ---------- Tipos ----------
create type public.tipo_cuenta as enum ('persona', 'empresa');   -- postulante o empresa
create type public.personeria  as enum ('fisica', 'juridica');   -- solo para empresas

-- ---------- Tabla principal ----------
create table public.cuentas (
  id               uuid primary key default gen_random_uuid(),
  tipo             public.tipo_cuenta not null,
  personeria       public.personeria,                 -- NULL para postulantes

  -- Postulante / persona física: nombre y apellido
  -- Persona jurídica:            razón social
  nombre           text not null,

  -- Postulante / persona física: DNI (7 u 8 dígitos)
  -- Persona jurídica:            CUIT (11 dígitos)
  dni              text not null,

  -- Postulante / persona física: fecha de nacimiento
  -- Persona jurídica:            fecha de constitución
  fecha_nacimiento date not null,

  usuario          text not null,                     -- siempre en minúsculas
  password_hash    text not null,                     -- hash bcrypt, nunca la contraseña

  creada_en        timestamptz not null default now(),
  actualizada_en   timestamptz not null default now(),

  -- Reglas de integridad
  constraint cuentas_usuario_unico unique (usuario),
  constraint cuentas_dni_unico_por_tipo unique (tipo, dni),

  constraint cuentas_nombre_largo
    check (char_length(btrim(nombre)) between 2 and 100),

  constraint cuentas_usuario_formato
    check (usuario ~ '^[a-z0-9._-]{4,30}$'),

  constraint cuentas_fecha_valida
    check (fecha_nacimiento >= date '1900-01-01'),

  -- Las empresas deben indicar si son físicas o jurídicas; los postulantes no
  constraint cuentas_personeria_coherente
    check (
      (tipo = 'empresa' and personeria is not null)
      or (tipo = 'persona' and personeria is null)
    ),

  -- CUIT de 11 dígitos para jurídicas; DNI de 7 u 8 dígitos para el resto
  constraint cuentas_dni_formato
    check (
      (personeria = 'juridica' and dni ~ '^[0-9]{11}$')
      or (personeria is distinct from 'juridica' and dni ~ '^[0-9]{7,8}$')
    )
);

comment on table  public.cuentas                  is 'Postulantes y empresas registrados en Funestrabajo.';
comment on column public.cuentas.nombre           is 'Nombre y apellido, o razón social si es persona jurídica.';
comment on column public.cuentas.dni              is 'DNI, o CUIT si es persona jurídica. Solo dígitos.';
comment on column public.cuentas.fecha_nacimiento is 'Fecha de nacimiento, o de constitución si es persona jurídica.';
comment on column public.cuentas.password_hash    is 'Hash bcrypt de la contraseña.';

-- ---------- Actualizar "actualizada_en" automáticamente ----------
create or replace function public.set_actualizada_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$;

create trigger cuentas_actualizada_en
  before update on public.cuentas
  for each row execute function public.set_actualizada_en();

-- ---------- Seguridad ----------
-- La tabla guarda DNI y hashes: se bloquea el acceso desde el navegador.
-- Solo el servidor de la aplicación podrá leerla/escribirla, usando la
-- clave "service_role" (que se saltea RLS). Sin políticas, anon y
-- authenticated no pueden hacer nada.
alter table public.cuentas enable row level security;
revoke all on public.cuentas from anon, authenticated;

-- ---------- Índice de apoyo ----------
-- El login busca por usuario; la restricción UNIQUE ya crea ese índice.
-- Si más adelante se listan cuentas por tipo, este índice ayuda:
create index cuentas_tipo_idx on public.cuentas (tipo);

-- =====================================================================
-- Prueba opcional (ejemplo de inserción; el hash es solo de muestra)
-- =====================================================================
-- insert into public.cuentas (tipo, nombre, dni, fecha_nacimiento, usuario, password_hash)
-- values ('persona', 'Ana Pérez', '30123456', '1990-05-10', 'ana.perez', '$2a$10$hashDeEjemplo');
--
-- insert into public.cuentas (tipo, personeria, nombre, dni, fecha_nacimiento, usuario, password_hash)
-- values ('empresa', 'juridica', 'CEO Construcciones SRL', '30712345678', '2005-03-01', 'ceoconstrucciones', '$2a$10$hashDeEjemplo');
