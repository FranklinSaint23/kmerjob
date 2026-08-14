'use client'

import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState } from 'react'

import { LogoMark } from '@/components/Logo'
import { signIn, type AuthFormState } from '@/lib/actions/auth'

const initialState: AuthFormState = { error: null }

/**
 * useSearchParams() force Next.js à rendre l'arbre en dessous côté client au
 * premier chargement, ce qui exige une frontière Suspense explicite lors du
 * pré-rendu statique — sans elle, `next build` échoue sur cette page (et, sous
 * Turbopack sur Windows, l'erreur peut se manifester par un crash natif du
 * worker plutôt qu'un message clair).
 */
export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  )
}

function ConnexionForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState)
  const searchParams = useSearchParams()
  const next = searchParams.get('suivant') ?? '/'

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <LogoMark className="mx-auto h-11 w-11 shadow-brand" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Content de te revoir
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Connecte-toi pour accéder à tes recommandations.
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-black/[.06] bg-white p-6 shadow-[var(--shadow-card)] dark:border-white/[.08] dark:bg-zinc-900"
        >
          <input type="hidden" name="next" value={next} />

          <Field label="E-mail" name="email" type="email" autoComplete="email" required />
          <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />

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
            <LogIn className="h-4 w-4" strokeWidth={2} />
            {pending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="font-semibold text-brand-600 hover:text-brand-700">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
}: {
  label: string
  name: string
  type: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-black/[.1] bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50"
      />
    </label>
  )
}
