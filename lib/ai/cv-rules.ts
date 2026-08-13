import { CITY_NAMES, normalize } from '@/lib/geo'
import type { CvExtraction } from './cv-schema'

/**
 * Extraction de CV par règles — le repli déterministe quand Groq est
 * indisponible.
 *
 * Volontairement modeste dans ses ambitions : reconnaître des motifs fréquents
 * dans un CV francophone, sans prétendre comprendre le document. Elle sera
 * moins fine que le LLM (elle ne déduira pas « a encadré une équipe de 5 » →
 * management), mais elle est instantanée, gratuite, et elle ne tombe jamais.
 */

const SKILL_DICTIONARY: readonly string[] = [
  // technique
  'javascript', 'typescript', 'python', 'java', 'php', 'c#', 'c++', 'go', 'ruby',
  'react', 'next.js', 'vue', 'angular', 'node.js', 'django', 'flask', 'laravel',
  'symfony', 'spring', 'sql', 'postgresql', 'mysql', 'mongodb', 'supabase',
  'firebase', 'docker', 'kubernetes', 'git', 'linux', 'aws', 'azure',
  'html', 'css', 'tailwind', 'bootstrap', 'figma', 'photoshop', 'illustrator',
  'wordpress', 'excel', 'power bi', 'tableau', 'sap', 'autocad',
  // métiers / transverses
  'comptabilité', 'audit', 'fiscalité', 'contrôle de gestion', 'finance',
  'marketing', 'community management', 'vente', 'négociation', 'commercial',
  'ressources humaines', 'recrutement', 'paie', 'logistique', 'supply chain',
  'gestion de projet', 'management', 'juridique', 'droit', 'communication',
  'maintenance', 'électricité', 'mécanique', 'génie civil', 'topographie',
  'agronomie', 'santé', 'infirmier', 'pharmacie', 'enseignement', 'formation',
  'secrétariat', 'accueil', 'caisse', 'sécurité', 'qhse',
]

const EDUCATION_LEVELS: readonly { label: string; rank: number; pattern: RegExp }[] = [
  { label: 'Doctorat', rank: 5, pattern: /\bdoctorat\b|\bph\.?\s?d\b|\bthèse\b/i },
  { label: 'Master / Bac+5', rank: 4, pattern: /\bmaster\b|\bmba\b|\bbac\s*\+\s*5\b|\bingénieur\b|\bdess\b|\bdea\b/i },
  { label: 'Licence / Bac+3', rank: 3, pattern: /\blicence\b|\bbachelor\b|\bbac\s*\+\s*3\b/i },
  { label: 'BTS / DUT / Bac+2', rank: 2, pattern: /\bbts\b|\bdut\b|\bhnd\b|\bbac\s*\+\s*2\b|\bdeug\b/i },
  { label: 'Baccalauréat', rank: 1, pattern: /\bbaccalauréat\b|\bbac\b|\bgce\s+a\s*level\b|\bprobatoire\b/i },
]

const LANGUAGE_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
  { label: 'Français', pattern: /\bfran[cç]ais\b|\bfrench\b/i },
  { label: 'Anglais', pattern: /\banglais\b|\benglish\b/i },
  { label: 'Allemand', pattern: /\ballemand\b|\bgerman\b/i },
  { label: 'Espagnol', pattern: /\bespagnol\b|\bspanish\b/i },
  { label: 'Chinois', pattern: /\bchinois\b|\bmandarin\b/i },
]

/**
 * Années d'expérience.
 * Plusieurs formulations courantes, et on prend le maximum trouvé : un CV
 * mentionnant « 2 ans chez X » puis « 7 ans d'expérience au total » doit
 * retenir 7. Plafonné à 50 pour écarter les faux positifs du type « depuis
 * 2015 » mal capturés.
 */
export function detectExperienceYears(text: string): number {
  const patterns = [
    /(\d{1,2})\s*(?:\+)?\s*(?:ans?|années?)\s+d['’]?\s*(?:exp[ée]rience|expertise)/gi,
    /exp[ée]rience\s*(?:professionnelle)?\s*(?:de|:)?\s*(\d{1,2})\s*(?:ans?|années?)/gi,
    /(\d{1,2})\s*(?:ans?|années?)\s+(?:dans|en tant que|comme)\b/gi,
  ]

  let best = 0
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const years = Number.parseInt(match[1]!, 10)
      if (Number.isFinite(years) && years <= 50) best = Math.max(best, years)
    }
  }
  return best
}

export function detectEducation(text: string): { label: string; rank: number } {
  // Les niveaux sont ordonnés du plus élevé au plus bas : le premier qui
  // correspond gagne, ce qui évite qu'un CV de docteur soit classé « Bac »
  // sous prétexte que le mot « baccalauréat » y figure aussi.
  for (const level of EDUCATION_LEVELS) {
    if (level.pattern.test(text)) return { label: level.label, rank: level.rank }
  }
  return { label: 'Non précisé', rank: 0 }
}

export function detectSkills(text: string): string[] {
  const haystack = normalize(text)
  return SKILL_DICTIONARY.filter((skill) => {
    const needle = normalize(skill)
    // Bornes de mot pour éviter que « go » matche « logo » ou « algorithme ».
    return new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(needle)}([^a-z0-9+#.]|$)`).test(haystack)
  })
}

export function detectLanguages(text: string): string[] {
  return LANGUAGE_PATTERNS.filter(({ pattern }) => pattern.test(text)).map((l) => l.label)
}

export function detectLocation(text: string): string | null {
  const haystack = normalize(text)
  // Priorité à la ville la plus longue : « Nkongsamba » avant « Kumba » si les
  // deux apparaissent en sous-chaîne.
  const found = [...CITY_NAMES]
    .sort((a, b) => b.length - a.length)
    .find((city) => haystack.includes(normalize(city)))
  return found ?? null
}

/** Intitulés de poste — on cible les formulations d'accroche de CV. */
export function detectJobTitles(text: string): string[] {
  const titles = new Set<string>()
  const patterns = [
    /(?:poste\s+(?:actuel|occupé)|intitulé|fonction)\s*:\s*([^\n.;]{3,60})/gi,
    /(?:en tant que|au poste de|comme)\s+([a-zà-ÿ][^\n.;,]{3,50})/gi,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const title = match[1]?.trim()
      if (title) titles.add(title.replace(/\s+/g, ' '))
    }
  }
  return [...titles].slice(0, 5)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Extraction complète par règles, même forme de sortie que la version Groq. */
export function extractCvWithRules(text: string): CvExtraction {
  const education = detectEducation(text)
  const skills = detectSkills(text)

  return {
    skills,
    job_titles: detectJobTitles(text),
    languages: detectLanguages(text),
    experience_years: detectExperienceYears(text),
    education_label: education.label,
    education_rank: education.rank,
    location: detectLocation(text),
    summary:
      skills.length > 0
        ? `Profil détecté automatiquement : ${skills.slice(0, 5).join(', ')}.`
        : 'Profil extrait sans analyse sémantique — complète ton CV pour de meilleures recommandations.',
  }
}
