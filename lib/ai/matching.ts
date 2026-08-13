import 'server-only'

import { normalize, proximityScore } from '@/lib/geo'
import type { CvProfileRow, ShortlistOfferRow } from '@/lib/types/database'
import { rerankSchema } from './cv-schema'
import { callGroqJSON, isGroqConfigured } from './groq'

/**
 * Matching CV ↔ offres, en trois temps :
 *
 *   1. Postgres présélectionne ~40 offres par recherche plein texte française
 *      (fonction shortlist_offers_for_cv). Rapide, indexé, gratuit.
 *   2. Un score déterministe classe ces 40 offres. Explicable ligne à ligne,
 *      et suffisant à lui seul.
 *   3. Groq reclasse la tête de liste en tenant compte du sens (« a encadré une
 *      équipe » ↔ « poste de chef d'équipe »), ce que la correspondance de
 *      mots-clés ne verra jamais.
 *
 * L'étape 3 est facultative. Si elle échoue, on sert le classement de l'étape 2.
 * On ne renvoie donc jamais une page vide parce qu'un fournisseur externe est
 * en panne.
 */

/** Somme = 100. Modifier ici change le classement de tout le site. */
export const WEIGHTS = {
  skills: 45,
  experience: 20,
  education: 15,
  location: 15,
  languages: 5,
} as const

export interface ScoreBreakdown {
  competences: number
  experience: number
  etudes: number
  localisation: number
  langues: number
}

export interface MatchedOffer {
  offer: ShortlistOfferRow
  score: number
  breakdown: ScoreBreakdown
  /** Renseigné uniquement quand Groq a reclassé l'offre. */
  reason?: string
  matchedSkills: string[]
}

type CvLike = Pick<
  CvProfileRow,
  'skills' | 'job_titles' | 'languages' | 'experience_years' | 'education_rank' | 'location' | 'raw_text'
>

// -----------------------------------------------------------------------------
// Étape 2 — score déterministe
// -----------------------------------------------------------------------------

/**
 * Années d'expérience attendues, déduites du niveau de séniorité annoncé.
 * Les offres camerounaises l'expriment rarement en chiffres.
 */
function requiredYears(seniority: string): number {
  const s = normalize(seniority)
  if (/senior|expert|confirm/.test(s)) return 5
  if (/interm|3\s*-\s*5|moyen/.test(s)) return 3
  if (/junior|d[ée]butant|stage|stagiaire/.test(s)) return 0
  return 1
}

function skillsScore(cv: CvLike, offer: ShortlistOfferRow): { score: number; matched: string[] } {
  const haystack = normalize(`${offer.title} ${offer.description} ${offer.requirements.join(' ')}`)
  const cvSkills = cv.skills.map(normalize).filter(Boolean)

  if (cvSkills.length === 0) return { score: 0, matched: [] }

  const matched = cv.skills.filter((skill) => haystack.includes(normalize(skill)))

  // Quand l'offre liste ses exigences, on mesure leur taux de couverture :
  // c'est la question qui intéresse le recruteur.
  if (offer.requirements.length > 0) {
    const covered = offer.requirements.filter((req) => {
      const r = normalize(req)
      return cvSkills.some((s) => r.includes(s) || s.includes(r))
    }).length
    return { score: Math.round((covered / offer.requirements.length) * 100), matched }
  }

  // Sans exigences listées, on regarde combien des compétences du candidat
  // apparaissent dans le texte. Le dénominateur est plafonné à 8 : au-delà, un
  // candidat polyvalent serait pénalisé par sa propre richesse de profil,
  // puisqu'aucune offre ne mentionnera ses 30 compétences.
  const ratio = matched.length / Math.min(cvSkills.length, 8)
  return { score: Math.round(Math.min(1, ratio) * 100), matched }
}

export function scoreOffer(cv: CvLike, offer: ShortlistOfferRow): MatchedOffer {
  const { score: competences, matched } = skillsScore(cv, offer)

  const needed = requiredYears(offer.seniority)
  const experience =
    needed === 0 ? 100 : Math.round(Math.min(1, cv.experience_years / needed) * 100)

  // Rang 3 (Licence) traité comme le niveau attendu par défaut du marché
  // formel ; en dessous on décroît, au-dessus on plafonne — être surdiplômé
  // n'est pas un meilleur match.
  const etudes = cv.education_rank >= 3 ? 100 : cv.education_rank === 2 ? 70 : cv.education_rank === 1 ? 45 : 20

  const localisation = proximityScore(cv.location, offer.location)

  const langues = cv.languages.length >= 2 ? 100 : cv.languages.length === 1 ? 65 : 40

  const breakdown: ScoreBreakdown = { competences, experience, etudes, localisation, langues }

  const score = Math.round(
    (competences * WEIGHTS.skills +
      experience * WEIGHTS.experience +
      etudes * WEIGHTS.education +
      localisation * WEIGHTS.location +
      langues * WEIGHTS.languages) /
      100
  )

  return { offer, score, breakdown, matchedSkills: matched }
}

