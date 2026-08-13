import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const { data, error } = await supabase
    .from('favorites')
    .select('offer_id, created_at, offers(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ favorites: data })
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const { offer_id } = await request.json().catch(() => ({ offer_id: null }))
  if (typeof offer_id !== 'string') {
    return NextResponse.json({ error: 'offer_id manquant.' }, { status: 400 })
  }

  const { error } = await supabase.from('favorites').insert({ user_id: user.id, offer_id })
  // Doublon (déjà en favoris) : silencieux, l'état final voulu est atteint.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok' })
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const { offer_id } = await request.json().catch(() => ({ offer_id: null }))
  if (typeof offer_id !== 'string') {
    return NextResponse.json({ error: 'offer_id manquant.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('offer_id', offer_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ status: 'ok' })
}
