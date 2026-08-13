import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes exigeant une session. Le préfixe suffit (ex. /favoris/xyz). */
const PROTECTED_PREFIXES = ['/cv', '/radar', '/favoris', '/compte', '/premium/paiement']

/** Routes interdites à un utilisateur déjà connecté. */
const AUTH_ROUTES = ['/connexion', '/inscription']

let warnedAboutConfig = false

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Le middleware s'exécute sur chaque requête : sans ce garde-fou, un
  // .env.local incomplet fait échouer la totalité du site avec une erreur qui
  // ne dit pas ce qui manque. On laisse passer la requête — les pages qui ont
  // réellement besoin d'une session échoueront d'elles-mêmes, avec un message
  // pertinent.
  if (!url || !anonKey) {
    if (!warnedAboutConfig) {
      console.warn(
        '[supabase] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquante — ' +
          'authentification désactivée. Copie .env.local.example vers .env.local et renseigne-les.'
      )
      warnedAboutConfig = true
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Ne rien insérer entre createServerClient et getUser() : cet appel rafraîchit
  // le token expiré et réécrit les cookies. Un `return` anticipé au-dessus
  // déconnecterait l'utilisateur de façon aléatoire, symptôme classique et
  // pénible à diagnostiquer.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    // Mémorise la destination pour y revenir après connexion.
    url.searchParams.set('suivant', pathname)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Renvoyer CET objet response (et pas un NextResponse.next() neuf) : il porte
  // les cookies de session rafraîchis.
  return supabaseResponse
}
