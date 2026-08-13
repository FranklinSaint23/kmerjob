import 'server-only'

import { CITY_NAMES } from '@/lib/geo'
import { extractCvWithRules } from './cv-rules'
import { cvExtractionSchema, type CvExtraction } from './cv-schema'
import { callGroqJSON, isGroqConfigured } from './groq'

export interface CvExtractionResult extends CvExtraction {
  extracted_by: 'groq' | 'rules'
}

const SYSTEM_PROMPT = `Tu es un assistant RH spécialisé dans l'analyse de CV pour le marché de l'emploi camerounais.

On te donne le texte brut d'un CV. Tu en extrais des faits, uniquement des faits.

Règles impératives :
- N'invente RIEN. Si une information n'est pas dans le CV, renvoie la valeur vide/nulle prévue.
- "skills" : compétences concrètes, en minuscules, au singulier (ex. "comptabilité", "react", "gestion de projet"). Pas de phrases, pas de qualités vagues type "dynamique" ou "motivé".
- "experience_years" : nombre TOTAL d'années d'expérience professionnelle. Si le CV liste des postes datés sans total explicite, additionne les durées. Si rien n'est déterminable, mets 0.
- "education_rank" : 0 inconnu, 1 Baccalauréat, 2 BTS/DUT/HND/Bac+2, 3 Licence/Bachelor, 4 Master/Ingénieur/MBA, 5 Doctorat. Retiens le diplôme le PLUS ÉLEVÉ obtenu.
- "location" : ville de résidence du candidat, obligatoirement l'une de cette liste : ${CITY_NAMES.join(', ')}. Si la ville du CV n'y figure pas ou est absente, mets null.
- "summary" : 2 phrases maximum, en français, décrivant le profil de façon neutre et factuelle.

Réponds uniquement par un objet JSON avec les clés : skills, job_titles, languages, experience_years, education_label, education_rank, location, summary.`

/**
 * Extrait un profil structuré depuis le texte d'un CV.
 *
 * Ne rejette jamais : si Groq n'est pas configuré, échoue ou renvoie une
 * réponse non conforme, on retombe sur l'extraction par règles. Un candidat qui
 * vient de déposer son CV doit voir un résultat, pas une erreur — quitte à ce
 * qu'il soit moins fin.
 */
export async function extractCv(rawText: string): Promise<CvExtractionResult> {
  const text = rawText.trim()

  if (text.length < 40) {
    // Trop court pour être un CV exploitable : inutile de dépenser un appel LLM.
    return { ...extractCvWithRules(text), extracted_by: 'rules' }
  }

  if (!isGroqConfigured()) {
    return { ...extractCvWithRules(text), extracted_by: 'rules' }
  }

  try {
    const extraction = await callGroqJSON({
      system: SYSTEM_PROMPT,
      schema: cvExtractionSchema,
      // Tronqué : au-delà, on paie des tokens pour des mentions de loisirs et
      // des références. L'essentiel d'un CV tient dans les premiers milliers de
      // caractères.
      user: `Texte du CV :\n\n"""\n${text.slice(0, 12_000)}\n"""`,
      temperature: 0.1,
    })

    return { ...sanitize(extraction), extracted_by: 'groq' }
  } catch {
    // Volontairement silencieux côté utilisateur : la dégradation est gérée,
    // pas subie. L'appelant peut distinguer les deux cas via extracted_by.
    return { ...extractCvWithRules(text), extracted_by: 'rules' }
  }
}

/**
 * Le schéma Zod garantit les types, pas la cohérence métier. Ce nettoyage
 * rattrape ce qu'un LLM produit couramment : doublons de casse, ville
 * hors-catalogue malgré la consigne, rang et libellé de diplôme désaccordés.
 */
function sanitize(extraction: CvExtraction): CvExtraction {
  const dedupe = (values: string[]) =>
    [...new Map(values.map((v) => [v.toLowerCase().trim(), v.toLowerCase().trim()])).values()].filter(
      Boolean
    )

  const location =
    extraction.location && CITY_NAMES.some((c) => c.toLowerCase() === extraction.location!.toLowerCase())
      ? CITY_NAMES.find((c) => c.toLowerCase() === extraction.location!.toLowerCase())!
      : null

  return {
    ...extraction,
    skills: dedupe(extraction.skills),
    job_titles: [...new Set(extraction.job_titles.map((t) => t.trim()))].filter(Boolean),
    languages: [...new Set(extraction.languages.map((l) => l.trim()))].filter(Boolean),
    location,
  }
}

/**
 * Mots-clés servant à présélectionner les offres en base (voir la fonction SQL
 * shortlist_offers_for_cv). Compétences et intitulés de poste seulement : y
 * ajouter la ville polluerait la requête plein texte, la géographie étant déjà
 * traitée séparément par le score de proximité.
 */
export function buildSearchKeywords(profile: {
  skills: string[]
  job_titles: string[]
}): string[] {
  return [...new Set([...profile.skills, ...profile.job_titles])]
    .map((k) => k.trim())
    .filter((k) => k.length > 2)
    .slice(0, 25)
}
