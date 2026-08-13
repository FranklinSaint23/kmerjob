'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function FavoriteButton({
  offerId,
  initiallyFavorited,
  isAuthenticated,
}: {
  offerId: string
  initiallyFavorited: boolean
  isAuthenticated: boolean
}) {
  const [favorited, setFavorited] = useState(initiallyFavorited)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/connexion?suivant=${encodeURIComponent(`/offre/${offerId}`)}`)
      return
    }

    setPending(true)
    const next = !favorited
    setFavorited(next) // optimiste

    try {
      const res = await fetch('/api/favoris', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId }),
      })
      if (!res.ok) setFavorited(!next) // annule si l'appel échoue
    } catch {
      setFavorited(!next)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={favorited}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        favorited
          ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
          : 'border-black/[.1] text-zinc-600 hover:border-red-200 hover:text-red-600 dark:border-white/[.12] dark:text-zinc-300'
      }`}
    >
      <Heart className="h-4 w-4" strokeWidth={2} fill={favorited ? 'currentColor' : 'none'} />
      {favorited ? 'Dans tes favoris' : 'Ajouter aux favoris'}
    </button>
  )
}
