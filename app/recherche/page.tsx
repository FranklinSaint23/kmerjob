import { Search, SlidersHorizontal } from 'lucide-react'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { OfferCard } from '@/components/OfferCard'
import { SearchBar } from '@/components/SearchBar'
import { createClient } from '@/lib/supabase/server'
import type { SearchOfferRow } from '@/lib/types/database'

export const revalidate = 0

interface Facets {
  locations: string[]
  sectors: string[]
  categories: string[]
  contract_types: string[]
  total: number
}

async function getFacets(): Promise<Facets | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('offer_facets')
    if (error) {
      console.error('[recherche] échec du chargement des facettes', error)
      return null
    }
    return data as Facets
  } catch {
    return null
  }
}

async function search(params: {
  q?: string
  ville?: string
  secteur?: string
}): Promise<{ results: SearchOfferRow[]; total: number }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('search_offers', {
      p_query: params.q ?? '',
      p_location: params.ville || null,
      p_sector: params.secteur || null,
      p_limit: 24,
    })

    if (error) {
      console.error('[recherche] échec de la recherche', error)
      return { results: [], total: 0 }
    }

    const results = (data ?? []) as SearchOfferRow[]
    return { results, total: results[0]?.total_count ?? 0 }
  } catch {
    return { results: [], total: 0 }
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ville?: string; secteur?: string }>
}) {
  const params = await searchParams
  const [facets, { results, total }] = await Promise.all([getFacets(), search(params)])

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[#FBF7EF] text-[#0C2543]">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-[#0C2543]/15 bg-[#F0E9D8]/50">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <h1 className="font-serif text-3xl font-bold text-[#0C2543]">
              Rechercher une offre d'emploi
            </h1>
            <p className="text-sm text-[#516A82] mt-1">
              Consultez les annonces vérifiées dans les 10 régions du Cameroun.
            </p>
            <div className="mt-4">
              <SearchBar initialQuery={params.q} initialVille={params.ville} />
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0C2543] border-b border-[#0C2543]/15 pb-2">
              <SlidersHorizontal className="h-4 w-4 text-[#FF7D00]" strokeWidth={2} />
              Filtres de recherche
            </div>

            <FacetGroup
              label="Ville"
              param="ville"
              options={facets?.locations && facets.locations.length > 0 ? facets.locations : ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Buea']}
              active={params.ville}
              baseParams={params}
            />
            <FacetGroup
              label="Secteur"
              param="secteur"
              options={facets?.sectors && facets.sectors.length > 0 ? facets.sectors : ['Informel & Artisanat', 'Commerce & Vente', 'BÂtiment & Travaux', 'Banque & Finance', 'Technique & Énergie']}
              active={params.secteur}
              baseParams={params}
            />
          </aside>

          <div>
            <p className="mb-5 font-mono text-sm text-[#516A82]">
              {total > 0
                ? `${total} offre${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`
                : 'Résultats de recherche'}
            </p>

            {results.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border-[1.5px] border-[#0C2543] bg-white px-6 py-16 text-center shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0E9D8] text-[#0C2543]">
                  <Search className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-serif text-lg font-bold text-[#0C2543]">
                  Aucune offre ne correspond précisément à ta recherche
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#516A82]">
                  Essaie d'élargir tes critères de ville ou de secteur d'activité.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function FacetGroup({
  label,
  param,
  options,
  active,
  baseParams,
}: {
  label: string
  param: 'ville' | 'secteur'
  options: string[]
  active?: string
  baseParams: { q?: string; ville?: string; secteur?: string }
}) {
  if (options.length === 0) return null

  function hrefFor(value: string | null) {
    const next = new URLSearchParams()
    if (baseParams.q) next.set('q', baseParams.q)
    if (baseParams.ville && param !== 'ville') next.set('ville', baseParams.ville)
    if (baseParams.secteur && param !== 'secteur') next.set('secteur', baseParams.secteur)
    if (value) next.set(param, value)
    const qs = next.toString()
    return `/recherche${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#DB6900] mb-2">{label}</h3>
      <ul className="space-y-1">
        <FacetLink href={hrefFor(null)} label="Tous" isActive={!active} />
        {options.map((option) => (
          <FacetLink key={option} href={hrefFor(option)} label={option} isActive={active === option} />
        ))}
      </ul>
    </div>
  )
}

function FacetLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <li>
      <a
        href={href}
        className={`block rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-[#0C2543] text-white'
            : 'text-[#516A82] hover:bg-[#F0E9D8] hover:text-[#0C2543]'
        }`}
      >
        {label}
      </a>
    </li>
  )
}

