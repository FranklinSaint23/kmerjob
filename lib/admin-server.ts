import 'server-only'

import { createClient, getCurrentUser } from '@/lib/supabase/server'

/**
 * L'utilisateur courant est-il administrateur ?
 *
 * Lit `profiles.role` via le client serveur classique (RLS : chacun ne lit
 * que sa propre ligne, donc pas besoin du client service_role ici). La vraie
 * protection contre l'auto-promotion est au niveau base — voir la migration
 * 0004_admin.sql, qui retire à `authenticated` le droit d'écrire sur la
 * colonne `role` : même un utilisateur qui appellerait l'API PostgREST à la
 * main ne peut pas se nommer admin lui-même.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return data?.role === 'admin'
}
