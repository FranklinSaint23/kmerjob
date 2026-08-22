'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { CvSummary, CvUploadForm } from '@/components/cv/CvUploadForm'
import { RecommendationCard, type Recommendation } from '@/components/cv/RecommendationCard'
import type { CvProfileRow } from '@/lib/types/database'

export function CvPageClient() {
  const [profile, setProfile] = useState<CvProfileRow | null | undefined>(undefined)
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null)
  const [loadingRecs, setLoadingRecs] = useState(false)

  const loadRecommendations = useCallback(async () => {
    setLoadingRecs(true)
    try {
      const res = await fetch('/api/recommandations')
      if (res.ok) {
        const body = await res.json()
        setRecommendations(body.results)
      }
    } finally {
      setLoadingRecs(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/cv')
      .then((res) => (res.ok ? res.json() : { profile: null }))
      .then((body) => setProfile(body.profile))
      .catch(() => setProfile(null))
  }, [])

  useEffect(() => {
    if (profile) void loadRecommendations()
  }, [profile, loadRecommendations])

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0C2543]">
          Analyse & Scoring IA de votre CV
        </h1>
        <p className="mt-2 text-[#516A82] leading-relaxed">
          Déposez votre CV ou construisez-le sur KmerJob. Notre IA analyse vos compétences et évalue votre score pour augmenter vos chances de recrutement.
        </p>

        <div className="mt-8 space-y-6">
          {profile === undefined ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF7D00]" />
            </div>
          ) : profile ? (
            <>
              <CvSummary profile={profile} />
              <CvUploadForm onUploaded={setProfile} />
            </>
          ) : (
            <CvUploadForm onUploaded={setProfile} />
          )}
        </div>
      </div>

      {profile && (
        <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#0C2543]">
              Offres recommandées pour votre profil
            </h2>
            <button
              onClick={() => void loadRecommendations()}
              disabled={loadingRecs}
              className="flex items-center gap-1.5 rounded-xl border border-[#0C2543]/20 bg-white px-4 py-2 text-xs font-bold text-[#0C2543] transition-colors hover:border-[#FF7D00] hover:text-[#FF7D00] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRecs ? 'animate-spin' : ''}`} strokeWidth={2} />
              Actualiser
            </button>
          </div>

          {loadingRecs && !recommendations ? (
            <div className="mt-6 flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF7D00]" />
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.offer.id} recommendation={rec} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#0C2543]/20 bg-white px-6 py-14 text-center">
              <p className="text-[#0C2543] font-semibold">
                Aucune recommandation pour l'instant.
              </p>
              <p className="mt-1 text-sm text-[#516A82]">
                Découvrez les dernières offres publiées sur la page de recherche.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

