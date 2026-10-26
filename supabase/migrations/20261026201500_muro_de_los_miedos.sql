-- ============================================================================
-- El Muro de los Miedos · tabla base, índices, RLS y permisos
-- Proyecto: muro_halloween_db (Supabase)
--
-- Reglas del juego:
--   · cualquiera (rol anon) puede LEER y ESCRIBIR miedos
--   · nadie puede EDITAR ni BORRAR desde el cliente
--   · la longitud se valida también en la base de datos, no solo en el form
-- ============================================================================

create table if not exists public.miedos (
  id bigint generated always as identity primary key,
  contenido text not null,
  autor_alias text not null default 'Anónimo',
  creado_en timestamptz not null default now(),

  -- Un miedo de 1 caracter no es un miedo: mínimo algo legible.
  constraint miedos_contenido_util
    check (char_length(btrim(contenido)) between 3 and 280),

  constraint miedos_alias_corto
    check (char_length(autor_alias) between 1 and 24)
);

comment on table public.miedos is
  'Muro de los Miedos: papelitos anónimos publicados durante el evento de Halloween.';

-- El muro se lee siempre por fecha descendente, y el auto-refresh busca por id.
create index if not exists miedos_creado_en_idx
  on public.miedos (creado_en desc, id desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.miedos enable row level security;
-- Ni siquiera el dueño de la tabla se salta RLS (service_role sigue teniendo BYPASSRLS).
alter table public.miedos force row level security;

drop policy if exists "miedos_lectura_publica" on public.miedos;
create policy "miedos_lectura_publica"
  on public.miedos
  for select
  to anon, authenticated
  using (true);

drop policy if exists "miedos_insercion_publica" on public.miedos;
create policy "miedos_insercion_publica"
  on public.miedos
  for insert
  to anon, authenticated
  with check (true);

-- No hay políticas de UPDATE ni DELETE: con RLS activo, esas operaciones
-- quedan denegadas para anon/authenticated aunque alguien tenga el grant.

-- ----------------------------------------------------------------------------
-- Permisos
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

-- Partimos de cero para que no queden permisos heredados de un intento previo.
revoke all on table public.miedos from anon, authenticated;
grant select, insert on table public.miedos to anon, authenticated;

-- La columna id es `identity`: hace falta USAGE sobre su secuencia para insertar.
grant usage, select on all sequences in schema public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Datos de ejemplo (opcional, para ver el muro con algo dentro antes del evento)
-- ----------------------------------------------------------------------------
-- insert into public.miedos (contenido, autor_alias) values
--   ('Que se me olvide cómo se respira cuando me toque hablar en clase.', 'Anónimo'),
--   ('Los pasillos vacíos después de las 10 de la noche.', 'la del fondo'),
--   ('Volver a casa y que ya no quede nadie despierto.', 'Anónimo');
