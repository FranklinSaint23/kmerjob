'use client'

import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'

import { signUp, type AuthFormState } from '@/lib/actions/auth'
import { CITY_NAMES } from '@/lib/geo'

const initialState: AuthFormState = { error: null }

export default function InscriptionPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-brand">
            K
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Crée ton compte
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gratuit — dépose ton CV en une minute.
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-black/[.06] bg-white p-6 shadow-[var(--shadow-card)] dark:border-white/[.08] dark:bg-zinc-900"
        >
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nom complet</span>
            <input
              name="full_name"
              type="text"
              autoComplete="name"
              className="mt-1.5 w-full rounded-lg border border-black/[.1] bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1.5 w-full rounded-lg border border-black/[.1] bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ville</span>
            <select
              name="city"
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-black/[.1] bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Sélectionner…</option>
              {CITY_NAMES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mot de passe</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="mt-1.5 w-full rounded-lg border border-black/[.1] bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50"
            />
            <span className="mt-1 block text-xs text-zinc-400">6 caractères minimum</span>
          </label>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-opacity disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2} />
            {pending ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="font-semibold text-brand-600 hover:text-brand-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
