import Link from 'next/link'
import type { SearchOfferRow } from '@/lib/types/database'

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'il y a moins d\'1h'
  if (diffHours < 24) return `il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `il y a ${diffDays}j`
}

export function OfferCard({ offer }: { offer: SearchOfferRow }) {
  const isInformal = offer.category?.toLowerCase().includes('informel') || 
                    offer.contract_type?.toLowerCase().includes('petit') ||
                    offer.contract_type?.toLowerCase().includes('prestation') ||
                    offer.sector?.toLowerCase().includes('artisanat') ||
                    offer.title?.toLowerCase().includes('aide') ||
                    offer.title?.toLowerCase().includes('coiffeu')

  return (
    <Link
      href={`/offre/${offer.id}`}
      className="group relative flex flex-col justify-between gap-3 rounded-2xl border-[1.5px] border-[#0C2543] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:-rotate-[0.4deg] hover:shadow-[6px_8px_0_#0C2543]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={`job-badge ${isInformal ? 'badge-informel' : 'badge-officiel'}`}>
            {isInformal ? 'Informel' : 'Officiel'}
          </span>
          <span className="font-mono text-xs text-[#9AA6B4]">
            {formatRelativeTime(offer.date_posted)}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-lg font-bold text-[#0C2543] group-hover:text-[#FF7D00] transition-colors line-clamp-2">
          {offer.title}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#516A82]">
          <span className="font-medium text-[#0C2543]">{offer.company}</span>
          <span>·</span>
          <span>{offer.location}</span>
        </div>
      </div>

      <div className="mt-2 border-t border-[#0C2543]/10 pt-3 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold text-[#DB6900]">
          {offer.salary || 'A mégocier'}
        </span>
        <span className="text-xs text-[#516A82]">
          {offer.contract_type}
        </span>
      </div>
    </Link>
  )
}

