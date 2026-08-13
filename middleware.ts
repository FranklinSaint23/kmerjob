import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static, _next/image : assets compilés
     * - favicon, images, polices : statiques
     * - api/scraper, api/paiement/callback : appelées par des machines, elles
     *   s'authentifient par jeton/signature et n'ont pas de cookie de session.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/scraper|api/paiement/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
