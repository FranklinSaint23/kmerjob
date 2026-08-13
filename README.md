# KmerJob

Plateforme d'emploi camerounaise : recherche d'offres, analyse de CV assistée
par IA, détection d'annonces frauduleuses, Radar géolocalisé et abonnement
payable en Mobile Money.

**Stack :** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase
(Postgres, Auth, Storage, Realtime) · Groq.

---

## Démarrage

### 1. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Renseigner :

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | idem — **serveur uniquement, jamais `NEXT_PUBLIC_`** |
| `GROQ_API_KEY` | https://console.groq.com/keys |

### 2. Migrations

Exécuter dans le SQL Editor de Supabase, **dans cet ordre** :

1. `supabase/migrations/0001_init.sql` — tables, index, triggers
2. `supabase/migrations/0002_rls.sql` — Row Level Security + bucket `cvs`
3. `supabase/migrations/0003_search.sql` — recherche et présélection

Rien ne fonctionne tant que ces trois fichiers ne sont pas passés.

### 3. Lancer

```bash
npm run dev
```

---

## Architecture

```
app/
  api/
    cv/                 dépôt + analyse du CV
    recommandations/    meilleures offres pour le CV déposé
    radar/              Radar géolocalisé (réservé aux abonnés)
lib/
  ai/
    groq.ts             client Groq — JSON validé par Zod, une reprise
    cv-extraction.ts    extraction de CV (Groq, règles en repli)
    cv-rules.ts         moteur déterministe
    matching.ts         score déterministe + reclassement sémantique
    trust.ts            détection d'annonces douteuses
  supabase/
    client.ts           navigateur (clé anon, RLS active)
    server.ts           Server Components / Actions / Route Handlers
    admin.ts            service_role — contourne RLS, `server-only`
  cv/extract-text.ts    extraction du texte des PDF
  geo.ts                villes camerounaises, haversine, score de proximité
supabase/migrations/    schéma SQL
```

## Décisions à connaître

### L'IA ne peut jamais faire tomber le site

Chaque appel Groq a un repli déterministe (`cv-rules.ts`, `analyzeTrustWithRules`).
Clé absente, quota atteint, panne : le site sert des résultats moins fins, il ne
renvoie pas d'erreur. Les réponses exposent `extracted_by` / `analyzed_by` pour
que l'interface annonce honnêtement le mode utilisé plutôt que de laisser croire
à une analyse qui n'a pas eu lieu.

### Pas d'embeddings, et ce n'est pas un manque

Groq n'expose aucun modèle d'embedding. Le matching fonctionne donc en
retrieve-then-rerank : Postgres présélectionne ~40 offres par recherche plein
texte française (indexée, gratuite), puis Groq reclasse cette short-list. Un
appel LLM sur 40 offres coûte des centimes ; sur 5000 il serait absurde.

L'extension `pgvector` et les colonnes `embedding` existent déjà mais restent
NULL — l'ajout d'embeddings est une amélioration possible, pas un prérequis.

### Le classement reste majoritairement déterministe

Le score final mélange 60 % de règles explicites et 40 % de LLM. Un modèle seul
produit des classements instables d'un appel à l'autre et sait justifier de
façon convaincante une recommandation hors sujet. Cette pondération garde le
résultat reproductible et explicable à l'utilisateur, poste par poste
(`breakdown`).

### Fiabilité des annonces : les règles priment

Un signal d'arnaque avéré (frais de dossier, demande de code Mobile Money,
salaire délirant) rétrograde l'annonce même si le LLM la trouve rassurante. En
cas de doute, le niveau `moderee` l'emporte sur `verifiee`. Sur-avertir coûte un
haussement d'épaules ; sous-avertir coûte de l'argent à quelqu'un qui cherche du
travail.

### Sécurité

RLS activé sur toutes les tables. Les écritures sur `offers`, `subscriptions`,
`transactions` passent exclusivement par `service_role` : sans cela, n'importe
qui s'accorderait un abonnement premium depuis la console du navigateur.
`lib/supabase/admin.ts` importe `server-only`, ce qui fait échouer le build si
ce module atteint un bundle client.

---

## Reste à faire

- **Interface** : pages accueil, recherche, détail d'offre, dépôt de CV,
  premium, compte — et les composants associés.
- **Paiement Dohone** : le flux base de données est prévu (`transactions`,
  activation d'abonnement), mais l'intégration réelle attend les identifiants
  marchand de my-dohone.com. Sans eux, aucun code ne peut aboutir — c'est une
  démarche commerciale, pas technique.
- **Scraper** : service séparé écrivant dans Postgres via `service_role`.
  Volontairement hors de Next.js — les timeouts des fonctions serverless
  s'accordent mal avec du scraping multi-sources.
- **Jeu d'offres de démonstration** pour tester sans scraper.
- **Tests** : le scoring de `matching.ts` et les règles de `trust.ts` sont
  purement fonctionnels et méritent une couverture unitaire.
