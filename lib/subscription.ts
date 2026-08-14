/**
 * Constantes et calculs purs autour de l'abonnement premium — importables
 * depuis un composant client comme depuis le serveur.
 *
 * `hasActiveSubscription()` (qui a besoin du client Supabase serveur) vit
 * séparément dans lib/subscription-server.ts : ce fichier-ci ne doit jamais
 * porter `import 'server-only'`, sous peine de faire échouer `next build` dès
 * qu'un composant client (ex. app/premium/paiement/page.tsx) importe ne
 * serait-ce que PREMIUM_PLAN — server-only contamine tout le module qui le
 * déclare, pas seulement les exports qui en ont réellement besoin.
 */

/** Montant en FCFA entier — jamais de flottant sur de l'argent. */
export const PREMIUM_PLAN = {
  amountXaf: 2000,
  durationDays: 30,
  label: 'Premium — 30 jours',
} as const

export function premiumExpiryFrom(start: Date = new Date()): Date {
  const expiry = new Date(start)
  expiry.setDate(expiry.getDate() + PREMIUM_PLAN.durationDays)
  return expiry
}
