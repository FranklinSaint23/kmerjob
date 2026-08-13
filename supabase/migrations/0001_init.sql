-- =============================================================================
-- KmerJob — schéma initial
-- À exécuter dans le SQL Editor de Supabase (ou `supabase db push`).
--
-- Note sur pgvector : l'extension et les colonnes `embedding` sont créées dès
-- maintenant, mais laissées NULL. Le matching CV↔offre de la v1 fonctionne
-- sans elles (recherche plein texte française + reclassement Groq, voir
-- lib/matching.ts). Les embeddings sont donc un ajout par-dessus, pas un
-- prérequis — on n'est pas bloqué par le fait que Groq n'expose aucun modèle
-- d'embedding.
-- Dimension 384 = celle de gte-small, le modèle embarqué gratuitement dans les
-- Edge Functions Supabase. À changer si tu prends un autre fournisseur.
-- =============================================================================

create extension if not exists vector;
create extension if not exists pg_trgm;

-- =============================================================================
-- profiles — miroir applicatif de auth.users
-- =============================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Données applicatives de l''utilisateur. auth.users reste la source de vérité pour email/mot de passe.';

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- offers
-- =============================================================================
create table public.offers (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  company        text not null,
  category       text not null default 'Privée informelle',
  sector         text not null default 'Autre',
  location       text not null default 'Non précisé',
  contract_type  text not null default 'Non précisé',
  seniority      text not null default 'Non précisé',
  description    text not null,
  requirements   text[] not null default '{}',

  -- salary : texte brut tel que publié + bornes analysées pour le simulateur
  salary         text,
  salary_min     integer,
  salary_max     integer,

  deadline       date,
  source         text not null default 'manuel',
  source_url     text,
  date_posted    date not null default current_date,
  active         boolean not null default true,

  -- fiabilité
  trust_level    text not null default 'moderee'
                 check (trust_level in ('verifiee', 'moderee', 'suspecte')),
  trust_score    integer not null default 50 check (trust_score between 0 and 100),
  trust_reasons  text[] not null default '{}',
  trust_analyzed_by text not null default 'rules'
                 check (trust_analyzed_by in ('rules', 'groq')),

  -- déduplication : sha256(titre|entreprise|description)
  content_hash   text not null unique,

  embedding      vector(384),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Recherche plein texte française.
--
-- Pas de colonne GENERATED ALWAYS AS : to_tsvector(regconfig, text) est
-- STABLE (pas IMMUTABLE) pour Postgres, et Supabase rejette toute expression
-- de colonne générée référençant même indirectement une fonction STABLE,
-- wrapper immutable ou non. Solution éprouvée : colonne normale + trigger
-- BEFORE INSERT/UPDATE, la façon documentée par Postgres lui-même de
-- maintenir un tsvector (voir "Triggers for Automatic Updates" dans la doc
-- officielle des types de recherche texte). Un trigger n'est soumis à aucune
-- contrainte de volatilité.
alter table public.offers add column search_vector tsvector;

create or replace function public.offers_search_vector_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('french', coalesce(new.title, '')),       'A') ||
    setweight(to_tsvector('french', coalesce(new.company, '')),     'B') ||
    setweight(to_tsvector('french', array_to_string(coalesce(new.requirements, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('french', coalesce(new.description, '')), 'C');
  return new;
end;
$$;

create trigger offers_search_vector_trigger
  before insert or update on public.offers
  for each row execute function public.offers_search_vector_update();

create index offers_search_idx    on public.offers using gin (search_vector);
create index offers_active_idx    on public.offers (active, date_posted desc);
create index offers_location_idx  on public.offers (location) where active;
create index offers_sector_idx    on public.offers (sector)   where active;
create index offers_title_trgm_idx on public.offers using gin (title gin_trgm_ops);

-- Index vectoriel : à créer seulement une fois les embeddings réellement
-- remplis (ivfflat sur une table vide donne un index inutilisable).
-- create index offers_embedding_idx on public.offers
--   using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- =============================================================================
-- cv_profiles — un seul CV actif par utilisateur
-- =============================================================================
create table public.cv_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,

  file_path         text,          -- chemin dans le bucket Storage `cvs`
  file_name         text,
  raw_text          text not null default '',

  -- champs extraits (par Groq, ou par les règles en repli)
  skills            text[] not null default '{}',
  job_titles        text[] not null default '{}',
  languages         text[] not null default '{}',
  experience_years  integer not null default 0,
  education_label   text not null default 'Non précisé',
  education_rank    integer not null default 0 check (education_rank between 0 and 5),
  location          text,
  summary           text,

  extracted_by      text not null default 'rules'
                    check (extracted_by in ('rules', 'groq')),

  embedding         vector(384),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- =============================================================================
-- favorites
-- =============================================================================
create table public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  offer_id   uuid not null references public.offers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create index favorites_user_idx on public.favorites (user_id, created_at desc);

-- =============================================================================
-- subscriptions — abonnement premium (Radar IA)
-- =============================================================================
create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan        text not null default 'premium' check (plan in ('premium')),
  status      text not null default 'pending'
              check (status in ('pending', 'active', 'expired', 'cancelled')),
  started_at  timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id, status);

-- Abonnement actif = statut actif ET non expiré. Centralisé ici pour que le
-- frontend, les policies et les routes API partagent la même définition.
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
  );
$$;

-- =============================================================================
-- transactions — paiements Mobile Money via Dohone
-- =============================================================================
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,

  amount          integer not null check (amount > 0),   -- en FCFA, entier
  currency        text not null default 'XAF',
  operator        text not null check (operator in ('mtn', 'orange')),
  phone           text not null,

  status          text not null default 'pending'
                  check (status in ('pending', 'awaiting_confirmation', 'success', 'failed', 'cancelled')),

  dohone_ref      text,            -- référence renvoyée par Dohone
  idempotency_key text unique,     -- garde-fou contre le double débit
  raw_payload     jsonb not null default '{}',
  error_message   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index transactions_user_idx on public.transactions (user_id, created_at desc);
create index transactions_ref_idx  on public.transactions (dohone_ref) where dohone_ref is not null;

-- =============================================================================
-- scraping_logs
-- =============================================================================
create table public.scraping_logs (
  id                uuid primary key default gen_random_uuid(),
  source_name       text not null,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  status            text not null default 'running'
                    check (status in ('running', 'success', 'error')),
  offers_found      integer not null default 0,
  offers_created    integer not null default 0,
  offers_duplicate  integer not null default 0,
  error_message     text
);

create index scraping_logs_started_idx on public.scraping_logs (started_at desc);

-- =============================================================================
-- updated_at automatique
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch      before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger offers_touch        before update on public.offers
  for each row execute function public.touch_updated_at();
create trigger cv_profiles_touch   before update on public.cv_profiles
  for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();
create trigger transactions_touch  before update on public.transactions
  for each row execute function public.touch_updated_at();
