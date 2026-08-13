import { Bell, Check, Radar, Target } from 'lucide-react'
import Link from 'next/link'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PREMIUM_PLAN } from '@/lib/subscription'

const BENEFITS = [
  "Radar géolocalisé : les offres qui matchent ton profil ET ta ville, en priorité",
  'Actualisation automatique dès qu\'une nouvelle offre correspondante est publiée',
  'Reclassement des recommandations par IA, au-delà du simple mot-clé',
  'Accès prioritaire aux offres marquées "Vérifiée"',
]

export default function PremiumPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Radar className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Radar Premium
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500 dark:text-zinc-400">
              Ne rate plus une offre qui te correspond. Le Radar croise ton CV et ta
              ville en continu, et t&apos;alerte en priorité.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="rounded-2xl border border-brand-600/20 bg-white p-8 shadow-[var(--shadow-card-hover)] dark:border-brand-400/20 dark:bg-zinc-900">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Premium</p>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {PREMIUM_PLAN.amountXaf.toLocaleString('fr-FR')} FCFA
                  <span className="text-base font-medium text-zinc-400"> / {PREMIUM_PLAN.durationDays} jours</span>
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500 dark:bg-white/[.06] dark:text-zinc-400">
                MTN / Orange Money
              </span>
            </div>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
                  {benefit}
                </li>
              ))}
            </ul>

            <Link
              href="/premium/paiement"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Bell className="h-4 w-4" strokeWidth={2} />
              Activer le Radar Premium
            </Link>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-black/[.06] bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-400">
            <Target className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            Le Radar a besoin de ton CV pour fonctionner. Dépose-le depuis{' '}
            <Link href="/cv" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              la page d&apos;analyse
            </Link>{' '}
            si ce n&apos;est pas déjà fait.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
