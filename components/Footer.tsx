import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { LogoMark } from '@/components/Logo'

const COLUMNS = [
  {
    title: 'Candidats',
    links: [
      { href: '/recherche', label: 'Rechercher une offre' },
      { href: '/cv', label: 'Analyser mon CV' },
      { href: '/premium', label: 'Radar Premium' },
    ],
  },
  {
    title: 'À propos',
    links: [{ href: '/fiabilite', label: 'Détection des annonces frauduleuses' }],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-brand-900 to-brand-950 text-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-7 shrink-0" />
              <span className="text-base font-bold tracking-tight text-white">KmerJob</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-emerald-100/70">
              Offres d&apos;emploi vérifiées au Cameroun, avec une analyse de fiabilité
              sur chaque annonce.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              Chaque annonce est analysée automatiquement
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-emerald-100/70">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-emerald-100/50">
          © {new Date().getFullYear()} KmerJob.
        </p>
      </div>
    </footer>
  )
}
