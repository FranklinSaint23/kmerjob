import { Shield } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { createClient, getCurrentUser } from '@/lib/supabase/server'

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/recherche', label: 'Offres' },
  { href: '/guide', label: 'Témoignages & Guide' },
  { href: '/cv', label: 'Analyser mon CV' },
  { href: '/premium', label: 'Radar Premium' },
] as const

export async function Navbar() {
  const user = await getCurrentUser()

  let isAdmin = false
  if (user) {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    isAdmin = data?.role === 'admin'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#0C2543]/15 bg-[#FBF7EF]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold text-[#516A82] transition-colors hover:text-[#0C2543] hover:border-b-2 hover:border-[#FF7D00] pb-0.5"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/offres"
              aria-label="Back-office admin"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0C2543] border border-[#0C2543]/20 hover:bg-[#0C2543]/5"
            >
              <Shield className="h-4 w-4 text-[#FF7D00]" strokeWidth={2} />
              <span>Admin</span>
            </Link>
          )}

          {user ? (
            <Link
              href="/compte"
              className="rounded-xl border border-[#0C2543] bg-white px-4 py-2 text-sm font-bold text-[#0C2543] transition-all hover:bg-[#0C2543] hover:text-white"
            >
              Mon compte
            </Link>
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden text-sm font-bold text-[#0C2543] px-3 py-2 transition-colors hover:text-[#FF7D00] sm:block"
              >
                Se connecter
              </Link>
              <Link
                href="/cv"
                className="rounded-xl border border-[#FF7D00] bg-[#FF7D00] px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:bg-[#DB6900] hover:scale-[1.02] active:scale-[0.98]"
              >
                Déposer mon CV
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

