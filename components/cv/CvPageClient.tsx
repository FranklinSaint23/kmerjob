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
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Analyse de CV
        </h1>
        <p className="mt-1.5 text-zinc-500 dark:text-zinc-400">
          Dépose ton CV pour recevoir des recommandations d&apos;offres expliquées.
        </p>

        <div className="mt-8 space-y-6">
          {profile === undefined ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
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
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Offres recommandées
            </h2>
            <button
              onClick={() => void loadRecommendations()}
              disabled={loadingRecs}
              className="flex items-center gap-1.5 rounded-full border border-black/[.1] px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-brand-600/40 hover:text-brand-700 disabled:opacity-60 dark:border-white/[.12] dark:text-zinc-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRecs ? 'animate-spin' : ''}`} strokeWidth={2} />
              Actualiser
            </button>
          </div>

          {loadingRecs && !recommendations ? (
            <div className="mt-6 flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.offer.id} recommendation={rec} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-black/[.12] px-6 py-14 text-center dark:border-white/[.15]">
              <p className="text-zinc-600 dark:text-zinc-400">
                Aucune recommandation pour l&apos;instant.
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Le catalogue d&apos;offres est peut-être encore vide.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
