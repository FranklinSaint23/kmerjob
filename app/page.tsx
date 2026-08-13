import { ArrowRight, Radar, Search, ShieldCheck, Sparkles, Target } from 'lucide-react'
import Link from 'next/link'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { OfferCard } from '@/components/OfferCard'
import { SearchBar } from '@/components/SearchBar'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

async function getRecentOffers() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_offers', { p_limit: 6 })
  if (error) {
    console.error('[accueil] échec du chargement des offres', error)
    return []
  }
  return data ?? []
}

export default async function HomePage() {
  const offers = await getRecentOffers()

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ------------------------------------------------------------------ */}
        {/* Hero */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative overflow-hidden border-b border-black/[.06] dark:border-white/[.08]">
          <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px] dark:bg-brand-500/10" />

          <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-28">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-600/20 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-400">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
              Analyse de CV et détection d&apos;arnaques par IA
            </div>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl sm:leading-[1.1]">
              Trouvez un emploi{' '}
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                fiable
              </span>{' '}
              au Cameroun
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Chaque annonce est analysée pour repérer les arnaques. Déposez votre
              CV et recevez des recommandations expliquées, poste par poste.
            </p>

            <div className="mt-9 flex justify-center">
              <SearchBar />
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/cv"
                className="group inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-zinc-900"
              >
                Analyser mon CV gratuitement
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Link>
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-full border border-black/[.1] bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-brand-600/40 hover:text-brand-700 dark:border-white/[.12] dark:bg-transparent dark:text-zinc-300 dark:hover:text-brand-400"
              >
                Découvrir le Radar Premium
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Offres récentes */}
        {/* ------------------------------------------------------------------ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Offres récentes
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Publiées et vérifiées automatiquement.
              </p>
            </div>
            <Link
              href="/recherche"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
            >
              Tout voir
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>

          {offers.length > 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="mt-7 flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] px-6 py-16 text-center dark:border-white/[.15]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/[.06]">
                <Search className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-medium text-zinc-700 dark:text-zinc-300">
                Aucune offre publiée pour l&apos;instant
              </p>
              <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Le catalogue démarre à zéro — les offres apparaîtront ici dès
                qu&apos;elles seront ajoutées ou scrapées.
              </p>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Fonctionnalités */}
        {/* ------------------------------------------------------------------ */}
        <section className="border-t border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Une recherche d&apos;emploi qui vous protège
              </h2>
              <p className="mt-3 text-zinc-500 dark:text-zinc-400">
                Trois mécanismes travaillent ensemble pour vous faire gagner du
                temps et éviter les mauvaises surprises.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <Feature
                icon={ShieldCheck}
                title="Annonces vérifiées"
                text="Chaque offre est analysée pour repérer les signaux d'arnaque — frais demandés, promesses irréalistes — avant qu'ils ne vous coûtent du temps ou de l'argent."
              />
              <Feature
                icon={Target}
                title="Recommandations sur mesure"
                text="Déposez votre CV : nous le comparons aux offres actives et expliquons, poste par poste, pourquoi il vous correspond."
              />
              <Feature
                icon={Radar}
                title="Radar en temps réel"
                text="Les abonnés premium sont notifiés dès qu'une offre correspond à leur profil et à leur ville."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-black/[.06] bg-white p-6 shadow-[var(--shadow-card)] dark:border-white/[.08] dark:bg-zinc-900">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  )
}
