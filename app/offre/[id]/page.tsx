import { Briefcase, Calendar, ExternalLink, MapPin, Wallet } from 'lucide-react'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/Footer'
import { FavoriteButton } from '@/components/FavoriteButton'
import { Navbar } from '@/components/Navbar'
import { TrustBadge } from '@/components/TrustBadge'
import { createClient, getCurrentUser } from '@/lib/supabase/server'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: offer, error }, user] = await Promise.all([
    supabase.from('offers').select('*').eq('id', id).eq('active', true).maybeSingle(),
    getCurrentUser(),
  ])

  if (error || !offer) notFound()

  let isFavorited = false
  if (user) {
    const { data: favorite } = await supabase
      .from('favorites')
      .select('offer_id')
      .eq('user_id', user.id)
      .eq('offer_id', id)
      .maybeSingle()
    isFavorited = Boolean(favorite)
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-black/[.06] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 dark:border-white/[.08] dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {offer.title}
                </h1>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">{offer.company}</p>
              </div>
              <TrustBadge level={offer.trust_level} reasons={offer.trust_reasons} />
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" strokeWidth={2} /> {offer.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" strokeWidth={2} /> {offer.contract_type} · {offer.seniority}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-4 w-4" strokeWidth={2} /> {offer.salary || 'Salaire non précisé'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" strokeWidth={2} /> Publiée le {formatDate(offer.date_posted)}
              </span>
            </div>

            {offer.trust_level === 'suspecte' && offer.trust_reasons.length > 0 && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Cette annonce présente des signaux préoccupants
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm text-red-700/90 dark:text-red-400/90">
                  {offer.trust_reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <FavoriteButton offerId={offer.id} initiallyFavorited={isFavorited} isAuthenticated={Boolean(user)} />
              {offer.source_url && (
                <a
                  href={offer.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Source de l&apos;annonce <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                </a>
              )}
            </div>

            <hr className="my-6 border-black/[.06] dark:border-white/[.08]" />

            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Description du poste</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {offer.description}
              </p>
            </div>

            {offer.requirements.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Profil recherché</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {offer.requirements.map((req) => (
                    <span
                      key={req}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-white/[.06] dark:text-zinc-400"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
