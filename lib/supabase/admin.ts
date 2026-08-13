import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/types/database'

/**
 * Client à privilèges service_role : CONTOURNE TOUTES LES POLICIES RLS.
 *
 * L'import "server-only" en tête de fichier fait échouer le build si ce module
 * se retrouve dans un bundle client — c'est un garde-fou de compilation, pas
 * une simple convention.
 *
 * Réservé à trois usages, et à rien d'autre :
 *   1. l'ingestion d'offres par le scraper,
 *   2. le webhook de paiement Dohone (activation d'abonnement),
 *   3. les tâches d'administration.
 *
 * Toute lecture ou écriture faite au nom d'un utilisateur doit passer par
 * lib/supabase/server.ts, pour que RLS reste la dernière ligne de défense.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquante. Renseigne-la dans .env.local (jamais avec le préfixe NEXT_PUBLIC_).'
    )
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
