import 'server-only'

import type Groq from 'groq-sdk'

import { CITY_NAMES } from '@/lib/geo'
import { createClient } from '@/lib/supabase/server'
import type { SearchOfferRow } from '@/lib/types/database'
import { createChatCompletion, GroqUnavailableError, isGroqConfigured } from './groq'

/**
 * Assistant conversationnel de KmerJob.
 *
 * Un seul outil exposé au modèle : la recherche d'offres réelles. C'est le
 * garde-fou principal — sans lui, un LLM conversationnel invente volontiers
 * des postes, des entreprises et des salaires plausibles pour paraître utile.
 * Sur un site dont la fonctionnalité phare est de protéger les candidats
 * contre les fausses annonces, un chatbot qui en fabrique lui-même serait la
 * pire régression possible. Le prompt système l'interdit explicitement, et le
 * seul moyen de citer une offre est de passer par cet outil.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatTurnResult {
  reply: string
  offers: SearchOfferRow[]
  /** true si Groq est indisponible : reply est un message de repli statique. */
  degraded: boolean
}

const MAX_HISTORY = 8
const FALLBACK_UNAVAILABLE =
  "L'assistant est momentanément indisponible. Tu peux chercher une offre directement depuis la page Recherche, ou déposer ton CV pour des recommandations."
const FALLBACK_EMPTY_REPLY = "Je n'ai pas de réponse à te proposer là — tu peux reformuler ta question ?"

const SYSTEM_PROMPT = `Tu es l'assistant de KmerJob, une plateforme d'offres d'emploi au Cameroun.

Règles impératives, non négociables :
- N'invente JAMAIS d'offre d'emploi, d'entreprise, de salaire ou de coordonnées de contact. La seule source d'offres autorisée est l'outil rechercher_offres. Si on te demande un poste, utilise l'outil. S'il ne renvoie rien, dis-le honnêtement plutôt que de proposer quoi que ce soit d'inventé — c'est une règle absolue, pas une préférence.
- Tutoiement, français, réponses courtes et concrètes (3-4 phrases sauf si on te demande explicitement plus de détail).
- Tu n'as accès ni au compte, ni au CV, ni à l'abonnement de la personne : pour toute question personnelle ("mes recommandations", "mon abonnement", "mon CV"), oriente vers /cv ou /compte plutôt que de deviner.
- Ne traite jamais un paiement dans la conversation ; oriente vers /premium/paiement.
- Le site propose : dépôt de CV analysé par IA (/cv) avec recommandations expliquées poste par poste, un badge de fiabilité sur chaque annonce (vérifiée / à vérifier / suspecte), un Radar Premium géolocalisé par abonnement Mobile Money (/premium).
- Villes couvertes : ${CITY_NAMES.join(', ')}.
- Si la question sort du champ de l'emploi au Cameroun et du fonctionnement de KmerJob, dis poliment que ce n'est pas ton domaine plutôt que d'y répondre.`

const SEARCH_TOOL: Groq.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'rechercher_offres',
    description:
      "Recherche des offres d'emploi réellement actives sur KmerJob par mot-clé et/ou ville. À utiliser systématiquement dès qu'on te demande un poste, un secteur ou une entreprise — ne réponds jamais de mémoire.",
    parameters: {
      type: 'object',
      properties: {
        requete: {
          type: 'string',
          description: 'Mots-clés : métier, compétence ou secteur recherché.',
        },
        ville: {
          type: 'string',
          description: `Ville camerounaise, une valeur parmi : ${CITY_NAMES.join(', ')}.`,
        },
      },
    },
  },
}

/** Ce que le modèle reçoit en retour d'outil : juste assez pour répondre, pas de quoi saturer le contexte. */
function summarizeForModel(offer: SearchOfferRow) {
  return {
    id: offer.id,
    titre: offer.title,
    entreprise: offer.company,
    ville: offer.location,
    contrat: offer.contract_type,
    salaire: offer.salary ?? 'non précisé',
    fiabilite: offer.trust_level,
  }
}

async function searchOffers(args: { requete?: string; ville?: string }): Promise<SearchOfferRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_offers', {
    p_query: args.requete ?? '',
    p_location: args.ville && CITY_NAMES.includes(args.ville) ? args.ville : null,
    p_limit: 5,
  })
  if (error) {
    console.error('[chat] échec de rechercher_offres', error)
    return []
  }
  return data ?? []
}

function safeParseArgs(raw: string): { requete?: string; ville?: string } {
  try {
    const parsed = JSON.parse(raw)
    return {
      requete: typeof parsed.requete === 'string' ? parsed.requete : undefined,
      ville: typeof parsed.ville === 'string' ? parsed.ville : undefined,
    }
  } catch {
    return {}
  }
}

export async function runChatTurn(history: ChatMessage[]): Promise<ChatTurnResult> {
  if (!isGroqConfigured()) {
    return { reply: FALLBACK_UNAVAILABLE, offers: [], degraded: true }
  }

  const conversation: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
  ]

  try {
    const first = await createChatCompletion({
      messages: conversation,
      tools: [SEARCH_TOOL],
      temperature: 0.3,
      maxTokens: 500,
    })

    const message = first.choices[0]?.message
    const toolCalls = message?.tool_calls

    if (!toolCalls || toolCalls.length === 0) {
      return { reply: message?.content?.trim() || FALLBACK_EMPTY_REPLY, offers: [], degraded: false }
    }

    // Un seul outil est exposé : n'exécuter que le premier appel suffit et
    // évite d'enchaîner plusieurs recherches (latence) pour un même tour.
    const call = toolCalls[0]!
    const offers = await searchOffers(safeParseArgs(call.function.arguments))

    const second = await createChatCompletion({
      messages: [
        ...conversation,
        { role: 'assistant', content: message.content ?? '', tool_calls: toolCalls },
        {
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify({ offres: offers.map(summarizeForModel) }),
        },
      ],
      temperature: 0.3,
      maxTokens: 400,
    })

    const reply = second.choices[0]?.message?.content?.trim() || FALLBACK_EMPTY_REPLY
    return { reply, offers, degraded: false }
  } catch (error) {
    const detail = error instanceof GroqUnavailableError ? error.message : String(error)
    console.error('[chat] tour échoué', detail)
    return { reply: FALLBACK_UNAVAILABLE, offers: [], degraded: true }
  }
}
