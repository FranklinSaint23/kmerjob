import { Plus } from 'lucide-react'
import Link from 'next/link'

import { TrustBadge } from '@/components/TrustBadge'
import { toggleOfferActive } from '@/lib/actions/admin'
import { createAdminClient } from '@/lib/supabase/admin'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Liste admin : contrairement à /recherche, montre aussi les offres
 * dépubliées (active = false), donc lit via le client service_role plutôt
 * que le client RLS classique qui ne renvoie que les offres actives.
 */
export default async function AdminOffresPage() {
  const admin = createAdminClient()
  const { data: offers } = await admin
    .from('offers')
    .select('id, title, company, location, active, trust_level, source, date_posted')
    .order('date_posted', { ascending: false })
    .limit(100)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Offres publiées
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {offers?.length ?? 0} offre{(offers?.length ?? 0) > 1 ? 's' : ''} — tant que le scraper n&apos;est
            pas branché, c&apos;est ici qu&apos;on publie.
          </p>
        </div>
        <Link
          href="/admin/offres/nouvelle"
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-brand"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nouvelle offre
        </Link>
      </div>

      {offers && offers.length > 0 ? (
        <div className="mt-7 overflow-hidden rounded-2xl border border-black/[.06] bg-white dark:border-white/[.08] dark:bg-zinc-900">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-black/[.06] dark:divide-white/[.08]">
              {offers.map((offer) => (
                <tr key={offer.id} className={offer.active ? '' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{offer.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {offer.company} · {offer.location} · {formatDate(offer.date_posted)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <TrustBadge level={offer.trust_level} />
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{offer.source}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleOfferActive.bind(null, offer.id, !offer.active)}>
                      <button
                        type="submit"
                        className="rounded-full border border-black/[.1] px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-brand-600/40 hover:text-brand-700 dark:border-white/[.12] dark:text-zinc-300"
                      >
                        {offer.active ? 'Dépublier' : 'Republier'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-7 flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] px-6 py-16 text-center dark:border-white/[.15]">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Aucune offre publiée</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Commence par en publier une manuellement.
          </p>
        </div>
      )}
    </div>
  )
}
