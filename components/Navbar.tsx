import { Briefcase, Radar, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { getCurrentUser } from '@/lib/supabase/server'

const NAV_LINKS = [
  { href: '/recherche', label: 'Offres', icon: Briefcase },
  { href: '/cv', label: 'Analyser mon CV', icon: Sparkles },
  { href: '/premium', label: 'Radar Premium', icon: Radar },
] as const

/**
 * Server Component : lit la session côté serveur pour décider connexion vs
 * compte, sans clignotement au chargement (contrairement à un état client qui
 * démarrerait "déconnecté" avant l'hydratation).
 *
 * Fond vert sombre constant (pas de variante claire/sombre) : c'est la couleur
 * de marque, pas une surface qui doit suivre le thème du système.
 */
export async function Navbar() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-brand-950 to-brand-900 shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-inset ring-white/15">
            K
          </span>
          <span className="text-lg font-bold tracking-tight text-white">KmerJob</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/compte"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-emerald-50"
            >
              Mon compte
            </Link>
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-emerald-100/80 transition-colors hover:bg-white/10 hover:text-white sm:block"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