// -----------------------------------------------------------------------------
// Étape 3 — reclassement sémantique
// -----------------------------------------------------------------------------

const RERANK_SYSTEM = `Tu es un conseiller emploi au Cameroun. On te donne le profil d'un candidat et une liste d'offres, chacune avec un identifiant.

Pour chaque offre, tu évalues l'adéquation réelle avec le candidat, sur 100.

Ce qui compte :
- l'adéquation du métier et des compétences, y compris par équivalence (encadrer une équipe ≈ poste de chef d'équipe ; "tenue de caisse" ≈ "caissier") ;
- la cohérence du niveau d'expérience avec la séniorité demandée ;
- ne pénalise PAS la distance géographique, elle est traitée séparément.

Consignes :
- Renvoie une entrée par offre reçue, avec exactement l'identifiant fourni.
- "reason" : UNE phrase en français, adressée au candidat (tutoiement), qui dit concrètement pourquoi ça colle ou non. Pas de flatterie, pas de généralités.
- Sois sévère : une offre hors domaine mérite moins de 30.

Réponds par un objet JSON : { "results": [ { "id": "...", "score": 0-100, "reason": "..." } ] }`

/**
 * Mélange 60/40 entre le score déterministe et celui du LLM.
 *
 * Ni l'un ni l'autre seul : les règles ratent le sens, le LLM est instable d'un
 * appel à l'autre et peut halluciner une justification convaincante pour une
 * offre hors sujet. Garder le déterministe majoritaire rend le classement
 * reproductible et défendable auprès de l'utilisateur.
 */
const DETERMINISTIC_WEIGHT = 0.6

export async function rerankWithGroq(
  cv: CvLike,
  scored: MatchedOffer[],
  limit = 15
): Promise<MatchedOffer[]> {
  if (!isGroqConfigured() || scored.length === 0) return scored

  const candidates = scored.slice(0, limit)

  const profile = [
    `Compétences : ${cv.skills.join(', ') || 'non renseignées'}`,
    `Postes occupés : ${cv.job_titles.join(', ') || 'non renseignés'}`,
    `Expérience : ${cv.experience_years} an(s)`,
    `Langues : ${cv.languages.join(', ') || 'non renseignées'}`,
  ].join('\n')

  const offersBlock = candidates
    .map(
      ({ offer }) =>
        `--- id: ${offer.id}\nTitre : ${offer.title}\nEntreprise : ${offer.company}\nSéniorité : ${offer.seniority}\nExigences : ${offer.requirements.join(', ') || 'non précisées'}\nDescription : ${offer.description.slice(0, 500)}`
    )
    .join('\n\n')

  try {
    const { results } = await callGroqJSON({
      system: RERANK_SYSTEM,
      user: `Profil du candidat :\n${profile}\n\nOffres à évaluer :\n\n${offersBlock}`,
      schema: rerankSchema,
      temperature: 0.2,
      maxTokens: 3000,
      timeoutMs: 25_000,
    })

    const byId = new Map(results.map((r) => [r.id, r]))
    const reranked = candidates.map((item) => {
      const llm = byId.get(item.offer.id)
      if (!llm) return item
      return {
        ...item,
        score: Math.round(item.score * DETERMINISTIC_WEIGHT + llm.score * (1 - DETERMINISTIC_WEIGHT)),
        reason: llm.reason,
      }
    })

    return [...reranked, ...scored.slice(limit)].sort((a, b) => b.score - a.score)
  } catch {
    return scored
  }
}

// -----------------------------------------------------------------------------
// Orchestration
// -----------------------------------------------------------------------------

export async function matchOffers(
  cv: CvLike,
  offers: ShortlistOfferRow[],
  options: { rerank?: boolean; limit?: number } = {}
): Promise<MatchedOffer[]> {
  const { rerank = true, limit = 20 } = options

  const scored = offers.map((offer) => scoreOffer(cv, offer)).sort((a, b) => b.score - a.score)
  const final = rerank ? await rerankWithGroq(cv, scored) : scored

  return final.slice(0, limit)
}

/**
 * Score du Radar : pertinence du profil pondérée par la proximité.
 * 70/30 — la géographie compte, mais un emploi parfaitement adapté à 200 km
 * reste plus utile qu'un emploi hors domaine au coin de la rue.
 */
export function radarScore(match: MatchedOffer, userCity: string | null): number {
  const proximity = proximityScore(userCity, match.offer.location)
  return Math.round(match.score * 0.7 + proximity * 0.3)
}
