'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { isAdmin } from '@/lib/admin-server'
import { contentHash } from '@/lib/offers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TrustLevel } from '@/lib/types/database'

export interface OfferFormState {
  error: string | null
}

const TRUST_LEVELS: readonly TrustLevel[] = ['verifiee', 'moderee', 'suspecte']

/** Score par défaut associé au niveau choisi par l'admin — cohérent avec l'échelle utilisée ailleurs (lib/ai/trust.ts). */
function defaultScoreFor(level: TrustLevel): number {
  return level === 'verifiee' ? 90 : level === 'moderee' ? 55 : 20
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

/**
 * Publie une offre depuis le back-office.
 *
 * Écrit via le client service_role : `offers` n'a aucune policy RLS
 * d'écriture pour un utilisateur authentifié (voir 0002_rls.sql), même admin
 * — la vérification de rôle se fait donc ici, en code, avant tout accès
 * admin. Sans elle, un utilisateur quelconque avec la clé anon pourrait
 * essayer d'appeler cette action directement.
 */
export async function createOffer(_prev: OfferFormState, formData: FormData): Promise<OfferFormState> {
  if (!(await isAdmin())) return { error: 'Accès réservé aux administrateurs.' }

  const title = field(formData, 'title')
  const company = field(formData, 'company')
  const description = field(formData, 'description')

  if (!title || !company || !description) {
    return { error: 'Titre, entreprise et description sont obligatoires.' }
  }

  const trustLevel = field(formData, 'trust_level') as TrustLevel
  if (!TRUST_LEVELS.includes(trustLevel)) {
    return { error: 'Niveau de fiabilité invalide.' }
  }

  const requirements = field(formData, 'requirements')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)

  const hash = contentHash(title, company, description)
  const admin = createAdminClient()

  const { data: existing } = await admin.from('offers').select('id').eq('content_hash', hash).maybeSingle()
  if (existing) {
    return { error: 'Une offre identique (même titre, entreprise et description) existe déjà.' }
  }

  const { error } = await admin.from('offers').insert({
    title,
    company,
    category: field(formData, 'category') || 'Privée informelle',
    sector: field(formData, 'sector') || 'Autre',
    location: field(formData, 'location') || 'Non précisé',
    contract_type: field(formData, 'contract_type') || 'Non précisé',
    seniority: field(formData, 'seniority') || 'Non précisé',
    description,
    requirements,
    salary: field(formData, 'salary') || null,
    deadline: field(formData, 'deadline') || null,
    source: 'admin',
    source_url: field(formData, 'source_url') || null,
    trust_level: trustLevel,
    trust_score: defaultScoreFor(trustLevel),
    trust_reasons: ["Offre publiée manuellement par l'équipe KmerJob."],
    trust_analyzed_by: 'admin',
    content_hash: hash,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/offres')
  revalidatePath('/recherche')
  revalidatePath('/')
  redirect('/admin/offres')
}

/** Bascule une offre active/inactive (dépublication sans suppression). */
export async function toggleOfferActive(offerId: string, active: boolean): Promise<void> {
  if (!(await isAdmin())) return

  const admin = createAdminClient()
  await admin.from('offers').update({ active }).eq('id', offerId)

  revalidatePath('/admin/offres')
  revalidatePath('/recherche')
  revalidatePath('/')
}
