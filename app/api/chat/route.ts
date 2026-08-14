import { NextResponse } from 'next/server'
import { z } from 'zod'

import { runChatTurn } from '@/lib/ai/chat'

export const maxDuration = 30

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(9), // 4 échanges + le tour courant : au-delà, /api/ai/chat.ts tronque déjà, mais on refuse tôt un payload anormal
})

/**
 * POST /api/chat — un tour de conversation avec l'assistant.
 *
 * Pas d'authentification requise : le chatbot répond aussi aux visiteurs non
 * connectés (c'est une bonne partie de son intérêt — aider quelqu'un à
 * chercher un poste avant même de créer un compte). Aucune donnée
 * personnelle n'y transite, voir le prompt système dans lib/ai/chat.ts.
 */
export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Message invalide.' }, { status: 400 })
  }

  const result = await runChatTurn(parsed.data.messages)
  return NextResponse.json(result)
}
