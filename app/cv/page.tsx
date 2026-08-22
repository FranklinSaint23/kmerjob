import { CvPageClient } from '@/components/cv/CvPageClient'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'

export const metadata = {
  title: 'Analyser mon CV — Scoring IA',
  description: 'Déposez votre CV pour une évaluation par intelligence artificielle et recevez des conseils pour décrocher plus d\'offres.',
}

export default function CvPage() {
  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[#FBF7EF] text-[#0C2543]">
      <Navbar />
      <main className="flex-1">
        <CvPageClient />
      </main>
      <Footer />
    </div>
  )
}

