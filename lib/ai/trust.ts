import 'server-only'

import { normalize } from '@/lib/geo'
import { trustSchema, type TrustAnalysis } from './cv-schema'
import { callGroqJSON, isGroqConfigured } from './groq'

/**
 * Détection d'annonces douteuses.
 *
 * Fonctionnalité de protection, pas de confort : au Cameroun comme ailleurs,
 * les fausses offres d'emploi servent à extorquer des « frais de dossier » à
 * des gens qui cherchent du travail. D'où deux principes :
 *
 * - Les règles priment. Un signal d'arnaque avéré (demande d'argent, contact
 *   uniquement par WhatsApp, salaire délirant) rétrograde l'annonce même si le
 *   LLM la trouve rassurante. Un modèle ne doit pas pouvoir blanchir une
 *   annonce qu'une règle explicite condamne.
 * - En cas de doute, on classe en « moderee », jamais en « verifiee ».
 *   Sur-avertir coûte un haussement d'épaules ; sous-avertir coûte de l'argent
 *   à quelqu'un qui n'en a pas.
 */

interface Signal {
  pattern: RegExp
  reason: string
  /** Négatif = suspect, positif = rassurant. */
  weight: number
}

const RED_FLAGS: readonly Signal[] = [
  {
    pattern: /frais\s+(?:de\s+)?(?:dossier|inscription|traitement)|payer\s+(?:pour|afin)|caution\s+(?:exig|demand)/i,
    reason: "L'annonce évoque des frais à payer par le candidat — un employeur légitime ne fait jamais payer pour postuler.",
    weight: -60,
  },
  {
    pattern: /envoyez?\s+(?:votre\s+)?(?:code|pin|mot\s+de\s+passe)|momo\s+pay|orange\s+money.{0,30}(?:envoy|verse)/i,
    reason: 'Demande de paiement ou de code Mobile Money : signal d\'arnaque très fort.',
    weight: -70,
  },
  {
    pattern: /gagnez?\s+\d[\d\s.]*\s*(?:000)?\s*(?:fcfa|xaf).{0,20}(?:par\s+jour|\/jour|semaine)/i,
    reason: 'Promesse de gains rapides et élevés, formulation typique des offres frauduleuses.',
    weight: -50,
  },
  {
    pattern: /(?:aucune?\s+(?:exp[ée]rience|qualification)\s+(?:requise|n[ée]cessaire)).{0,60}(?:salaire\s+[ée]lev|tr[eè]s\s+bien\s+r[ée]mun)/i,
    reason: 'Aucune qualification demandée mais salaire élevé promis : combinaison peu crédible.',
    weight: -40,
  },
  {
    pattern: /contact(?:ez)?\s+(?:uniquement|seulement)?\s*(?:par\s+)?whatsapp|whatsapp\s+uniquement/i,
    reason: 'Recrutement exclusivement par WhatsApp, sans adresse ni site professionnel.',
    weight: -30,
  },
  {
    pattern: /urgent{1,2}\s*!{2,}|postulez\s+(?:vite|imm[ée]diatement)\s*!{2,}/i,
    reason: "Pression à l'urgence inhabituelle pour un recrutement.",
    weight: -20,
  },
]

const GREEN_FLAGS: readonly Signal[] = [
  {
    pattern: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/,
    reason: 'Une adresse e-mail de contact est fournie.',
    weight: +15,
  },
  {
    pattern: /\bcdi\b|\bcdd\b|contrat\s+(?:à\s+)?dur[ée]e/i,
    reason: 'Le type de contrat est explicitement précisé.',
    weight: +15,
  },
  {
    pattern: /convention\s+collective|cnps|bulletin\s+de\s+paie/i,
    reason: 'Référence à un cadre légal du travail (CNPS, convention collective).',
    weight: +20,
  },
]

/** Catégories d'employeurs dont la structure est vérifiable. */
const TRUSTED_CATEGORIES = ['Fonction publique', 'Grande entreprise', 'ONG / International']

