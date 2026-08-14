import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PaiementClient } from '@/components/premium/PaiementClient'

/**
 * Server Component : Navbar est elle-même un Server Component asynchrone
 * (elle lit la session pour décider connexion vs compte) — un composant
 * client ne peut pas l'importer directement. Le formulaire et les états de
 * résultat vivent dans PaiementClient, cette page ne fait que composer le
 * cadre — Navbar/Footer restent stables pendant que le contenu change d'état.
 */
export default function PaiementPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <PaiementClient />
      <Footer />
    </div>
  )
}
