import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/lib/types/database'

/**
 * Client Supabase pour les composants client ("use client").
 * Utilise la clé anon : toutes les requêtes passent par les policies RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
