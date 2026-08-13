-- =============================================================================
-- KmerJob — recherche et présélection pour le matching
--
-- Ces fonctions font le gros filtrage en base (rapide, indexé), pour ne
-- remonter au serveur Next.js qu'une short-list. C'est cette short-list que
-- Groq reclasse ensuite contre le CV (voir lib/matching.ts) — un appel LLM sur
-- 40 offres coûte quelques centimes ; sur 5000, ce serait absurde.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- search_offers — recherche plein texte + filtres, avec pagination
-- `p_query` accepte la syntaxe naturelle ("développeur -stage", "python OR go")
-- grâce à websearch_to_tsquery. Chaîne vide = pas de filtre texte.
-- -----------------------------------------------------------------------------
create or replace function public.search_offers(
  p_query         text default '',
  p_location      text default null,
  p_sector        text default null,
  p_category      text default null,
  p_contract_type text default null,
  p_trust_level   text default null,
  p_limit         integer default 20,
  p_offset        integer default 0
)
returns table (
  id            uuid,
  title         text,
  company       text,
  category      text,
  sector        text,
  location      text,
  contract_type text,
  seniority     text,
  description   text,
  requirements  text[],
  salary        text,
  salary_min    integer,
  salary_max    integer,
  deadline      date,
  source        text,
  source_url    text,
  date_posted   date,
  trust_level   text,
  trust_score   integer,
  trust_reasons text[],
  rank          real,
  total_count   bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select case
             when coalesce(trim(p_query), '') = '' then null
             else websearch_to_tsquery('french', p_query)
           end as tsq
  ),
  filtered as (
    select o.*,
           case when (select tsq from q) is null then 0::real
                else ts_rank(o.search_vector, (select tsq from q))
           end as rank
    from public.offers o
    where o.active = true
      and ((select tsq from q) is null or o.search_vector @@ (select tsq from q))
      and (p_location      is null or o.location      = p_location)
      and (p_sector        is null or o.sector        = p_sector)
      and (p_category      is null or o.category      = p_category)
      and (p_contract_type is null or o.contract_type = p_contract_type)
      and (p_trust_level   is null or o.trust_level   = p_trust_level)
  )
  select f.id, f.title, f.company, f.category, f.sector, f.location,
         f.contract_type, f.seniority, f.description, f.requirements,
         f.salary, f.salary_min, f.salary_max, f.deadline, f.source,
         f.source_url, f.date_posted, f.trust_level, f.trust_score,
         f.trust_reasons, f.rank,
         count(*) over () as total_count
  from filtered f
  order by f.rank desc, f.date_posted desc
  limit greatest(1, least(p_limit, 100))
  offset greatest(0, p_offset);
$$;

comment on function public.search_offers is
  'Recherche plein texte française + filtres à facettes. total_count est le nombre total avant pagination.';

-- -----------------------------------------------------------------------------
-- shortlist_offers_for_cv — présélection des candidates à reclasser
--
-- Stratégie : on construit une requête OR à partir des compétences et intitulés
-- de poste extraits du CV, et on remonte les meilleures correspondances. Si le
-- CV ne donne aucun mot-clé exploitable (CV illisible, scanné), on retombe sur
-- les offres les plus récentes plutôt que de ne rien renvoyer — un résultat
-- imparfait vaut mieux qu'une page vide.
-- -----------------------------------------------------------------------------
create or replace function public.shortlist_offers_for_cv(
  p_keywords text[],
  p_limit    integer default 40
)
returns table (
  id            uuid,
  title         text,
  company       text,
  sector        text,
  location      text,
  seniority     text,
  description   text,
  requirements  text[],
  salary        text,
  trust_level   text,
  trust_score   integer,
  date_posted   date,
  rank          real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    -- array_to_string + ' or ' => websearch_to_tsquery génère une disjonction
    select case
             when p_keywords is null or cardinality(p_keywords) = 0 then null
             else websearch_to_tsquery('french', array_to_string(p_keywords, ' or '))
           end as tsq
  )
  select o.id, o.title, o.company, o.sector, o.location, o.seniority,
         o.description, o.requirements, o.salary, o.trust_level, o.trust_score,
         o.date_posted,
         case when (select tsq from q) is null then 0::real
              else ts_rank(o.search_vector, (select tsq from q))
         end as rank
  from public.offers o
  where o.active = true
    and ((select tsq from q) is null or o.search_vector @@ (select tsq from q))
  order by rank desc, o.date_posted desc
  limit greatest(1, least(p_limit, 100));
$$;

-- -----------------------------------------------------------------------------
-- Facettes pour les filtres de l'UI (évite un SELECT DISTINCT côté client)
-- -----------------------------------------------------------------------------
create or replace function public.offer_facets()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'locations',      (select coalesce(jsonb_agg(distinct location order by location), '[]'::jsonb) from public.offers where active),
    'sectors',        (select coalesce(jsonb_agg(distinct sector   order by sector),   '[]'::jsonb) from public.offers where active),
    'categories',     (select coalesce(jsonb_agg(distinct category order by category), '[]'::jsonb) from public.offers where active),
    'contract_types', (select coalesce(jsonb_agg(distinct contract_type order by contract_type), '[]'::jsonb) from public.offers where active),
    'total',          (select count(*) from public.offers where active)
  );
$$;
