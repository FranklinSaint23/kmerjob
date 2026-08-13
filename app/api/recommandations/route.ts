import { NextResponse } from 'next/server'

import { buildSearchKeywords } from '@/lib/ai/cv-extraction'
import { matchOffers } from '@/lib/ai/matching'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/**
 * GET /api/recommandations — les meilleures offres pour le CV de l'utilisateur.
 *
 * Accessible sans abonnement : c'est la fonctionnalité qui donne envie de
 * passer premium, la verrouiller n'aurait aucun sens.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  const { data: cv, error: cvError } = await supabase
    .from('cv_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (cvError) {
    return NextResponse.json({ error: cvError.message }, { status: 500 })
  }

  if (!cv) {
    return NextResponse.json(
      { error: 'Dépose ton CV pour obtenir des recommandations.', needsCv: true },
      { status: 404 }
    )
  }

  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') ?? 10), 30)
  const keywords = buildSearchKeywords(cv)

  const { data: shortlist, error: shortlistError } = await supabase.rpc(
    'shortlist_offers_for_cv',
    { p_keywords: keywords, p_limit: 40 }
  )

  if (shortlistError) {
    return NextResponse.json({ error: shortlistError.message }, { status: 500 })
  }

  const matches = await matchOffers(cv, shortlist ?? [], { rerank: true, limit })

  return NextResponse.json({
    count: matches.length,
    keywords,
    results: matches.map((m) => ({
      offer: m.offer,
      score: m.score,
      breakdown: m.breakdown,
      reason: m.reason,
      matchedSkills: m.matchedSkills,
    })),
  })
}
