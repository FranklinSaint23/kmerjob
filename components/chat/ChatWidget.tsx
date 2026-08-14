'use client'

import { Loader2, MessageCircle, Send, ShieldAlert, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { LogoMark } from '@/components/Logo'
import { TrustBadge } from '@/components/TrustBadge'
import type { SearchOfferRow } from '@/lib/types/database'

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
  offers?: SearchOfferRow[]
  degraded?: boolean
}

const GREETING: DisplayMessage = {
  role: 'assistant',
  content:
    "Salut, je suis l'assistant KmerJob. Je peux chercher de vraies offres pour toi ou t'expliquer comment fonctionne le site — je n'invente jamais d'annonce.",
}

const MAX_INPUT = 1000

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, pending])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || pending) return

    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setPending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Le prompt système n'est pas envoyé par le client — il vit côté
          // serveur (lib/ai/chat.ts) pour ne jamais être modifiable ni même
          // visible depuis le navigateur.
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const body = await res.json()

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: body.error ?? 'Une erreur est survenue.', degraded: true },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: body.reply, offers: body.offers, degraded: body.degraded },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connexion impossible. Réessaie dans un instant.', degraded: true },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(600px,calc(100vh-140px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-black/[.08] bg-white shadow-[var(--shadow-card-hover)] dark:border-white/[.1] dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-brand-950 to-brand-900 px-4 py-3.5">
            <LogoMark className="h-7 w-7 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Assistant KmerJob</p>
              <p className="text-[11px] text-emerald-100/70">Recherche des offres réelles, jamais inventées</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="ml-auto rounded-full p-1.5 text-emerald-100/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} />
            ))}
            {pending && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                L&apos;assistant réfléchit…
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-black/[.06] p-3 dark:border-white/[.08]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
              placeholder="Un poste, une ville, une question…"
              disabled={pending}
              className="flex-1 rounded-full border border-black/[.1] bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 disabled:opacity-60 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Envoyer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-brand-700 text-white transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant KmerJob"}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-brand transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-5 w-5" strokeWidth={2} /> : <MessageCircle className="h-5 w-5" strokeWidth={2} />}
      </button>
    </>
  )
}

function ChatBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white'
              : message.degraded
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                : 'bg-zinc-100 text-zinc-700 dark:bg-white/[.06] dark:text-zinc-300'
          }`}
        >
          {message.degraded && !isUser && (
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
              Mode dégradé
            </div>
          )}
          {message.content}
        </div>

        {message.offers && message.offers.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.offers.map((offer) => (
              <Link
                key={offer.id}
                href={`/offre/${offer.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-black/[.06] bg-white px-3 py-2 text-xs transition-colors hover:border-brand-600/30 dark:border-white/[.08] dark:bg-zinc-950"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{offer.title}</p>
                  <p className="truncate text-zinc-500 dark:text-zinc-400">
                    {offer.company} · {offer.location}
                  </p>
                </div>
                <TrustBadge level={offer.trust_level} className="shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
