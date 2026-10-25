-- À exécuter une fois dans Supabase > SQL Editor.
-- Le workflow keep-scores-alive appelle keepalive() pour écrire dans la base :
-- une simple lecture ne suffit pas à Supabase pour juger le projet actif.
-- Une seule ligne, mise à jour à chaque appel : la table ne grossit pas.

create table if not exists public.keepalive (
  id int primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);

-- RLS sans policy : personne n'accède à la table directement,
-- seule la fonction ci-dessous (security definer) y écrit.
alter table public.keepalive enable row level security;

create or replace function public.keepalive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  insert into public.keepalive (id, pinged_at) values (1, now())
  on conflict (id) do update set pinged_at = excluded.pinged_at
  returning pinged_at;
$$;

revoke execute on function public.keepalive() from public, authenticated;
grant execute on function public.keepalive() to anon;
