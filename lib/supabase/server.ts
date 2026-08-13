import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/lib/types/database'

/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 * Toujours créé à la demande (jamais mis en variable de module) : les cookies
 * appartiennent à la requête en cours, un client partagé ferait fuiter la
 * session d'un utilisateur vers un autre.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Appelé depuis un Server Component : Next.js interdit d'écrire des
            // cookies hors action/route handler. Sans gravité — le middleware
            // rafraîchit déjà la session à chaque requête.
          }
        },
      },
    }
  )
}

/**
 * Utilisateur courant, ou null.
 *
 * Utilise getUser() et non getSession() : getSession() lit le cookie sans le
 * valider auprès du serveur d'auth, ce qui est falsifiable. getUser() vérifie
 * le JWT à la source — c'est la seule forme sur laquelle on peut fonder une
 * décision d'autorisation.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
