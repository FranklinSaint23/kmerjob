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
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('offer_facets')
  if (error) {
    console.error('[recherche] échec du chargement des facettes', error)
    return null
  }
  return data as Facets
}

async function search(params: {
  q?: string
  ville?: string
  secteur?: string
}): Promise<{ results: SearchOfferRow[]; total: number }> {
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
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ville?: string; secteur?: string }>
}) {
  const params = await searchParams
  const [facets, { results, total }] = await Promise.all([getFacets(), search(params)])

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Rechercher une offre
            </h1>
            <div className="mt-5">
              <SearchBar initialQuery={params.q} />
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
              Filtres
            </div>

            <FacetGroup
              label="Ville"
              param="ville"
              options={facets?.locations ?? []}
              active={params.ville}
              baseParams={params}
            />
            <FacetGroup
              label="Secteur"
              param="secteur"
              options={facets?.sectors ?? []}
              active={params.secteur}
              baseParams={params}
            />
          </aside>

          <div>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              {total > 0
                ? `${total} offre${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}`
                : 'Aucun résultat'}
            </p>

            {results.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] px-6 py-16 text-center dark:border-white/[.15]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/[.06]">
                  <Search className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-medium text-zinc-700 dark:text-zinc-300">
                  Aucune offre ne correspond à ta recherche
                </p>
                <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                  Essaie d&apos;élargir tes filtres ou une autre formulation.
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
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</h3>
      <ul className="mt-2 space-y-1">
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
        className={`block rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
          isActive
            ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[.06]'
        }`}
      >
        {label}
      </a>
    </li>
  )
}
