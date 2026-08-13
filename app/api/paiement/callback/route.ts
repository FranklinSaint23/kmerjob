import { createHmac, timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'

import { premiumExpiryFrom } from '@/lib/subscription'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/paiement/callback — webhook Dohone.
 *
 * Route serveur-à-serveur : exclue du middleware d'authentification (voir
 * middleware.ts), elle n'a pas de cookie de session. Sa sécurité repose
 * entièrement sur la vérification de signature ci-dessous.
 *
 * Le format exact du payload et de la signature n'est documenté par Dohone
 * qu'après inscription marchand. Cette implémentation suppose une signature
 * HMAC-SHA256 du corps brut dans l'en-tête `x-dohone-signature`, schéma
 * standard pour ce type de webhook — À AJUSTER une fois la documentation
 * réelle en main. Tant que DOHONE_WEBHOOK_SECRET est vide, toute requête est
 * refusée : pas de mode simulation ici, un webhook de paiement ne doit jamais
 * accepter de requêtes non authentifiées par défaut.
 */
export async function POST(request: Request) {
  const secret = process.env.DOHONE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-dohone-signature')

  if (!signature || !isValidSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as { reference?: string; status?: string; dohone_ref?: string }
  if (!payload.reference) {
    return NextResponse.json({ error: 'Référence manquante.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: transaction } = await admin
    .from('transactions')
    .select('*')
    .eq('id', payload.reference)
    .maybeSingle()

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction introuvable.' }, { status: 404 })
  }

  // Idempotence : un webhook peut être livré plusieurs fois.
  if (transaction.status === 'success' || transaction.status === 'failed') {
    return NextResponse.json({ status: 'already_processed' })
  }

  const success = payload.status === 'success'

  await admin
    .from('transactions')
    .update({
      status: success ? 'success' : 'failed',
      dohone_ref: payload.dohone_ref ?? transaction.dohone_ref,
    })
    .eq('id', transaction.id)

  if (success && transaction.subscription_id) {
    const expiresAt = premiumExpiryFrom()
    await admin
      .from('subscriptions')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', transaction.subscription_id)
  }

  return NextResponse.json({ status: 'ok' })
}

function isValidSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected)
  const givenBuf = Buffer.from(signature)
  return expectedBuf.length === givenBuf.length && timingSafeEqual(expectedBuf, givenBuf)
}
