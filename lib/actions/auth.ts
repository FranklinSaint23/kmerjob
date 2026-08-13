'use server'

import { redirect } from 'next/navigation'

import { CITY_NAMES } from '@/lib/geo'
import { createClient } from '@/lib/supabase/server'

export interface AuthFormState {
  error: string | null
}

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou mot de passe incorrect.'
  if (/already registered|already exists/i.test(message)) return 'Un compte existe déjà avec cet e-mail.'
  if (/password.{0,20}(short|least|weak)/i.test(message)) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (/rate limit/i.test(message)) return 'Trop de tentatives — réessaie dans quelques minutes.'
  return message
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/')

  if (!email || !password) return { error: 'Renseigne ton e-mail et ton mot de passe.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: friendlyAuthError(error.message) }

  redirect(next.startsWith('/') ? next : '/')
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()

  if (!email || !password) return { error: 'Renseigne ton e-mail et ton mot de passe.' }
  if (password.length < 6) return { error: 'Le mot de passe doit contenir au moins 6 caractères.' }
  if (city && !CITY_NAMES.includes(city)) return { error: 'Ville non reconnue.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || null } },
  })

  if (error) return { error: friendlyAuthError(error.message) }

  // Complète le profil (ville) créé par le trigger handle_new_user. Best
  // effort : une erreur ici ne doit pas bloquer l'inscription, l'utilisateur
  // pourra renseigner sa ville depuis son compte.
  if (city && data.user) {
    await supabase.from('profiles').update({ city }).eq('id', data.user.id)
  }

  // Session absente => confirmation par e-mail exigée côté Supabase.
  if (!data.session) redirect('/inscription/verifier-email')

  redirect('/')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
