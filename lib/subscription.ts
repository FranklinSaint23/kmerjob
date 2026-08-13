import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Durée d'un abonnement premium et son prix, en un seul endroit.
 * Le montant est en FCFA entier — jamais de flottant sur de l'argent.
 */
export const PREMIUM_PLAN = {
  amountXaf: 2000,
  durationDays: 30,
  label: 'Premium — 30 jours',
} as const

/**
 * L'utilisateur a-t-il un abonnement actif ?
 *
 * Délègue à la fonction SQL has_active_subscription plutôt que de refaire le
 * calcul en TypeScript : une seule définition de « actif », partagée par le
 * serveur, les policies et le scheduler. Deux implémentations finiraient par
 * diverger, et la divergence donnerait soit du premium gratuit, soit des
 * clients payants bloqués.
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

export function premiumExpiryFrom(start: Date = new Date()): Date {
  const expiry = new Date(start)
  expiry.setDate(expiry.getDate() + PREMIUM_PLAN.durationDays)
  return expiry
}
