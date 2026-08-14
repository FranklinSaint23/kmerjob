import { createHash } from 'node:crypto'

/**
 * Hash de déduplication d'une offre : sha256(titre|entreprise|description),
 * normalisés en minuscules. Partagé par toutes les voies d'insertion
 * (ingestion scraper, back-office admin) pour qu'une même offre saisie deux
 * fois — peu importe la source — soit détectée comme doublon.
 */
export function contentHash(title: string, company: string, description: string): string {
  const raw = `${title.trim().toLowerCase()}|${company.trim().toLowerCase()}|${description.trim().toLowerCase()}`
  return createHash('sha256').update(raw).digest('hex')
}
