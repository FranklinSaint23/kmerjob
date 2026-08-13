import { Briefcase, Building2, Calendar, MapPin, Wallet } from 'lucide-react'
import Link from 'next/link'

import { TrustBadge } from '@/components/TrustBadge'
import type { SearchOfferRow } from '@/lib/types/database'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function OfferCard({ offer }: { offer: SearchOfferRow }) {
  return (
    <Link
      href={`/offre/${offer.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-black/[.06] bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:border-brand-600/25 hover:shadow-[var(--shadow-card-hover)] dark:border-white/[.08] dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/[.06] dark:text-zinc-400">
            <Building2 className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-zinc-900 transition-colors group-hover:text-brand-700 dark:text-zinc-50 dark:group-hover:text-brand-400">
              {offer.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">{offer.company}</p>
          </div>
        </div>
        <TrustBadge level={offer.trust_level} reasons={offer.trust_reasons} className="shrink-0" />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
          {offer.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5" strokeWidth={2} />
          {offer.contract_type}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
          {formatDate(offer.date_posted)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/[.06] pt-3.5 dark:border-white/[.08]">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Wallet className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2} />
          {offer.salary || 'Salaire non précisé'}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-white/[.06] dark:text-zinc-400">
          {offer.sector}
        </span>
      </div>
    </Link>
  )
}
