import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Point d'atterrissage des liens envoyés par Supabase Auth (confirmation
 * d'e-mail, réinitialisation de mot de passe) : échange le `code` PKCE contre
 * une session, puis redirige.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/'}`)
    }
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien_invalide`)
}
