'use client'

import { CheckCircle2, Loader2, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { PREMIUM_PLAN } from '@/lib/subscription'

type Status = 'idle' | 'submitting' | 'active' | 'awaiting' | 'error'

export function PaiementClient() {
  const [operator, setOperator] = useState<'mtn' | 'orange'>('mtn')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setMessage(null)

    try {
      const res = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator, phone }),
      })
      const body = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(body.error ?? "Échec de l'initiation du paiement.")
        return
      }

      setStatus(body.status === 'active' ? 'active' : 'awaiting')
      setMessage(body.message)
    } catch {
      setStatus('error')
      setMessage('Connexion impossible. Réessaie.')
    }
  }

  if (status === 'active') {
    return (
      <Result
        icon={<CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />}
        title="Radar Premium activé"
        message={message ?? 'Ton abonnement est actif.'}
        cta={{ href: '/radar', label: 'Ouvrir le Radar' }}
      />
    )
  }

  if (status === 'awaiting') {
    return (
      <Result
        icon={<Smartphone className="h-6 w-6" strokeWidth={1.75} />}
        title="Confirmation en attente"
        message={message ?? 'Confirme le paiement depuis ton téléphone.'}
        cta={{ href: '/compte', label: 'Voir mon compte' }}
      />
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Paiement Mobile Money</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {PREMIUM_PLAN.amountXaf.toLocaleString('fr-FR')} FCFA pour {PREMIUM_PLAN.durationDays} jours.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-black/[.06] bg-white p-6 shadow-[var(--shadow-card)] dark:border-white/[.08] dark:bg-zinc-900"
        >
          <div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Opérateur</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(['mtn', 'orange'] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setOperator(op)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                    operator === op
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'border-black/[.1] text-zinc-600 dark:border-white/[.12] dark:text-zinc-400'
                  }`}
                >
                  {op === 'mtn' ? 'MTN Money' : 'Orange Money'}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Numéro de téléphone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="677123456"
              required
              className="mt-1.5 w-full rounded-lg border border-black/[.1] bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          {status === 'error' && message && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
          >
            {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'submitting' ? 'Traitement…' : 'Payer maintenant'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Result({
  icon,
  title,
  message,
  cta,
}: {
  icon: React.ReactNode
  title: string
  message: string
  cta: { href: string; label: string }
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {icon}
        </span>
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        <Link
          href={cta.href}
          className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-brand"
        >
          {cta.label}
        </Link>
      </div>
    </div>
  )
}
