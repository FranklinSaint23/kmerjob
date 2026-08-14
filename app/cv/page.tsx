import { CvPageClient } from '@/components/cv/CvPageClient'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'

/**
 * Server Component : Navbar est elle-même un Server Component asynchrone
 * (elle lit la session pour décider connexion vs compte) — un composant
 * client ne peut pas l'importer directement. Toute l'interactivité vit dans
 * CvPageClient, cette page ne fait que composer le cadre.
 */
export default function CvPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1 bg-zinc-50 dark:bg-black">
        <CvPageClient />
      </main>
      <Footer />
    </div>
  )
}