export function analyzeTrustWithRules(input: {
  title: string
  description: string
  salary?: string | null
  category?: string
  sourceUrl?: string | null
}): TrustAnalysis {
  const haystack = `${input.title}\n${input.description}\n${input.salary ?? ''}`

  let score = 50
  const reasons: string[] = []
  let hasHardRedFlag = false

  for (const signal of RED_FLAGS) {
    if (signal.pattern.test(haystack)) {
      score += signal.weight
      reasons.push(signal.reason)
      if (signal.weight <= -50) hasHardRedFlag = true
    }
  }

  for (const signal of GREEN_FLAGS) {
    if (signal.pattern.test(haystack)) {
      score += signal.weight
      reasons.push(signal.reason)
    }
  }

  if (input.category && TRUSTED_CATEGORIES.includes(input.category)) {
    score += 15
    reasons.push(`Catégorie d'employeur vérifiable (${input.category}).`)
  }

  if (input.sourceUrl) {
    score += 10
    reasons.push("L'annonce renvoie vers une source consultable.")
  }

  if (!input.description || input.description.length < 120) {
    score -= 15
    reasons.push('Description très courte : peu d\'informations sur le poste réel.')
  }

  score = Math.max(0, Math.min(100, score))

  if (reasons.length === 0) {
    reasons.push('Aucun signal particulier détecté, ni rassurant ni inquiétant.')
  }

  return { trust_level: levelFor(score, hasHardRedFlag), trust_score: score, reasons: reasons.slice(0, 6) }
}

function levelFor(score: number, hasHardRedFlag: boolean): TrustAnalysis['trust_level'] {
  if (hasHardRedFlag) return 'suspecte'
  if (score >= 75) return 'verifiee'
  if (score >= 40) return 'moderee'
  return 'suspecte'
}

const TRUST_SYSTEM = `Tu analyses la fiabilité d'une offre d'emploi publiée au Cameroun, pour protéger des candidats contre les arnaques au recrutement.

Signaux d'alerte : frais demandés au candidat, demande de code ou de paiement Mobile Money, salaire disproportionné, absence d'employeur identifiable, contact uniquement par messagerie personnelle, formulation vague ne décrivant aucun travail réel, pression à l'urgence.

Signaux rassurants : employeur nommé et identifiable, missions décrites précisément, type de contrat et conditions explicites, processus de candidature professionnel, référence au cadre légal (CNPS, convention collective).

Barème :
- "verifiee" (75-100) : employeur identifiable ET description substantielle ET aucun signal d'alerte.
- "moderee" (40-74) : rien d'alarmant mais des informations manquantes.
- "suspecte" (0-39) : au moins un signal d'alerte sérieux.

En cas d'hésitation, choisis TOUJOURS le niveau le plus prudent.

"reasons" : 2 à 4 phrases courtes en français, adressées au candidat, expliquant concrètement ton verdict.

Réponds par un objet JSON : { "trust_level": "...", "trust_score": 0-100, "reasons": ["..."] }`

/**
 * Analyse combinée. Les règles s'exécutent toujours ; Groq ne peut qu'aggraver
 * le verdict, jamais l'adoucir en dessous de ce que les règles ont détecté.
 */
export async function analyzeTrust(input: {
  title: string
  company: string
  description: string
  salary?: string | null
  category?: string
  sourceUrl?: string | null
}): Promise<TrustAnalysis & { analyzed_by: 'rules' | 'groq' }> {
  const rulesVerdict = analyzeTrustWithRules(input)

  if (!isGroqConfigured()) return { ...rulesVerdict, analyzed_by: 'rules' }

  try {
    const llmVerdict = await callGroqJSON({
      system: TRUST_SYSTEM,
      user: `Titre : ${input.title}
Entreprise : ${input.company}
Catégorie : ${input.category ?? 'non précisée'}
Salaire annoncé : ${input.salary ?? 'non précisé'}
Lien source : ${input.sourceUrl ?? 'aucun'}

Description :
"""
${input.description.slice(0, 4000)}
"""`,
      schema: trustSchema,
      temperature: 0.1,
      maxTokens: 800,
    })

    // Le plus sévère des deux l'emporte.
    const score = Math.min(rulesVerdict.trust_score, llmVerdict.trust_score)
    const rank = { suspecte: 0, moderee: 1, verifiee: 2 } as const
    const level =
      rank[llmVerdict.trust_level] < rank[rulesVerdict.trust_level]
        ? llmVerdict.trust_level
        : rulesVerdict.trust_level

    const reasons = [...new Set([...llmVerdict.reasons, ...rulesVerdict.reasons])]
      .filter((r) => normalize(r).length > 0)
      .slice(0, 5)

    return { trust_level: level, trust_score: score, reasons, analyzed_by: 'groq' }
  } catch {
    return { ...rulesVerdict, analyzed_by: 'rules' }
  }
}
