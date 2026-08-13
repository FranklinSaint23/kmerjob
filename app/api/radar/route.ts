import { NextResponse } from 'next/server'

import { buildSearchKeywords } from '@/lib/ai/cv-extraction'
import { matchOffers, radarScore } from '@/lib/ai/matching'
import { CITY_NAMES } from '@/lib/geo'
import { hasActiveSubscription } from '@/lib/subscription'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/**
 * GET /api/radar?ville=Douala — Radar géolocalisé, réservé aux abonnés.
 *
 * Le contrôle d'abonnement est fait ici, côté serveur, et pas seulement dans
 * l'UI : masquer un bouton n'est pas une autorisation. Les offres elles-mêmes
 * restent publiques (RLS), c'est le croisement avec le CV et la géographie qui
 * constitue le service payant.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  if (!(await hasActiveSubscription(user.id))) {
    return NextResponse.json(
      {
        error: 'Le Radar est réservé aux abonnés premium.',
        needsSubscription: true,
      },
      { status: 402 }
    )
  }

  const { data: cv } = await supabase
    .from('cv_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cv) {
    return NextResponse.json(
      { error: 'Dépose ton CV pour activer le Radar.', needsCv: true },
      { status: 404 }
    )
  }

  const requestedCity = new URL(request.url).searchParams.get('ville')
  // Ville demandée si elle est au catalogue, sinon celle du CV.
  const city =
    requestedCity && CITY_NAMES.includes(requestedCity) ? requestedCity : cv.location

  const { data: shortlist, error } = await supabase.rpc('shortlist_offers_for_cv', {
    p_keywords: buildSearchKeywords(cv),
    p_limit: 60,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Pas de reclassement LLM ici : le Radar est rafraîchi souvent, un appel Groq
  // à chaque passage brûlerait le quota pour un gain marginal. Le classement
  // déterministe suffit, la géographie faisant l'essentiel de la différence.
  const matches = await matchOffers(cv, shortlist ?? [], { rerank: false, limit: 60 })

  const results = matches
    .map((m) => ({
      offer: m.offer,
      score: radarScore(m, city),
      matchScore: m.score,
      breakdown: m.breakdown,
      matchedSkills: m.matchedSkills,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  return NextResponse.json({
    city,
    count: results.length,
    scannedAt: new Date().toISOString(),
    results,
  })
}
