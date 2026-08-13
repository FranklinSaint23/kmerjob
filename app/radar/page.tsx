'use client'

import { Loader2, Radar as RadarIcon, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { RecommendationCard, type Recommendation } from '@/components/cv/RecommendationCard'
import { CITY_NAMES } from '@/lib/geo'

type LoadState = 'loading' | 'ok' | 'needs_subscription' | 'needs_cv' | 'error'

const POLL_INTERVAL_MS = 8000

export default function RadarPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [results, setResults] = useState<Recommendation[]>([])
  const [city, setCity] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [active, setActive] = useState(true)
  const [lastScan, setLastScan] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function scan(selectedCity?: string) {
    try {
      const url = new URL('/api/radar', window.location.origin)
      if (selectedCity) url.searchParams.set('ville', selectedCity)

      const res = await fetch(url)
      const body = await res.json()

      if (res.status === 402) {
        setState('needs_subscription')
        return
      }
      if (res.status === 404 && body.needsCv) {
        setState('needs_cv')
        return
      }
      if (!res.ok) {
        setState('error')
        setErrorMessage(body.error ?? 'Erreur inattendue.')
        return
      }

      setResults(
        body.results.map((r: { offer: unknown; score: number; breakdown: unknown; matchedSkills: string[] }) => ({
          offer: r.offer,
          score: r.score,
          breakdown: r.breakdown,
          matchedSkills: r.matchedSkills,
        }))
      )
      setCity(body.city)
      setLastScan(new Date())
      setState('ok')
    } catch {
      setState('error')
      setErrorMessage('Connexion impossible.')
    }
  }

  useEffect(() => {
    void scan()
  }, [])

  useEffect(() => {
    if (active && state === 'ok') {
      timerRef.current = setInterval(() => void scan(city ?? undefined), POLL_INTERVAL_MS)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, state, city])

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                <RadarIcon className="h-6 w-6 text-brand-600 dark:text-brand-400" strokeWidth={1.75} />
                Radar
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {lastScan
                  ? `Dernier scan à ${lastScan.toLocaleTimeString('fr-FR')}`
                  : 'Recherche des meilleures correspondances…'}
              </p>
            </div>

            {state === 'ok' && (
              <div className="flex items-center gap-3">
                <select
                  value={city ?? ''}
                  onChange={(e) => {
                    const value = e.target.value || undefined
                    setCity(value ?? null)
                    void scan(value)
                  }}
                  className="rounded-full border border-black/[.1] bg-white px-3.5 py-2 text-sm dark:border-white/[.12] dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Ville du CV</option>
                  {CITY_NAMES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setActive((a) => !a)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-white/[.06]'
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${active ? 'animate-spin' : ''}`} strokeWidth={2} />
                  {active ? 'Radar actif' : 'En pause'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8">
            {state === 'loading' && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            )}

            {state === 'needs_cv' && (
              <EmptyState
                title="Dépose ton CV pour activer le Radar"
                text="Le Radar croise ton profil avec les offres actives — il a besoin de ton CV pour fonctionner."
                cta={{ href: '/cv', label: 'Analyser mon CV' }}
              />
            )}

            {state === 'needs_subscription' && (
              <EmptyState
                title="Le Radar est réservé aux abonnés"
                text="Active le Radar Premium pour recevoir des offres géolocalisées en continu."
                cta={{ href: '/premium', label: 'Découvrir Premium' }}
              />
            )}

            {state === 'error' && (
              <EmptyState title="Une erreur est survenue" text={errorMessage ?? 'Réessaie dans un instant.'} />
            )}

            {state === 'ok' && results.length === 0 && (
              <EmptyState
                title="Aucune correspondance pour l'instant"
                text="Le Radar continuera de chercher automatiquement."
              />
            )}

            {state === 'ok' && results.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((r) => (
                  <RecommendationCard key={r.offer.id} recommendation={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function EmptyState({
  title,
  text,
  cta,
}: {
  title: string
  text: string
  cta?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] px-6 py-16 text-center dark:border-white/[.15]">
      <p className="font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{text}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-brand"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
