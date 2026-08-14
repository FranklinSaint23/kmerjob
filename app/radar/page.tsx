import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { RadarPageClient } from '@/components/RadarPageClient'

/**
 * Server Component : Navbar est elle-même un Server Component asynchrone
 * (elle lit la session pour décider connexion vs compte) — un composant
 * client ne peut pas l'importer directement. Le polling et l'état vivent
 * dans RadarPageClient, cette page ne fait que composer le cadre.
 */
export default function RadarPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1 bg-zinc-50 dark:bg-black">
        <RadarPageClient />
      </main>
      <Footer />
    </div>
  )
}
