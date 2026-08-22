'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchBar({ initialQuery = '', initialVille = '' }: { initialQuery?: string; initialVille?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [ville, setVille] = useState(initialVille)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (ville.trim()) params.set('ville', ville.trim())
    router.push(`/recherche${params.size ? `?${params}` : ''}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-7 flex flex-wrap gap-2.5 bg-white border-[1.5px] border-[#0C2543] rounded-2xl p-2 shadow-[0_10px_30px_-14px_rgba(12,37,67,0.25)]"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Poste, métier, entreprise…"
        className="flex-1 min-w-[140px] border-none outline-none bg-transparent font-sans text-sm sm:text-base px-3.5 py-3 text-[#0C2543] placeholder-[#9AA6B4]"
      />
      <div className="hidden sm:block w-[1px] bg-[#0C2543]/15 my-1.5" />
      <input
        type="text"
        value={ville}
        onChange={(e) => setVille(e.target.value)}
        placeholder="Ville — Douala, Yaoundé…"
        className="flex-[0.7] min-w-[120px] border-none outline-none bg-transparent font-sans text-sm sm:text-base px-3.5 py-3 text-[#0C2543] placeholder-[#9AA6B4]"
      />
      <button
        type="submit"
        className="bg-[#0C2543] text-white font-bold text-sm px-6 py-3 rounded-xl cursor-pointer hover:bg-[#081A30] transition-colors"
      >
        Chercher
      </button>
    </form>
  )
}

