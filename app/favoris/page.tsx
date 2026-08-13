import { Heart } from 'lucide-react'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { OfferCard } from '@/components/OfferCard'
import { createClient, getCurrentUser } from '@/lib/supabase/server'
import type { OfferRow, SearchOfferRow } from '@/lib/types/database'

function toSearchOffer(offer: OfferRow): SearchOfferRow {
  return { ...offer, rank: 0, total_count: 0 }
}

export default async function FavorisPage() {
  const user = await getCurrentUser()
  if (!user) return null // le middleware redirige déjà vers /connexion

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('offer_id, created_at, offers(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const offers = error
    ? []
    : ((data ?? [])
        .map((row) => (row as unknown as { offers: OfferRow | null }).offers)
        .filter((o): o is OfferRow => Boolean(o)))

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mes favoris
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {offers.length} offre{offers.length > 1 ? 's' : ''} enregistrée{offers.length > 1 ? 's' : ''}
          </p>

          {offers.length > 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={toSearchOffer(offer)} />
              ))}
            </div>
          ) : (
            <div className="mt-7 flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] px-6 py-16 text-center dark:border-white/[.15]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/[.06]">
                <Heart className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-medium text-zinc-700 dark:text-zinc-300">Aucun favori pour l&apos;instant</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Clique sur le cœur d&apos;une offre pour la retrouver ici.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
