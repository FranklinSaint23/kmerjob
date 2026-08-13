import { NextResponse } from 'next/server'

import { dohone, isDohoneConfigured } from '@/lib/payment/dohone'
import { premiumExpiryFrom, PREMIUM_PLAN } from '@/lib/subscription'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const PHONE_PATTERN = /^6[5-9]\d{7}$/ // numéros mobiles camerounais, 9 chiffres commençant par 6[5-9]

/**
 * POST /api/paiement/initier — démarre un abonnement premium.
 *
 * Écrit via le client service_role : `subscriptions` et `transactions` n'ont
 * aucune policy RLS d'écriture pour un utilisateur authentifié (voir
 * 0002_rls.sql) — sans quoi n'importe qui s'accorderait le premium depuis la
 * console du navigateur. L'authentification est donc vérifiée ici, à la main,
 * avant tout accès admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const phone = String(body?.phone ?? '').replace(/\s+/g, '')
  const operator = body?.operator

  if (operator !== 'mtn' && operator !== 'orange') {
    return NextResponse.json({ error: 'Opérateur invalide.' }, { status: 400 })
  }
  if (!PHONE_PATTERN.test(phone)) {
    return NextResponse.json(
      { error: 'Numéro invalide — 9 chiffres, ex. 677123456.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: subscription, error: subError } = await admin
    .from('subscriptions')
    .insert({ user_id: user.id, plan: 'premium', status: 'pending' })
    .select()
    .single()

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

  const idempotencyKey = crypto.randomUUID()

  const { data: transaction, error: txError } = await admin
    .from('transactions')
    .insert({
      user_id: user.id,
      subscription_id: subscription.id,
      amount: PREMIUM_PLAN.amountXaf,
      operator,
      phone,
      status: 'pending',
      idempotency_key: idempotencyKey,
    })
    .select()
    .single()

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  const result = await dohone.initiate({
    amount: PREMIUM_PLAN.amountXaf,
    phone,
    operator,
    reference: transaction.id,
  })

  if (!result.success) {
    await admin
      .from('transactions')
      .update({ status: 'failed', error_message: result.message })
      .eq('id', transaction.id)
    return NextResponse.json({ error: result.message }, { status: 502 })
  }

  // Mode simulation (Dohone non configuré) : aucune confirmation SMS externe
  // n'arrivera jamais, donc on active l'abonnement immédiatement pour que le
  // parcours reste testable de bout en bout. En production avec Dohone
  // configuré, c'est le webhook /api/paiement/callback qui fera cette mise à
  // jour, une fois le paiement réellement confirmé.
  if (!isDohoneConfigured() && !result.requiresSmsConfirmation) {
    const expiresAt = premiumExpiryFrom()
    await admin
      .from('transactions')
      .update({ status: 'success', dohone_ref: result.dohoneRef })
      .eq('id', transaction.id)
    await admin
      .from('subscriptions')
      .update({ status: 'active', started_at: new Date().toISOString(), expires_at: expiresAt.toISOString() })
      .eq('id', subscription.id)

    return NextResponse.json({
      status: 'active',
      simulated: true,
      message: result.message,
      expiresAt: expiresAt.toISOString(),
    })
  }

  await admin
    .from('transactions')
    .update({ status: 'awaiting_confirmation', dohone_ref: result.dohoneRef })
    .eq('id', transaction.id)

  return NextResponse.json({
    status: 'awaiting_confirmation',
    simulated: false,
    message: 'Confirme le paiement via le message reçu sur ton téléphone.',
  })
}
