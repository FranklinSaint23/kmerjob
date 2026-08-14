import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * L'utilisateur a-t-il un abonnement actif ?
 *
 * Délègue à la fonction SQL has_active_subscription plutôt que de refaire le
 * calcul en TypeScript : une seule définition de « actif », partagée par le
 * serveur, les policies et le scheduler. Deux implémentations finiraient par
 * diverger, et la divergence donnerait soit du premium gratuit, soit des
 * clients payants bloqués.
 *
 * Séparé de lib/subscription.ts (constantes pures) : ce fichier a besoin du
 * client Supabase serveur, donc `server-only` — importer PREMIUM_PLAN depuis
 * un composant client ne doit pas entraîner cette dépendance.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('has_active_subscription', { uid: userId })

  if (error) {
    // En cas d'erreur base, refuser l'accès premium plutôt que l'ouvrir.
    console.error('[subscription] échec de has_active_subscription', error)
    return false
  }
  return data === true
}
