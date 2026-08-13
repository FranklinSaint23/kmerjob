import { NextResponse } from 'next/server'

import { extractCv } from '@/lib/ai/cv-extraction'
import { extractTextFromFile } from '@/lib/cv/extract-text'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['pdf', 'txt']

/**
 * POST /api/cv — dépôt et analyse d'un CV.
 *
 * Enchaîne : contrôle du fichier → Storage → extraction de texte → analyse
 * (Groq, règles en repli) → upsert du profil.
 *
 * Le fichier part vers Storage AVANT l'analyse, à dessein : si l'extraction ou
 * l'appel LLM échoue, le CV de l'utilisateur est déjà en sécurité et l'analyse
 * pourra être relancée sans lui redemander son document.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Le fichier est vide.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Fichier trop volumineux (5 Mo maximum).' },
      { status: 413 }
    )
  }

  const extension = file.name.toLowerCase().split('.').pop() ?? ''
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return NextResponse.json(
      { error: 'Format accepté : PDF ou TXT.' },
      { status: 415 }
    )
  }

  // Chemin conforme à la policy Storage : premier segment = id utilisateur.
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('cvs')
    .upload(path, file, { contentType: file.type || 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json(
      { error: `Échec de l'envoi du fichier : ${uploadError.message}` },
      { status: 500 }
    )
  }

  const extraction = await extractTextFromFile(file, file.name)

  if (extraction.status !== 'ok') {
    // On garde le fichier et on crée quand même une ligne de profil : le
    // candidat pourra compléter à la main sans redéposer son CV.
    await supabase.from('cv_profiles').upsert(
      {
        user_id: user.id,
        file_path: path,
        file_name: file.name,
        raw_text: extraction.text,
        extracted_by: 'rules',
      },
      { onConflict: 'user_id' }
    )

    return NextResponse.json(
      {
        status: extraction.status,
        message: extraction.message,
        needsManualInput: true,
      },
      { status: 422 }
    )
  }

  const profile = await extractCv(extraction.text)

  const { data, error } = await supabase
    .from('cv_profiles')
    .upsert(
      {
        user_id: user.id,
        file_path: path,
        file_name: file.name,
        raw_text: extraction.text,
        skills: profile.skills,
        job_titles: profile.job_titles,
        languages: profile.languages,
        experience_years: profile.experience_years,
        education_label: profile.education_label,
        education_rank: profile.education_rank,
        location: profile.location,
        summary: profile.summary,
        extracted_by: profile.extracted_by,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: `Échec de l'enregistrement du profil : ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    status: 'ok',
    profile: data,
    // Permet à l'UI d'annoncer honnêtement le mode dégradé plutôt que de
    // laisser croire à une analyse IA qui n'a pas eu lieu.
    analyzedBy: profile.extracted_by,
  })
}

/** GET /api/cv — profil CV de l'utilisateur courant. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('cv_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
