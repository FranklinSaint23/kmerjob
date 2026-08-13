import { z } from 'zod'

/**
 * Contrat de sortie de l'extraction de CV.
 *
 * Un seul schéma partagé par les deux moteurs (Groq et règles) : c'est ce qui
 * permet de basculer de l'un à l'autre sans que le reste du code s'en aperçoive.
 */

export const cvExtractionSchema = z.object({
  /** Compétences en minuscules, dédoublonnées. */
  skills: z.array(z.string().min(1).max(60)).max(40).default([]),
  /** Intitulés de poste occupés ou visés. */
  job_titles: z.array(z.string().min(1).max(80)).max(10).default([]),
  languages: z.array(z.string().min(1).max(30)).max(10).default([]),
  experience_years: z.number().int().min(0).max(50).default(0),
  education_label: z.string().max(60).default('Non précisé'),
  /** 0 = inconnu, 1 = Bac … 5 = Doctorat. */
  education_rank: z.number().int().min(0).max(5).default(0),
  /** Ville de résidence si elle figure au CV. */
  location: z.string().max(60).nullable().default(null),
  summary: z.string().max(600).default(''),
})

export type CvExtraction = z.infer<typeof cvExtractionSchema>

/** Réponse attendue du reclassement d'offres par le LLM. */
export const rerankSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.string(),
        score: z.number().min(0).max(100),
        /** Une phrase, montrée telle quelle à l'utilisateur. */
        reason: z.string().max(240),
      })
    )
    .max(60),
})

export type RerankResult = z.infer<typeof rerankSchema>

/** Réponse attendue de l'analyse de fiabilité d'une annonce. */
export const trustSchema = z.object({
  trust_level: z.enum(['verifiee', 'moderee', 'suspecte']),
  trust_score: z.number().int().min(0).max(100),
  reasons: z.array(z.string().min(1).max(160)).min(1).max(6),
})

export type TrustAnalysis = z.infer<typeof trustSchema>
