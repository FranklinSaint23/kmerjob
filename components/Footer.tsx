import Link from 'next/link'
import { Logo } from '@/components/Logo'

const COLUMNS = [
  {
    title: 'Candidats',
    links: [
      { href: '/recherche', label: 'Rechercher une offre' },
      { href: '/cv', label: 'Analyser mon CV par IA' },
      { href: '/guide', label: 'Témoignages & Guide' },
      { href: '/premium', label: 'Radar Premium (500 FCFA/sem)' },
    ],
  },
  {
    title: 'Couverture Nationale',
    links: [
      { href: '/recherche?ville=Douala', label: 'Littoral (Douala)' },
      { href: '/recherche?ville=Yaoundé', label: 'Centre (Yaoundé)' },
      { href: '/recherche?ville=Bafoussam', label: 'Ouest (Bafoussam)' },
      { href: '/recherche?ville=Bamenda', label: 'Nord-Ouest (Bamenda)' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t border-[#0C2543]/15 bg-[#FBF7EF] text-[#0C2543] pt-12 pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#516A82]">
              La référence camerounaise de la recherche d'emploi. Centralise les offres officielles et informelles à travers les 10 régions du pays.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono text-[#516A82]">
              <span className="rounded-full border border-[#0C2543]/15 px-3 py-1 bg-white">MTN MoMo accepté</span>
              <span className="rounded-full border border-[#0C2543]/15 px-3 py-1 bg-white">Orange Money accepté</span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-serif text-base font-bold text-[#0C2543]">{col.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#516A82]">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-[#FF7D00]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-[#0C2543]/15 pt-6 text-center font-mono text-xs tracking-wider text-[#9AA6B4]">
          KMERJOB — YAOUNDÉ · DOUALA · CAMEROUN · 10 RÉGIONS
        </div>
      </div>
    </footer>
  )
}

