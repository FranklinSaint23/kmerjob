import { createHash, timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { analyzeTrust } from '@/lib/ai/trust'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

/**
 * POST /api/scraper/ingest — point d'entrée pour un service de scraping
 * externe (hors Next.js par conception, voir README : les timeouts des
 * fonctions serverless s'accordent mal avec du scraping multi-sources).
 *
 * Route serveur-à-serveur, exclue du middleware d'auth (voir middleware.ts).
 * Sécurisée par un jeton statique plutôt qu'une session — il n'y a pas
 * d'utilisateur derrière cet appel.
 */

const offerInputSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  category: z.string().max(60).optional(),
  sector: z.string().max(60).optional(),
  location: z.string().max(60).optional(),
  contract_type: z.string().max(60).optional(),
  seniority: z.string().max(60).optional(),
  description: z.string().min(1),
  requirements: z.array(z.string()).optional(),
  salary: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
})

const ingestSchema = z.object({
  source: z.string().min(1).max(80),
  offers: z.array(offerInputSchema).max(200),
})

function contentHash(title: string, company: string, description: string): string {
  const raw = `${title.trim().toLowerCase()}|${company.trim().toLowerCase()}|${description.trim().toLowerCase()}`
  return createHash('sha256').update(raw).digest('hex')
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.SCRAPER_INGEST_TOKEN
  if (!expected) return false // pas de mode "ouvert par défaut" pour une route d'écriture

  const provided = request.headers.get('x-ingest-token') ?? ''
  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  return expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Jeton invalide ou manquant.' }, { status: 401 })
  }

  const parsed = ingestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { source, offers } = parsed.data
  const admin = createAdminClient()

  const log = await admin
    .from('scraping_logs')
    .insert({ source_name: source, status: 'running', offers_found: offers.length })
    .select()
    .single()

  let created = 0
  let duplicates = 0
  const errors: string[] = []

  for (const raw of offers) {
    try {
      const hash = contentHash(raw.title, raw.company, raw.description)

      const { data: existing } = await admin
        .from('offers')
        .select('id')
        .eq('content_hash', hash)
        .maybeSingle()

      if (existing) {
        duplicates++
        continue
      }

      const trust = await analyzeTrust({
        title: raw.title,
        company: raw.company,
        description: raw.description,
        salary: raw.salary,
        category: raw.category,
        sourceUrl: raw.source_url,
      })

      const { error: insertError } = await admin.from('offers').insert({
        title: raw.title,
        company: raw.company,
        category: raw.category ?? 'Privée informelle',
        sector: raw.sector ?? 'Autre',
        location: raw.location ?? 'Non précisé',
        contract_type: raw.contract_type ?? 'Non précisé',
        seniority: raw.seniority ?? 'Non précisé',
        description: raw.description,
        requirements: raw.requirements ?? [],
        salary: raw.salary ?? null,
        deadline: raw.deadline ?? null,
        source,
        source_url: raw.source_url ?? null,
        trust_level: trust.trust_level,
        trust_score: trust.trust_score,
        trust_reasons: trust.reasons,
        trust_analyzed_by: trust.analyzed_by,
        content_hash: hash,
      })

      if (insertError) {
        errors.push(`${raw.title}: ${insertError.message}`)
      } else {
        created++
      }
    } catch (err) {
      errors.push(`${raw.title}: ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    }
  }

  if (log.data) {
    await admin
      .from('scraping_logs')
      .update({
        status: errors.length > 0 && created === 0 ? 'error' : 'success',
        offers_created: created,
        offers_duplicate: duplicates,
        error_message: errors.length > 0 ? errors.slice(0, 10).join(' | ') : null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', log.data.id)
  }

  return NextResponse.json({ created, duplicates, errors, total: offers.length })
}
