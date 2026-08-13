'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    router.push(`/recherche${params.size ? `?${params}` : ''}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl items-center gap-1.5 rounded-full border border-black/[.08] bg-white p-1.5 shadow-[var(--shadow-card)] focus-within:border-brand-600/40 focus-within:ring-4 focus-within:ring-brand-600/10 dark:border-white/[.1] dark:bg-zinc-900"
    >
      <Search className="ml-3 h-4.5 w-4.5 shrink-0 text-zinc-400" strokeWidth={2} />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Poste, compétence, entreprise…"
        className="flex-1 bg-transparent px-1 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Rechercher
      </button>
    </form>
  )
}
