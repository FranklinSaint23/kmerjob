import 'server-only'

import Groq from 'groq-sdk'
import type { z } from 'zod'

/**
 * Accès bas niveau à Groq.
 *
 * Deux partis pris qui gouvernent tout le reste du dossier lib/ai :
 *
 * 1. Toute réponse du modèle est validée par un schéma Zod avant d'être
 *    utilisée. Un LLM en mode JSON produit du JSON valide, pas forcément le
 *    JSON *attendu* : un champ manquant ou un nombre arrivé en chaîne casserait
 *    silencieusement le scoring en aval.
 *
 * 2. Aucun appel n'est jamais indispensable. Chaque appelant a un repli
 *    déterministe (voir cv-extraction.ts et trust.ts). Groq est en panne, la
 *    clé a expiré, le quota est atteint un vendredi soir : le site continue de
 *    fonctionner avec des résultats un peu moins fins, il ne tombe pas.
 */

let client: Groq | null = null

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new GroqUnavailableError('GROQ_API_KEY manquante')
    client = new Groq({ apiKey, maxRetries: 0 })
  }
  return client
}

export class GroqUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'GroqUnavailableError'
  }
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY)
}

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

interface CallOptions<T> {
  system: string
  user: string
  schema: z.ZodType<T>
  /** Bas par défaut : on fait de l'extraction factuelle, pas de la rédaction. */
  temperature?: number
  maxTokens?: number
  /** Budget total, coupe-circuit compris. */
  timeoutMs?: number
}

/**
 * Appelle Groq en mode JSON et renvoie un objet validé.
 * Une seule reprise, et uniquement si l'échec est plausiblement transitoire
 * (réseau, 429, 5xx) ou dû à un JSON non conforme — réessayer sur une 401 ne
 * ferait que doubler la latence avant d'échouer pareil.
 */
export async function callGroqJSON<T>({
  system,
  user,
  schema,
  temperature = 0.1,
  maxTokens = 2048,
  timeoutMs = 20_000,
}: CallOptions<T>): Promise<T> {
  const groq = getClient()
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create(
        {
          model: MODEL,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        { timeout: timeoutMs }
      )

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('Réponse Groq vide')

      const parsed = schema.safeParse(JSON.parse(content))
      if (!parsed.success) {
        throw new Error(`Réponse non conforme au schéma : ${parsed.error.message}`)
      }
      return parsed.data
    } catch (error) {
      lastError = error
      if (!isRetryable(error) || attempt === 1) break
      await new Promise((r) => setTimeout(r, 400))
    }
  }

  throw new GroqUnavailableError(
    `Appel Groq échoué : ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    lastError
  )
}

function isRetryable(error: unknown): boolean {
  if (error instanceof SyntaxError) return true // JSON.parse a échoué
  const status = (error as { status?: number })?.status
  if (status === undefined) return true // erreur réseau / timeout
  return status === 408 || status === 409 || status === 429 || status >= 500
}
