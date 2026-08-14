-- =============================================================================
-- KmerJob — back-office admin
--
-- Ajoute un rôle sur les profils pour distinguer les administrateurs (qui
-- publient des offres à la main tant qu'aucun scraper n'est branché), et
-- élargit trust_analyzed_by pour refléter honnêtement qu'une offre publiée
-- au back-office n'est ni analysée par les règles ni par Groq, mais par une
-- personne.
-- =============================================================================

alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

-- Défense en profondeur : même si la policy RLS "profiles: modification de
-- son propre profil" autorise un utilisateur à mettre à jour SA ligne, cette
-- restriction au niveau colonne l'empêche de s'auto-promouvoir admin via un
-- simple appel PostgREST. Seul service_role (et le rôle postgres utilisé par
-- l'éditeur SQL) peut écrire dans cette colonne.
revoke update (role) on public.profiles from authenticated;

-- La contrainte de 0001_init.sql a un nom auto-généré par Postgres ; on le
-- retrouve dynamiquement plutôt que de le deviner, pour ne pas risquer un
-- DROP silencieusement sans effet si le nom réel diffère.
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.offers'::regclass
    and pg_get_constraintdef(oid) ilike '%trust_analyzed_by%';

  if cname is not null then
    execute format('alter table public.offers drop constraint %I', cname);
  end if;
end $$;

alter table public.offers
  add constraint offers_trust_analyzed_by_check
  check (trust_analyzed_by in ('rules', 'groq', 'admin'));

comment on column public.offers.trust_analyzed_by is
  'rules = heuristiques regex, groq = LLM, admin = saisie manuelle au back-office (déjà curatée par une personne).';

-- =============================================================================
-- Pour te nommer administrateur : trouve ton user id dans Authentication >
-- Users du dashboard Supabase, puis exécute (en remplaçant l'UUID) :
--
--   update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000000';
--
-- Cette mise à jour doit être lancée depuis le SQL Editor du dashboard (elle
-- s'exécute avec les privilèges postgres, qui contournent le REVOKE
-- ci-dessus) — pas depuis l'application.
-- =============================================================================