import { CreditCard, FileText, Heart, LogOut, Radar as RadarIcon } from 'lucide-react'
import Link from 'next/link'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { signOut } from '@/lib/actions/auth'
import { hasActiveSubscription } from '@/lib/subscription'
import { createClient, getCurrentUser } from '@/lib/supabase/server'

export default async function ComptePage() {
  const user = await getCurrentUser()
  if (!user) return null // le middleware redirige déjà vers /connexion

  const supabase = await createClient()

  const [{ data: profile }, { data: cv }, { count: favoritesCount }, isSubscribed] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('cv_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    hasActiveSubscription(user.id),
  ])

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50 dark:bg-black">
        <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {profile?.full_name || user.email}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-black/[.1] px-3.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-red-200 hover:text-red-600 dark:border-white/[.12] dark:text-zinc-300"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Déconnexion
              </button>
            </form>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatusCard
              icon={FileText}
              title="CV"
              status={cv ? 'Analysé' : 'Non déposé'}
              positive={Boolean(cv)}
              href="/cv"
              cta={cv ? 'Voir mes recommandations' : 'Déposer mon CV'}
            />
            <StatusCard
              icon={RadarIcon}
              title="Radar Premium"
              status={isSubscribed ? 'Actif' : 'Non abonné'}
              positive={isSubscribed}
              href={isSubscribed ? '/radar' : '/premium'}
              cta={isSubscribed ? 'Ouvrir le Radar' : 'Activer Premium'}
            />
            <StatusCard
              icon={Heart}
              title="Favoris"
              status={`${favoritesCount ?? 0} offre${(favoritesCount ?? 0) > 1 ? 's' : ''}`}
              positive={(favoritesCount ?? 0) > 0}
              href="/favoris"
              cta="Voir mes favoris"
            />
            <StatusCard
              icon={CreditCard}
              title="Abonnement"
              status={isSubscribed ? 'Renouvellement à venir' : 'Aucun paiement en cours'}
              positive={isSubscribed}
              href="/premium"
              cta="Gérer mon abonnement"
            />
          </div>

          {profile?.city && (
            <p className="mt-6 text-sm text-zinc-400">
              Ville enregistrée : <span className="font-medium text-zinc-600 dark:text-zinc-300">{profile.city}</span>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function StatusCard({
  icon: Icon,
  title,
  status,
  positive,
  href,
  cta,
}: {
  icon: typeof FileText
  title: string
  status: string
  positive: boolean
  href: string
  cta: string
}) {
  return (
    <div className="rounded-2xl border border-black/[.06] bg-white p-5 shadow-[var(--shadow-card)] dark:border-white/[.08] dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            positive
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
              : 'bg-zinc-100 text-zinc-400 dark:bg-white/[.06]'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{status}</p>
        </div>
      </div>
      <Link
        href={href}
        className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        {cta} →
      </Link>
    </div>
  )
}
