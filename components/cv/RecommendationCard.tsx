import Link from 'next/link'

import { TrustBadge } from '@/components/TrustBadge'
import type { ShortlistOfferRow } from '@/lib/types/database'

export interface Recommendation {
  offer: ShortlistOfferRow
  score: number
  breakdown: {
    competences: number
    experience: number
    etudes: number
    localisation: number
    langues: number
  }
  reason?: string
  matchedSkills: string[]
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-brand-600 dark:text-brand-400'
  if (score >= 45) return 'text-amber-600 dark:text-amber-400'
  return 'text-zinc-400'
}

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { offer, score, reason, matchedSkills } = recommendation

  return (
    <Link
      href={`/offre/${offer.id}`}
      className="group block rounded-2xl border border-black/[.06] bg-white p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-brand-600/25 hover:shadow-[var(--shadow-card-hover)] dark:border-white/[.08] dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-zinc-900 group-hover:text-brand-700 dark:text-zinc-50 dark:group-hover:text-brand-400">
            {offer.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
            {offer.company} · {offer.location}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}%</span>
          <p className="text-[11px] text-zinc-400">compatibilité</p>
        </div>
      </div>

      <div className="mt-2">
        <TrustBadge level={offer.trust_level} />
      </div>

      {reason && (
        <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-white/[.04] dark:text-zinc-400">
          {reason}
        </p>
      )}

      {matchedSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchedSkills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
