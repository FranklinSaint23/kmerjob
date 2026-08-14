import { redirect } from 'next/navigation'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { isAdmin } from '@/lib/admin-server'

/**
 * Garde d'accès centralisée pour tout /admin/* : une seule vérification ici
 * plutôt que répétée dans chaque page. Un utilisateur non-admin (connecté ou
 * non) est renvoyé à l'accueil sans message — l'existence même du
 * back-office n'a pas à être confirmée à qui n'y a pas droit.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/')

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1 bg-zinc-50 dark:bg-black">{children}</main>
      <Footer />
    </div>
  )
}
