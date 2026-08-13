-- =============================================================================
-- KmerJob — Row Level Security
--
-- Principe : RLS activé sur TOUTES les tables publiques, sans exception.
-- Une table sans policy pour une action donnée = action refusée pour `anon` et
-- `authenticated`. C'est volontaire : les écritures sur `offers`,
-- `subscriptions`, `transactions` et `scraping_logs` passent uniquement par la
-- clé `service_role` (scraper, webhook Dohone, routes serveur), qui contourne
-- RLS par conception. Le client navigateur ne peut donc jamais s'auto-accorder
-- un abonnement ni publier une offre.
--
-- Règle d'or : la clé SUPABASE_SERVICE_ROLE_KEY ne doit JAMAIS être exposée
-- côté client — pas de préfixe NEXT_PUBLIC_, jamais importée dans un composant
-- client. Voir lib/supabase/admin.ts.
-- =============================================================================

alter table public.profiles       enable row level security;
alter table public.offers         enable row level security;
alter table public.cv_profiles    enable row level security;
alter table public.favorites      enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.transactions   enable row level security;
alter table public.scraping_logs  enable row level security;

-- =============================================================================
-- profiles — chacun ne voit et ne modifie que le sien
-- =============================================================================
create policy "profiles: lecture de son propre profil"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: modification de son propre profil"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Pas de policy INSERT : le profil est créé par le trigger on_auth_user_created
-- (security definer). Pas de policy DELETE : la suppression suit celle du
-- compte auth via ON DELETE CASCADE.

-- =============================================================================
-- offers — catalogue public en lecture seule
-- =============================================================================
create policy "offers: les offres actives sont publiques"
  on public.offers for select
  to anon, authenticated
  using (active = true);

-- Aucune policy d'écriture : insertion/mise à jour réservées au service_role
-- (scraper et back-office).

-- =============================================================================
-- cv_profiles — strictement privé
-- =============================================================================
create policy "cv: lecture de son propre CV"
  on public.cv_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "cv: création de son propre CV"
  on public.cv_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "cv: mise à jour de son propre CV"
  on public.cv_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "cv: suppression de son propre CV"
  on public.cv_profiles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- favorites
-- =============================================================================
create policy "favoris: lecture des siens"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "favoris: ajout des siens"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "favoris: retrait des siens"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- subscriptions — lecture seule côté utilisateur
-- =============================================================================
create policy "abonnements: lecture des siens"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Aucune policy d'écriture : seul le webhook de paiement (service_role) active
-- un abonnement. Sans ça, n'importe quel utilisateur passerait premium avec un
-- simple UPDATE depuis la console du navigateur.

-- =============================================================================
-- transactions — lecture seule côté utilisateur
-- =============================================================================
create policy "transactions: lecture des siennes"
  on public.transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Écriture réservée au service_role (initiation du paiement + callback Dohone).

-- =============================================================================
-- scraping_logs — aucune policy : invisible depuis le client, service_role only
-- =============================================================================

-- =============================================================================
-- Storage : bucket privé `cvs`
-- Convention de chemin : {user_id}/{uuid}.pdf
-- La policy compare le PREMIER segment du chemin à auth.uid(), ce qui isole
-- chaque utilisateur dans son propre dossier.
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  5242880,  -- 5 Mo
  array['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain']
)
on conflict (id) do nothing;

create policy "cvs: dépôt dans son propre dossier"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "cvs: lecture de son propre dossier"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "cvs: remplacement de son propre fichier"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "cvs: suppression de son propre fichier"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
